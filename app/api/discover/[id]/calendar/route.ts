import { getDiscoveryData } from '@/lib/discovery/provider';
import { createEventCalendar } from '@/lib/discovery/calendar';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/.test(id)) return new Response('Event not found.', { status: 404 });
    try {
        const { events } = await getDiscoveryData();
        const event = events.find((candidate) => candidate.id === id);
        if (!event) return new Response('Event not found.', { status: 404 });
        return new Response(createEventCalendar(event), {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `attachment; filename="dev-event-${id}.ics"`,
            },
        });
    } catch {
        return new Response('Calendar is temporarily unavailable. Please try again.', { status: 502 });
    }
}
