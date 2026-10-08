'use server';

import { getEventBySlug, getEvents } from '@/lib/events';

export const getSimilarEventsBySlug = async (slug: string) => {
    const event = await getEventBySlug(slug);
    if (!event) return [];
    const events = await getEvents();
    return events.filter((candidate) =>
        candidate.slug !== event.slug && candidate.tags.some((tag) => event.tags.includes(tag))
    ).slice(0, 3);
}
