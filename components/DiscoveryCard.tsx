import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin, Radio } from 'lucide-react';
import type { DiscoveredEvent } from '@/lib/discovery/types';
import { formatEventDates } from '@/lib/discovery/format';

export default function DiscoveryCard({ event }: { event: DiscoveredEvent }) {
    return (
        <article className="discovery-card flex h-full flex-col rounded-2xl border border-dark-200 bg-dark-100/80 p-6">
            <div className="mb-5 flex items-center justify-between gap-3 text-xs text-light-200">
                <span className="flex items-center gap-1.5">{event.online ? <Radio size={14} /> : <MapPin size={14} />}{event.online ? 'Online' : event.country || 'In person'}</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">Live listing</span>
            </div>
            <h3 className="mb-4 text-xl leading-snug">
                <Link href={`/discover/${event.id}`} className="hover:text-primary">{event.title}</Link>
            </h3>
            <p className="mb-3 flex items-start gap-2 text-sm text-light-200"><CalendarDays size={16} className="mt-0.5 shrink-0" />{formatEventDates(event.startDate, event.endDate)}</p>
            <p className="mb-2 flex items-start gap-2 text-sm text-light-200"><MapPin size={16} className="mt-0.5 shrink-0" />{event.location}</p>
            {event.distanceKm !== undefined && <p className="mb-3 pl-6 text-xs text-primary">About {event.distanceKm < 1 ? '<1' : Math.round(event.distanceKm)} km to host city</p>}
            {event.reportedAttendance !== undefined && <p className="mb-3 pl-6 text-xs text-light-200">{event.reportedAttendance.toLocaleString('en-US')} attendees reported by provider</p>}
            <div className="mb-6 mt-3 flex flex-wrap gap-2">
                {event.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md border border-dark-200 px-2 py-1 text-xs text-light-200">{tag}</span>)}
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-dark-200 pt-4">
                <Link href={`/discover/${event.id}`} className="text-sm font-medium text-light-100 hover:text-primary">View details</Link>
                <a href={event.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-primary">Organizer <ArrowUpRight size={16} /></a>
            </div>
        </article>
    );
}
