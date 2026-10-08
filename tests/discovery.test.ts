import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeCities, normalizeEvents, distanceKm } from '@/lib/discovery/normalize';
import { parseDiscoveryFilters, filterDiscoveredEvents } from '@/lib/discovery/query';
import { createEventCalendar } from '@/lib/discovery/calendar';
import { fetchProviderJson } from '@/lib/discovery/provider';
import { DiscoveryError, type DiscoveredEvent } from '@/lib/discovery/types';
import { locationFailureMessage, locationQueryCoordinates, shareableDiscoveryParams } from '@/lib/discovery/location';

const now = new Date('2026-10-08T12:00:00Z');
const cities = normalizeCities({
    'Bengaluru (India)': { latitude: 12.988, longitude: 77.622 },
    'Delhi (India)': { latitude: 28.627, longitude: 77.171 },
});
function source(name: string, location: string, start: string, end = start) {
    return {
        name, location, city: location.replace(/ \(.+\)/, ''), country: 'India',
        hyperlink: `https://example.com/${encodeURIComponent(name)}`,
        date: [Date.parse(start), Date.parse(end)], status: 'open',
        tags: [{ key: 'tech', value: 'typescript' }, { key: 'language', value: 'english' }],
    };
}
const rows = [
    source('Past conference', 'Bengaluru (India)', '2026-09-01'),
    source('Ongoing conference', 'Bengaluru (India)', '2026-10-06', '2026-10-09'),
    source('Next conference', 'Bengaluru (India)', '2026-10-20'),
    source('Delhi conference', 'Delhi (India)', '2026-10-20'),
    source('Online meetup', 'Online', '2026-10-11'),
    source('Unmapped event', 'Unknown (India)', '2026-10-11'),
];
const events = normalizeEvents(rows, cities);

test('normalization rejects unsafe URLs, malformed dates, and cancelled records, and deduplicates valid records', () => {
    const valid = rows[1];
    const result = normalizeEvents([
        valid, valid,
        { ...valid, hyperlink: 'javascript:alert(1)' },
        { ...valid, hyperlink: 'https://secret:password@example.com/event' },
        { ...valid, date: [NaN, 'tomorrow', 99999999999999999] },
        { ...valid, status: 'cancelled' },
        { ...valid, date: [] },
    ], cities);
    assert.equal(result.length, 1);
    assert.match(result[0].id, /^[a-f0-9]{24}$/);
    assert.deepEqual(result[0].tags, ['typescript']);
    assert.equal(result[0].coordinates?.latitude, 12.988);
    assert.throws(() => normalizeEvents({}, cities), DiscoveryError);
});

test('invalid and missing city coordinates are not invented', () => {
    assert.deepEqual(normalizeCities({ valid: { latitude: 0, longitude: 0 }, invalid: { latitude: 100, longitude: 0 } }), [{ label: 'valid', latitude: 0, longitude: 0 }]);
    assert.equal(events.find((event) => event.title === 'Unmapped event')?.coordinates, undefined);
    assert.throws(() => normalizeCities({}), DiscoveryError);
});

test('different titles and Bangalore/Bengaluru aliases do not duplicate the same organizer event', () => {
    const first = source('FlutterCon India', 'Bangalore (India)', '2026-11-21');
    const second = { ...source('FlutterCon India 2026', 'Bengaluru (India)', '2026-11-21'), hyperlink: first.hyperlink.replace('example.com', 'www.example.com') + '?utm_source=newsletter' };
    const result = normalizeEvents([first, second], cities);
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'FlutterCon India 2026');
    const anotherCity = { ...first, location: 'Delhi (India)', city: 'Delhi' };
    assert.equal(normalizeEvents([first, anotherCity], cities).length, 2);
});

test('nearby search includes ongoing events, excludes past/remote/unmapped/distant events, and preserves source records', () => {
    const filters = parseDiscoveryFilters(new URLSearchParams('city=Bengaluru%20(India)&radius=100'));
    const result = filterDiscoveredEvents(events, cities, filters, now);
    assert.deepEqual(result.events.map((event) => event.title), ['Ongoing conference', 'Next conference']);
    assert.equal(result.locationLabel, 'Bengaluru (India)');
    assert.equal(result.events[0].distanceKm, 0);
    assert.equal(events[1].distanceKm, undefined);
});

