'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { LocateFixed, Search } from 'lucide-react';
import DiscoveryCard from '@/components/DiscoveryCard';
import type { Coordinates, DiscoveryResult, EventCity } from '@/lib/discovery/types';
import { locationFailureMessage, locationQueryCoordinates, shareableDiscoveryParams } from '@/lib/discovery/location';

interface Props {
    initialResult: DiscoveryResult | null;
    initialError: string;
    initialQuery: string;
}

function displayError(error: unknown) {
    return error instanceof Error ? error.message : 'Unable to load events. Please try again.';
}

export default function EventDiscovery({ initialResult, initialError, initialQuery }: Props) {
    const initialParams = new URLSearchParams(initialQuery);
    const [result, setResult] = useState(initialResult);
    const [error, setError] = useState(initialError);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState(initialParams.get('q') || '');
    const [cityText, setCityText] = useState(initialParams.get('city') || '');
    const [city, setCity] = useState(initialParams.get('city') || '');
    const [radius, setRadius] = useState(initialParams.get('radius') || '100');
    const [days, setDays] = useState(initialParams.get('days') || '180');
    const [mode, setMode] = useState(initialParams.get('mode') || 'all');
    const [sort, setSort] = useState(initialParams.get('sort') || 'date');
    const [gps, setGps] = useState<Coordinates | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [suggestions, setSuggestions] = useState<EventCity[]>([]);
    const [suggestionError, setSuggestionError] = useState('');
    const [appliedQuery, setAppliedQuery] = useState(initialQuery);
    const activeRequest = useRef<AbortController | null>(null);
    const locationRequest = useRef(0);

    const loadEvents = useCallback(async (params: URLSearchParams, updateUrl = true) => {
        activeRequest.current?.abort();
        const controller = new AbortController();
        activeRequest.current = controller;
        const requestQuery = params.toString();
        setAppliedQuery(requestQuery);
        setLoading(true);
        setError('');
        if (updateUrl) {
            const shareable = shareableDiscoveryParams(params);
            const url = new URL(window.location.href);
            url.search = shareable.toString();
            url.hash = 'events';
            window.history.pushState(null, '', url);
        }
        try {
            const response = await fetch(`/api/discover?${requestQuery}`, { signal: controller.signal });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Unable to load live events.');
            if (!controller.signal.aborted) setResult(data);
        } catch (failure) {
            if (!controller.signal.aborted) setError(displayError(failure));
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const onBack = () => {
            const params = new URLSearchParams(window.location.search);
            setQuery(params.get('q') || '');
            setCityText(params.get('city') || '');
            setCity(params.get('city') || '');
            setRadius(params.get('radius') || '100');
            setDays(params.get('days') || '180');
            setMode(params.get('mode') || 'all');
            setSort(params.get('sort') || 'date');
            setGps(null);
            void loadEvents(params, false);
        };
        window.addEventListener('popstate', onBack);
        return () => {
            activeRequest.current?.abort();
            locationRequest.current += 1;
            window.removeEventListener('popstate', onBack);
        };
    }, [loadEvents]);

    useEffect(() => {
        if (city || cityText.trim().length < 2) return;
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(`/api/locations?q=${encodeURIComponent(cityText.trim())}`, { signal: controller.signal });
                const data = await response.json();
                if (!response.ok) throw new Error('City search is temporarily unavailable. Try using your location.');
                if (!controller.signal.aborted) {
                    setSuggestions(data.cities);
                    setSuggestionError(data.cities.length ? '' : 'No matching host city. Try a nearby major city or use your location.');
                }
            } catch (failure) {
                if (!controller.signal.aborted) setSuggestionError(displayError(failure));
            }
        }, 250);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [cityText, city]);

    function formParams(location = gps): URLSearchParams {
        const params = new URLSearchParams({ q: query.trim(), radius, days, mode, sort });
        if (mode !== 'online') {
            if (location) {
                const rounded = locationQueryCoordinates(location);
                params.set('lat', rounded.lat);
                params.set('lng', rounded.lng);
            } else if (city) params.set('city', city);
        }
        return params;
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (mode !== 'online' && cityText.trim() && !city && !gps) {
            setLocationError('Choose a city from the suggestions, or clear the city to browse worldwide.');
            return;
        }
        setLocationError('');
        void loadEvents(formParams());
    }

    function useLocation() {
        if (!navigator.geolocation) {
            setLocationError('Your browser does not support location. Choose a city instead.');
            return;
        }
        if (!window.isSecureContext) {
            setLocationError('Location requires HTTPS. Choose a city instead.');
            return;
        }
        setLocating(true);
        setLocationError('');
        const requestId = ++locationRequest.current;
        navigator.geolocation.getCurrentPosition((position) => {
            if (requestId !== locationRequest.current) return;
            const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            setGps(location);
            setCity('');
            setCityText('');
            setSuggestions([]);
            setLocating(false);
            const params = formParams(location);
            params.set('mode', 'in-person');
            params.delete('city');
            const rounded = locationQueryCoordinates(location);
            params.set('lat', rounded.lat);
            params.set('lng', rounded.lng);
            setMode('in-person');
            void loadEvents(params);
        }, (failure) => {
            if (requestId !== locationRequest.current) return;
            setLocating(false);
            setLocationError(locationFailureMessage(failure.code));
        }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    }

    function changePage(page: number) {
        const params = new URLSearchParams(appliedQuery);
        params.set('page', String(page));
        void loadEvents(params);
        document.getElementById('event-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return (
        <div id="events" className="mt-14 scroll-mt-24 space-y-8">
            <form onSubmit={submit} className="discovery-controls rounded-2xl border border-dark-200 bg-dark-100/90 p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div><h2 className="text-2xl font-bold">Find events around you</h2><p className="mt-2 text-sm text-light-200">Choose a city, or browse real developer events worldwide.</p></div>
                    <button type="button" onClick={useLocation} disabled={locating || loading} className="flex items-center gap-2 rounded-lg border border-primary/40 px-4 py-2.5 text-sm text-primary disabled:opacity-50"><LocateFixed size={16} />{locating ? 'Finding location...' : 'Use my location'}</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="flex flex-col gap-2 text-sm">Topic or event name<input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} placeholder="React, AI, security..." /></label>
                    <div className="relative flex flex-col gap-2 text-sm">
                        <label htmlFor="discovery-city">City</label>
                        <input id="discovery-city" value={cityText} disabled={mode === 'online'} autoComplete="off" maxLength={100} placeholder={gps ? 'Using your location' : 'Search Bengaluru, London...'} aria-describedby="city-hint" aria-controls={suggestions.length ? 'city-suggestions' : undefined} onChange={(event) => {
                            locationRequest.current += 1;
                            setLocating(false); setCityText(event.target.value); setCity(''); setGps(null);
                            setSuggestions([]); setSuggestionError(''); setLocationError('');
                        }} />
                        {suggestions.length > 0 && !city && <ul id="city-suggestions" aria-label="Matching cities" className="absolute top-20 z-20 max-h-60 w-full overflow-auto rounded-lg border border-dark-200 bg-dark-200 shadow-xl">
                            {suggestions.map((suggestion) => <li key={suggestion.label} className="list-none"><button type="button" className="w-full px-4 py-3 text-left hover:bg-primary/10 focus:bg-primary/10" onClick={() => {
                                setCity(suggestion.label); setCityText(suggestion.label); setGps(null); setSuggestions([]); setSuggestionError(''); setLocationError('');
                            }}>{suggestion.label}</button></li>)}
                        </ul>}
                    </div>
                    <label className="flex flex-col gap-2 text-sm">Radius<select value={radius} onChange={(event) => setRadius(event.target.value)} disabled={mode === 'online'}><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option><option value="250">250 km</option><option value="500">500 km</option><option value="1000">1,000 km</option></select></label>
                    <label className="flex flex-col gap-2 text-sm">When<select value={days} onChange={(event) => setDays(event.target.value)}><option value="7">Next 7 days</option><option value="30">Next 30 days</option><option value="90">Next 3 months</option><option value="180">Next 6 months</option><option value="365">Next year</option></select></label>
                    <label className="flex flex-col gap-2 text-sm">Event format<select value={mode} onChange={(event) => { setMode(event.target.value); setLocationError(''); setSuggestions([]); }}><option value="all">All formats</option><option value="in-person">In person</option><option value="online">Online only</option></select></label>
                    <label className="flex flex-col gap-2 text-sm">Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="date">Soonest first</option><option value="distance">Nearest first</option></select></label>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <p id="city-hint" className="max-w-xl text-xs leading-relaxed text-light-200">Location is optional. Distances are to host cities, not exact venues. Nearby results are in person; choose Online only for remote events. Approximate coordinates stay out of shared links.</p>
                    <button type="submit" disabled={loading || locating} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-black disabled:opacity-50"><Search size={17} />{loading ? 'Searching...' : 'Find events'}</button>
                </div>
                {(locationError || suggestionError) && <p role="alert" className="mt-4 text-sm text-amber-200">{locationError || suggestionError}</p>}
            </form>

            <div id="event-results" className="scroll-mt-24" aria-busy={loading}>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold">{result?.locationLabel ? `Near ${result.locationLabel}` : new URLSearchParams(appliedQuery).get('mode') === 'online' ? 'Online developer events' : 'Upcoming & ongoing events'}</h2>
                    <p role="status" className="text-sm text-light-200">{loading ? 'Loading live events...' : error ? 'Live data unavailable' : `${result?.total ?? 0} events${result?.radiusKm ? ` within ${result.radiusKm} km` : ''}`}</p>
                </div>
                {error ? <div role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-6"><p>{error}</p><button type="button" onClick={() => void loadEvents(new URLSearchParams(appliedQuery), false)} className="mt-4 font-semibold text-primary">Try again</button></div>
                    : loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-dark-200/50" />)}</div>
                    : result?.events.length ? <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{result.events.map((event) => <DiscoveryCard key={event.id} event={event} />)}</div>
                        {(result.page > 1 || result.hasMore) && <nav aria-label="Event pagination" className="mt-8 flex items-center justify-center gap-5"><button type="button" onClick={() => changePage(result.page - 1)} disabled={result.page === 1} className="rounded-lg border border-dark-200 px-4 py-2 disabled:opacity-40">Previous</button><span className="text-sm text-light-200">Page {result.page} of {Math.ceil(result.total / result.pageSize)}</span><button type="button" onClick={() => changePage(result.page + 1)} disabled={!result.hasMore} className="rounded-lg border border-dark-200 px-4 py-2 disabled:opacity-40">Next</button></nav>}
                    </> : <div className="rounded-xl border border-dark-200 p-8 text-center"><h3 className="text-xl">No matching events</h3><p className="mt-3 text-light-200">Try a wider radius, a longer date window, another topic, or online events. This community feed may not cover every local meetup.</p><button type="button" className="mt-5 font-semibold text-primary" onClick={() => { setCity(''); setCityText(''); setGps(null); setQuery(''); setMode('all'); setDays('180'); setRadius('100'); setSort('date'); void loadEvents(new URLSearchParams()); }}>Browse worldwide</button></div>}
            </div>
            <p className="text-xs leading-relaxed text-light-200">Data from <a href="https://developers.events/" target="_blank" rel="noopener noreferrer" className="text-primary underline">developers.events</a>, created by Aurélie Vache and contributors. <a href="https://github.com/scraly/developers-conferences-agenda/blob/main/LICENSE-CONTENT" target="_blank" rel="noopener noreferrer" className="underline">CC BY-NC 4.0</a>. Dates, topic labels, and city distances adapted by DevEvents. Community-curated coverage; confirm schedules and registration on the organizer&apos;s site.</p>
        </div>
    );
}
