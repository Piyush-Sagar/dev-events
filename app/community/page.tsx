import { Suspense } from 'react';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import { getEvents } from '@/lib/events';

async function CommunityEvents() {
    let events;
    try {
        events = await getEvents();
    } catch {
        return <p className="rounded-xl border border-dark-200 p-6 text-light-200">Community events are temporarily unavailable. You can still <Link href="/" className="text-primary underline">discover real developer events</Link>.</p>;
    }
    if (!events.length) {
        return <p className="rounded-xl border border-dark-200 p-6 text-light-200">No community events have been published. Browse <Link href="/" className="text-primary underline">live developer events</Link> or publish one when the community database is configured.</p>;
    }
    return <ul className="events">{events.map((event) => <li key={event.slug} className="list-none"><EventCard {...event} /></li>)}</ul>;
}

export default function CommunityPage() {
    return <section className="space-y-10">
        <div className="flex flex-wrap items-start justify-between gap-6"><div><h1>Community events</h1><p className="mt-5 text-light-200">Events published by this community, separate from the live discovery feed.</p></div><Link href="/create-event" className="rounded-lg bg-primary px-5 py-3 font-semibold text-black">Publish an event</Link></div>
        <Suspense fallback={<p role="status">Loading community events...</p>}><CommunityEvents /></Suspense>
    </section>;
}