test('online-only results do not apply location radius or claim to be nearby', () => {
    const filters = parseDiscoveryFilters(new URLSearchParams('lat=0&lng=0&radius=1&mode=online'));
    const result = filterDiscoveredEvents(events, cities, filters, now);
    assert.deepEqual(result.events.map((event) => event.title), ['Online meetup']);
    assert.equal(result.locationLabel, null);
    assert.equal(result.radiusKm, null);
});

test('query, date window, sort, and pagination preserve the filtered event set', () => {
    const filters = parseDiscoveryFilters(new URLSearchParams('city=Bengaluru%20(India)&q=TYPEscript&days=7&pageSize=1'));
    const first = filterDiscoveredEvents(events, cities, filters, now);
    assert.equal(first.total, 1);
    assert.equal(first.hasMore, false);
    const second = filterDiscoveredEvents(events, cities, { ...filters, days: 180, page: 2 }, now);
    assert.equal(second.total, 2);
    assert.equal(second.events[0].title, 'Next conference');
    assert.equal(second.hasMore, false);
    assert.throws(() => filterDiscoveredEvents(events, cities, { ...filters, city: 'Made-up city' }, now), /Select a city/);
});

test('radius is enforced before display rounding', () => {
    const event: DiscoveredEvent = { ...events[1], coordinates: { latitude: 0, longitude: 0.4497 } };
    assert.ok(distanceKm({ latitude: 0, longitude: 0 }, event.coordinates!) > 50);
    const result = filterDiscoveredEvents([event], cities, parseDiscoveryFilters(new URLSearchParams('lat=0&lng=0&radius=50')), now);
    assert.equal(result.total, 0);
});

test('invalid locations and unbounded query parameters fail before contacting the provider', () => {
    for (const query of ['lat=0', 'lng=0', 'lat=91&lng=0', 'lat=0&lng=181', 'lat=&lng=0', 'lat=NaN&lng=0', 'lat=0&lng=0&city=Delhi', 'radius=0', 'radius=10000', 'page=1.5', 'days=0', 'mode=garbage', 'sort=garbage', 'pageSize=1000']) {
        assert.throws(() => parseDiscoveryFilters(new URLSearchParams(query)), DiscoveryError, query);
    }
});

test('provider failures and non-JSON payloads return a service error rather than sample events', async () => {
    for (const response of [new Response('down', { status: 503 }), new Response('<html>Error</html>')]) {
        await assert.rejects(fetchProviderJson('https://example.com/feed', async () => response), { name: 'Error', status: 502 });
    }
    assert.deepEqual(await fetchProviderJson('https://example.com/feed', async () => Response.json([rows[1]])), [rows[1]]);
});

test('calendar uses an exclusive all-day end and prevents title line injection', () => {
    const event = { ...events[1], title: 'Conference, A;B\nBEGIN:VEVENT', endDate: '2026-10-09' };
    const calendar = createEventCalendar(event, now);
    assert.ok(calendar.includes('DTEND;VALUE=DATE:20261010\r\n'));
    assert.ok(calendar.includes('SUMMARY:Conference\\, A\\;B\\nBEGIN:VEVENT\r\n'));
    assert.equal(calendar.match(/^BEGIN:VEVENT$/gm)?.length, 1);
    assert.ok(!calendar.includes('DTSTART:20261006T'));
});

test('calendar folds long Unicode lines without losing text or breaking UTF-8', () => {
    const calendar = createEventCalendar({ ...events[1], title: '🚀'.repeat(80) }, now);
    for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
    assert.ok(calendar.replace(/\r\n /g, '').includes('SUMMARY:' + '🚀'.repeat(80)));
});

test('location permission errors preserve manual search and precise coordinates stay out of shared links', () => {
    assert.match(locationFailureMessage(1), /denied.*choose a city/);
    assert.match(locationFailureMessage(3), /Choose a city/);
    assert.deepEqual(locationQueryCoordinates({ latitude: 12.98815675, longitude: 77.62260003796 }), { lat: '12.99', lng: '77.62' });
    const request = new URLSearchParams('lat=12.99&lng=77.62&radius=100&q=React&mode=in-person');
    const shareable = shareableDiscoveryParams(request);
    assert.equal(shareable.has('lat'), false);
    assert.equal(shareable.has('lng'), false);
    assert.equal(shareable.get('q'), 'React');
    assert.equal(shareable.get('radius'), '100');
    assert.equal(request.get('lat'), '12.99');
});
