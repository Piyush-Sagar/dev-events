export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface EventCity extends Coordinates {
    label: string;
}

export interface DiscoveredEvent {
    id: string;
    title: string;
    url: string;
    location: string;
    city: string;
    country: string;
    startDate: string;
    endDate: string;
    online: boolean;
    tags: string[];
    coordinates?: Coordinates;
    distanceKm?: number;
    reportedAttendance?: number;
}

export interface DiscoveryFilters {
    location?: Coordinates;
    city?: string;
    query: string;
    radiusKm: number;
    days: number;
    mode: 'all' | 'in-person' | 'online';
    sort: 'date' | 'distance' | 'popularity';
    page: number;
    pageSize: number;
}

export interface DiscoveryResult {
    events: DiscoveredEvent[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
    locationLabel: string | null;
    radiusKm: number | null;
    source: string;
    fetchedAt: string;
}

export class DiscoveryError extends Error {
    constructor(message: string, public status = 400) {
        super(message);
    }
}
