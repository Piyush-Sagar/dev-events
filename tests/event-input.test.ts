import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseEventForm, readEventForm } from '@/lib/event-input';
import { RequestError } from '@/lib/api-errors';
import { fallbackEvents } from '@/lib/constants';

function eventForm() {
    const data = new FormData();
    const { title, description, overview, venue, location, date, time, mode, audience, organizer, tags, agenda } = fallbackEvents[0];
    for (const [key, value] of Object.entries({ title, description, overview, venue, location, date, time, mode, audience, organizer })) {
        data.set(key, value);
    }
    data.set('tags', JSON.stringify(tags));
    data.set('agenda', JSON.stringify(agenda));
    data.set('image', new File(['image bytes'], 'banner.png', { type: 'image/png' }));
    return data;
}

test('creation rejects malformed arrays rather than casting null or objects into the database', () => {
    for (const invalid of ['null', '{}', '[]', '[1]', '[""]', '["  "]', 'not json']) {
        for (const field of ['tags', 'agenda']) {
            const data = eventForm();
            data.set(field, invalid);
            assert.throws(() => parseEventForm(data), RequestError);
        }
    }
});

test('multipart input cannot override database identifiers, slugs, or image URLs', () => {
    const data = eventForm();
    data.set('_id', '000000000000000000000001');
    data.set('slug', 'injected-slug');
    data.set('createdAt', '2000-01-01');
    const { updates, file } = parseEventForm(data);
    assert.equal('_id' in updates, false);
    assert.equal('slug' in updates, false);
    assert.equal('createdAt' in updates, false);
    assert.equal('image' in updates, false);
    assert.equal(file?.name, 'banner.png');
});

test('partial updates preserve omitted fields but reject explicitly empty fields', () => {
    const data = new FormData();
    data.set('title', '  Renamed event  ');
    assert.deepEqual(parseEventForm(data, true).updates, { title: 'Renamed event' });
    data.set('description', ' ');
    assert.throws(() => parseEventForm(data, true), /description is required/);
    assert.throws(() => parseEventForm(new FormData(), true), /No fields/);
});

test('creation requires a real non-empty image and rejects oversized/non-image files', () => {
    for (const image of [
        'https://example.com/banner.png',
        new File([], 'empty.png', { type: 'image/png' }),
        new File(['text'], 'text.txt', { type: 'text/plain' }),
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' }),
    ]) {
        const data = eventForm();
        data.set('image', image);
        assert.throws(() => parseEventForm(data), RequestError);
    }
});

test('unsupported request bodies return a form error', async () => {
    await assert.rejects(
        readEventForm(new Request('http://localhost/api/events', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
        })),
        /submit event data as a form/,
    );
});
