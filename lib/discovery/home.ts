import { cacheLife, cacheTag } from 'next/cache';
import { getDiscoveryData } from './provider';
import { filterDiscoveredEvents, parseDiscoveryFilters } from './query';

export async function getInitialDiscovery(query: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag('discovery');
    const filters = parseDiscoveryFilters(new URLSearchParams(query));
    const { events, cities, source, fetchedAt } = await getDiscoveryData();
    return { ...filterDiscoveredEvents(events, cities, filters), source, fetchedAt };
}
