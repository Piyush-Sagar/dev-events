import { cacheLife, cacheTag } from 'next/cache';
import { normalizeCities, normalizeEvents } from './normalize';
import { DiscoveryError } from './types';

export const EVENT_FEED_URL = 'https://developers.events/all-events.json';
export const CITY_FEED_URL = 'https://raw.githubusercontent.com/scraly/developers-conferences-agenda/main/page/src/misc/geolocations.json';

export async function fetchProviderJson(url: string, fetcher: typeof fetch = fetch): Promise<unknown> {
    try {
        const response = await fetcher(url, {
            // The raw feed exceeds Next's 2 MB fetch-cache limit. Cache the normalized
            // upcoming catalog in getDiscoveryData instead of the full historical body.
            signal: AbortSignal.timeout(10000), cache: 'no-store',
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Provider unavailable');
        return await response.json();
    } catch {
        // Never expose upstream HTML, arbitrary error details, or substitute fixtures.
        throw new DiscoveryError('Live events are temporarily unavailable. Please try again shortly.', 502);
    }
}

export async function getDiscoveryData() {
    'use cache';
    cacheLife('hours');
    cacheTag('discovery');
    const [eventPayload, cityPayload] = await Promise.all([
        fetchProviderJson(EVENT_FEED_URL), fetchProviderJson(CITY_FEED_URL),
    ]);
    const cities = normalizeCities(cityPayload);
    const today = new Date().toISOString().slice(0, 10);
    const events = normalizeEvents(eventPayload, cities).filter((event) => event.endDate >= today);
    return { events, cities, source: EVENT_FEED_URL, fetchedAt: new Date().toISOString() };
}
