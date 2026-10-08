import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import EventForm from '@/components/EventForm';
import { getEventBySlug } from '@/lib/events';

interface Props {
    params: Promise<{ slug: string }>;
}

const EditEventContent = async ({ params }: Props) => {
    const { slug } = await params;
    const event = await getEventBySlug(slug);
    if (!event) return notFound();

    return (
        <section className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <h1>Edit Event</h1>
                <p className="text-light-200">
                    Update the details of your event. The slug changes automatically if you
                    rename the title.
                </p>
            </div>

            {event._id ? (
                <EventForm mode="edit" slug={slug} initialData={event} />
            ) : (
                <p className="text-light-200">Sample events cannot be edited. Save events to the database to manage them.</p>
            )}
        </section>
    );
};

export default function EditEventPage({ params }: Props) {
    return (
        <Suspense fallback={<p role="status">Loading event...</p>}>
            <EditEventContent params={params} />
        </Suspense>
    );
}
