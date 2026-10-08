import { distanceKm } from './normalize';
import { DiscoveryError, type DiscoveredEvent, type DiscoveryFilters, type EventCity } from './types';

function numberParam(params: URLSearchParams, key: string, fallback: number, min: number, max: number, integer = false) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const value = Number(raw);
    if (!raw.trim() || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
        throw new DiscoveryError(`Invalid ${key}.`);
    }
    return value;
}

export function parseDiscoveryFilters(params: URLSearchParams): DiscoveryFilters {
    const hasLatitude = params.has('lat');
    const hasLongitude = params.has('lng');
    if (hasLatitude !== hasLongitude) throw new DiscoveryError('Both latitude and longitude are required.');
    const city = params.get('city')?.trim() || undefined;
    if (city && hasLatitude) throw new DiscoveryError('Choose either a city or coordinates.');
    if (city && city.length > 150) throw new DiscoveryError('City name is too long.');
    const query = params.get('q')?.trim() || '';
    if (query.length > 100) throw new DiscoveryError('Search query is too long.');
    const mode = params.get('mode') || 'all';
    const sort = params.get('sort') || 'date';
    if (!['all', 'in-person', 'online'].includes(mode)) throw new DiscoveryError('Invalid event mode.');
    if (!['date', 'distance'].includes(sort)) throw new DiscoveryError('Invalid sort order.');
    return {
        ...(hasLatitude ? { location: {
            latitude: numberParam(params, 'lat', 0, -90, 90),
            longitude: numberParam(params, 'lng', 0, -180, 180),
        } } : {}),
        city, query,
        radiusKm: numberParam(params, 'radius', 100, 1, 1000),
        days: numberParam(params, 'days', 180, 1, 730, true),
        mode: mode as DiscoveryFilters['mode'], sort: sort as DiscoveryFilters['sort'],
        page: numberParam(params, 'page', 1, 1, 1000, true),
        pageSize: numberParam(params, 'pageSize', 12, 1, 50, true),
    };
}

export function filterDiscoveredEvents(events: DiscoveredEvent[], cities: EventCity[], filters: DiscoveryFilters, now = new Date()) {
    const city = filters.city ? cities.find((item) => item.label.toLowerCase() === filters.city!.toLowerCase()) : undefined;
    if (filters.city && !city) throw new DiscoveryError('Select a city from the search suggestions.');
    const location = city || filters.location;
    const today = now.toISOString().slice(0, 10);
    const until = new Date(`${today}T00:00:00Z`);
    until.setUTCDate(until.getUTCDate() + filters.days);
    const lastDay = until.toISOString().slice(0, 10);
    const query = filters.query.toLowerCase();

    const matches = events.flatMap((event) => {
        if (event.endDate < today || event.startDate > lastDay) return [];
        if (filters.mode === 'online' && !event.online) return [];
        if (filters.mode === 'in-person' && event.online) return [];
        if (query && ![event.title, event.location, ...event.tags].join(' ').toLowerCase().includes(query)) return [];
        if (location && filters.mode !== 'online') {
            // Online and unmapped events cannot be represented as nearby.
            if (event.online || !event.coordinates) return [];
            const distance = distanceKm(location, event.coordinates);
            if (distance > filters.radiusKm) return [];
            return [{ ...event, distanceKm: Math.round(distance * 10) / 10 }];
        }
        return [event];
    });

    matches.sort((a, b) => {
        if (filters.sort === 'distance' && location && filters.mode !== 'online') {
            const proximity = (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
            if (proximity !== 0) return proximity;
        }
        return a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title);
    });
    const offset = (filters.page - 1) * filters.pageSize;
    return {
        events: matches.slice(offset, offset + filters.pageSize), total: matches.length,
        page: filters.page, pageSize: filters.pageSize, hasMore: offset + filters.pageSize < matches.length,
        locationLabel: filters.mode === 'online' ? null : city?.label || (location ? 'Your location' : null),
        radiusKm: location && filters.mode !== 'online' ? filters.radiusKm : null,
    };
}
