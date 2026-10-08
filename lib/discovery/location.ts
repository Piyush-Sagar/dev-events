import type { Coordinates } from './types';

export function locationFailureMessage(code: number) {
    return code === 1 ? 'Location access was denied. You can still choose a city.'
        : 'Unable to find your location. Choose a city or try again.';
}

export function locationQueryCoordinates(location: Coordinates) {
    // A city-radius search does not need precise street-level browser coordinates.
    return { lat: location.latitude.toFixed(2), lng: location.longitude.toFixed(2) };
}

export function shareableDiscoveryParams(params: URLSearchParams) {
    const shareable = new URLSearchParams(params);
    shareable.delete('lat');
    shareable.delete('lng');
    return shareable;
}
