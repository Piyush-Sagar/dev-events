import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { getDiscoveryData } from '@/lib/discovery/provider';
import { formatEventDates } from '@/lib/discovery/format';

async function DiscoveredEventDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/.test(id)) return notFound();
    let data;
    try {
        data = await getDiscoveryData();
    } catch {
        return <section className="rounded-2xl border border-dark-200 p-8"><h1 className="text-3xl">Live event unavailable</h1><p className="mt-5 text-light-200">The event provider could not be reached. Please try again shortly.</p><Link href="/" className="mt-6 inline-block text-primary">Return to events</Link></section>;
    }
    const event = data.events.find((candidate) => candidate.id === id);
    if (!event) return notFound();
    return (
        <article className="mx-auto w-full max-w-4xl">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-light-200 hover:text-primary"><ArrowLeft size={16} />Back to discovery</Link>
            <div className="rounded-2xl border border-dark-200 bg-dark-100/80 p-6 sm:p-10">
                <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary">{event.online ? 'Online developer event' : 'Developer conference'}</p>
                <h1 className="text-4xl leading-tight sm:text-5xl">{event.title}</h1>
                <div className="mt-8 flex flex-col gap-4 text-light-100">
                    <p className="flex items-center gap-3"><CalendarDays size={20} />{formatEventDates(event.startDate, event.endDate)}</p>
                    <p className="flex items-center gap-3"><MapPin size={20} />{event.location}</p>
                    {event.reportedAttendance !== undefined && <p className="text-sm text-light-200">{event.reportedAttendance.toLocaleString('en-US')} attendees reported by the provider; not independently verified.</p>}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">{event.tags.map((tag) => <span key={tag} className="pill">{tag}</span>)}</div>
                <div className="mt-10 rounded-xl border border-dark-200 p-6">
                    <h2 className="text-xl font-semibold">Plan your visit</h2>
                    <p className="mt-3 leading-relaxed text-light-200">The organizer&apos;s website has the latest agenda, exact venue, accessibility details, ticket prices, and registration availability. This listing supplies dates, but not a verified start time.</p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <a href={event.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-black">Visit organizer / Register<ArrowUpRight size={18} /></a>
                        <a href={`/api/discover/${event.id}/calendar`} className="inline-flex items-center gap-2 rounded-lg border border-dark-200 px-5 py-3"><CalendarDays size={18} />Add dates to calendar</a>
                    </div>
                </div>
                <p className="mt-8 text-xs leading-relaxed text-light-200">Listing by Aurélie Vache and contributors via <a href="https://developers.events/" target="_blank" rel="noopener noreferrer" className="text-primary underline">developers.events</a>. <a href="https://github.com/scraly/developers-conferences-agenda/blob/main/LICENSE-CONTENT" target="_blank" rel="noopener noreferrer" className="underline">CC BY-NC 4.0</a>. Date formatting and topic labels adapted by DevEvents. Registration takes place with the organizer.</p>
            </div>
        </article>
    );
}

export default function DiscoveredEventPage({ params }: { params: Promise<{ id: string }> }) {
    return <Suspense fallback={<p role="status">Loading event...</p>}><DiscoveredEventDetails params={params} /></Suspense>;
}
