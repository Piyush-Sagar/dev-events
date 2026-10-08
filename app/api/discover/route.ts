import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveryData } from '@/lib/discovery/provider';
import { filterDiscoveredEvents, parseDiscoveryFilters } from '@/lib/discovery/query';
import { DiscoveryError } from '@/lib/discovery/types';

export async function GET(request: NextRequest) {
    try {
        const filters = parseDiscoveryFilters(request.nextUrl.searchParams);
        const { events, cities, source, fetchedAt } = await getDiscoveryData();
        return NextResponse.json({ ...filterDiscoveredEvents(events, cities, filters), source, fetchedAt }, {
            // Keep precise location queries out of shared HTTP caches.
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        return NextResponse.json({ message: error instanceof DiscoveryError ? error.message : 'Unable to load events.' }, {
            status: error instanceof DiscoveryError ? error.status : 500,
        });
    }
}
