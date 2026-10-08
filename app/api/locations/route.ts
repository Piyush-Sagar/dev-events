import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveryData } from '@/lib/discovery/provider';
import { DiscoveryError } from '@/lib/discovery/types';

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';
    if (query.length < 2 || query.length > 100) {
        return NextResponse.json({ cities: [] });
    }
    try {
        const { cities } = await getDiscoveryData();
        const matches = cities.filter((city) => city.label.toLowerCase().includes(query))
            .sort((a, b) => Number(b.label.toLowerCase().startsWith(query)) - Number(a.label.toLowerCase().startsWith(query)))
            .slice(0, 8);
        return NextResponse.json({ cities: matches });
    } catch (error) {
        return NextResponse.json({ message: error instanceof DiscoveryError ? error.message : 'Unable to load cities.' }, {
            status: error instanceof DiscoveryError ? error.status : 500,
        });
    }
}
