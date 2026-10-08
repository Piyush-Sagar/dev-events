import { Suspense } from 'react';
import ExploreBtn from '@/components/ExploreBtn';
import EventDiscovery from '@/components/EventDiscovery';
import { getInitialDiscovery } from '@/lib/discovery/home';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function DiscoveryContent({ searchParams }: { searchParams: SearchParams }) {
    const values = await searchParams;
    const params = new URLSearchParams();
    for (const key of ['city', 'q', 'radius', 'days', 'mode', 'sort', 'page', 'location']) {
        const value = values[key];
        if (typeof value === 'string') params.set(key, value);
    }
    const initialQuery = params.toString();
    let initialResult = null;
    let initialError = '';
    try {
        initialResult = await getInitialDiscovery(initialQuery);
    } catch (error) {
        initialError = error instanceof Error ? error.message : 'Live events are temporarily unavailable.';
    }
    return <EventDiscovery initialResult={initialResult} initialError={initialError} initialQuery={initialQuery} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
    return (
        <section id="home">
            <p className="mb-5 text-center text-sm font-semibold uppercase tracking-widest text-primary">Real events. Real communities.</p>
            <h1 className="text-center">Find your next<br />developer event</h1>
            <p className="mx-auto mt-5 max-w-2xl text-center leading-relaxed text-light-200">Discover upcoming conferences and tech communities near you, or join from anywhere. Find the people building what comes next.</p>
            <ExploreBtn />
            <Suspense fallback={<p role="status" className="mt-16 text-center text-light-200">Loading real developer events...</p>}>
                <DiscoveryContent searchParams={searchParams} />
            </Suspense>
        </section>
    );
}
