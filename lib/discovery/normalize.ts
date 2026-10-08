import { createHash } from 'node:crypto';
import { DiscoveryError, type Coordinates, type DiscoveredEvent, type EventCity } from './types';

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validCoordinates(value: unknown): value is Coordinates {
    return record(value) && typeof value.latitude === 'number' && Number.isFinite(value.latitude)
        && typeof value.longitude === 'number' && Number.isFinite(value.longitude)
        && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}

export function normalizeCities(payload: unknown): EventCity[] {
    if (!record(payload)) throw new DiscoveryError('Event locations are temporarily unavailable.', 502);
    const cities = Object.entries(payload).flatMap(([label, coordinates]) =>
        validCoordinates(coordinates) && label.trim()
            ? [{ label, latitude: coordinates.latitude, longitude: coordinates.longitude }]
            : [],
    ).sort((a, b) => a.label.localeCompare(b.label));
    if (!cities.length) throw new DiscoveryError('Event locations are temporarily unavailable.', 502);
    return cities;
}

export function safeEventUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    try {
        const url = new URL(value);
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
        return url.href;
    } catch {
        return null;
    }
}

export function normalizeEvents(payload: unknown, cities: EventCity[]): DiscoveredEvent[] {
    if (!Array.isArray(payload)) throw new DiscoveryError('The event provider returned an invalid response.', 502);
    const locations = new Map(cities.map((city) => [city.label.toLowerCase(), city]));
    const events = new Map<string, DiscoveredEvent>();

    for (const row of payload) {
        if (!record(row) || typeof row.name !== 'string' || !row.name.trim()
            || typeof row.location !== 'string' || !Array.isArray(row.date)
            || /^(cancelled|canceled|postponed)$/i.test(String(row.status))) continue;
        const url = safeEventUrl(row.hyperlink);
        const dates = row.date.filter((date): date is number =>
            typeof date === 'number' && Number.isFinite(date) && date >= 0 && date < Date.UTC(2100, 0, 1),
        ).sort((a, b) => a - b);
        if (!url || !dates.length) continue;
        const startDate = new Date(dates[0]).toISOString().slice(0, 10);
        const endDate = new Date(dates[dates.length - 1]).toISOString().slice(0, 10);
        const title = row.name.trim();
        const location = row.location.trim();
        const city = typeof row.city === 'string' ? row.city.trim() : location.replace(/\s*\([^)]*\)$/, '');
        const online = /^(online|virtual|remote)(\b|$)/i.test(location);
        const identityUrl = new URL(url);
        identityUrl.hash = '';
        for (const key of [...identityUrl.searchParams.keys()]) {
            if (key.startsWith('utm_')) identityUrl.searchParams.delete(key);
        }
        // One organizer/date/city may be listed twice with different titles or city aliases.
        const cityIdentity = online ? 'online' : `${String(row.country).toLowerCase()}|${city.toLowerCase().replace(/\bbangalore\b/g, 'bengaluru')}`;
        const identityHost = identityUrl.host.replace(/^www\./, '');
        const id = createHash('sha256').update(`${identityHost}${identityUrl.pathname}${identityUrl.search}|${startDate}|${cityIdentity}`).digest('hex').slice(0, 24);
        const coordinates = online ? undefined : locations.get(location.toLowerCase());
        const tags = Array.isArray(row.tags) ? row.tags.flatMap((tag) =>
            record(tag) && ['tech', 'topic'].includes(String(tag.key)) && typeof tag.value === 'string' && tag.value.trim()
                ? [tag.value.trim()] : [],
        ) : [];

        const event: DiscoveredEvent = {
            id, title, url, location, city, country: typeof row.country === 'string' ? row.country : '',
            startDate, endDate, online, tags: [...new Set(tags)],
            ...(typeof row.attendees === 'number' && Number.isSafeInteger(row.attendees) && row.attendees > 0
                ? { reportedAttendance: row.attendees } : {}),
            ...(coordinates ? { coordinates: { latitude: coordinates.latitude, longitude: coordinates.longitude } } : {}),
        };
        const existing = events.get(id);
        if (!existing) events.set(id, event);
        else events.set(id, {
            ...(event.title.length > existing.title.length ? event : existing),
            endDate: existing.endDate > event.endDate ? existing.endDate : event.endDate,
            tags: [...new Set([...existing.tags, ...event.tags])],
            reportedAttendance: existing.reportedAttendance ?? event.reportedAttendance,
        });
    }
    return [...events.values()];
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
    const radians = (degrees: number) => degrees * Math.PI / 180;
    const latitudeDelta = radians(b.latitude - a.latitude);
    const longitudeDelta = radians(b.longitude - a.longitude);
    const h = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
