import assert from 'node:assert/strict';
import { test } from 'node:test';
import Event from '@/database/event.model';
import { fallbackEvents } from '@/lib/constants';

test('event validation normalizes title, slug, and 12-hour time before saving', async () => {
    const event = new Event({ ...fallbackEvents[0], title: '  TypeScript & Friends  ', time: '2:30 PM' });
    await event.validate();
    assert.equal(event.title, 'TypeScript & Friends');
    assert.equal(event.slug, 'typescript-friends');
    assert.equal(event.time, '14:30');
    event.title = 'Renamed Meetup';
    await event.validate();
    assert.equal(event.slug, 'renamed-meetup');
});

test('invalid dates, times, and URL-unfriendly titles are validation errors', async () => {
    for (const update of [
        { date: 'not-a-date' }, { date: '2026-02-30' }, { time: '25:00' }, { time: '14:30 PM' }, { title: '!!!' },
    ]) {
        const event = new Event({ ...fallbackEvents[0], ...update });
        await assert.rejects(event.validate(), { name: 'ValidationError' });
    }
});
