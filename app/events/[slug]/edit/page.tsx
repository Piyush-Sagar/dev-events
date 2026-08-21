import { notFound } from 'next/navigation';

import EventForm, { EventFormInitialData } from '@/components/EventForm';
import { fallbackEvents } from '@/lib/constants';
import connectDB from '@/lib/mongodb';
import { Event } from '@/database';

interface Props {
    params: Promise<{ slug: string }>;
}

const EditEventPage = async ({ params }: Props) => {
    const { slug } = await params;

    let initialData: EventFormInitialData | undefined;

    try {
        await connectDB();
        const event = await Event.findOne({ slug }).lean();

        if (!event) {
            return notFound();
        }

        initialData = JSON.parse(JSON.stringify(event));
    } catch (error) {
        console.error('Error fetching event for editing:', error);

        const fallbackEvent = fallbackEvents.find((event) => event.slug === slug);
        if (!fallbackEvent) {
            return notFound();
        }

        initialData = fallbackEvent;
    }

    return (
        <section className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <h1>Edit Event</h1>
                <p className="text-light-200">
                    Update the details of your event. The slug changes automatically if you
                    rename the title.
                </p>
            </div>

            <EventForm mode="edit" slug={slug} initialData={initialData} />
        </section>
    );
};

export default EditEventPage;
