import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Event, Booking } from '@/database';
import { getEventBySlug } from '@/lib/events';
import { readEventForm } from '@/lib/event-input';
import { uploadEventImage } from '@/lib/cloudinary';
import { apiError, RequestError } from '@/lib/api-errors';

type RouteParams = { params: Promise<{ slug: string }> };

async function getSlug({ params }: RouteParams) {
    const { slug } = await params;
    if (!slug?.trim()) throw new RequestError('Invalid or missing slug.');
    return slug.trim().toLowerCase();
}

function refreshEvents() {
    revalidatePath('/', 'layout');
    revalidateTag('events', { expire: 0 });
}

export async function GET(_req: NextRequest, context: RouteParams) {
    try {
        const event = await getEventBySlug(await getSlug(context));
        if (!event) throw new RequestError('Event not found.', 404);
        return NextResponse.json({ message: 'Event fetched successfully', event });
    } catch (error) {
        return apiError(error, 'Unable to load the event.');
    }
}

async function updateEvent(req: NextRequest, context: RouteParams) {
    try {
        const slug = await getSlug(context);
        const { updates, file } = await readEventForm(req, true);
        await connectDB();
        const event = await Event.findOne({ slug });
        if (!event) throw new RequestError('Event not found.', 404);
        Object.assign(event, updates);
        await event.validate();
        if (file) event.image = await uploadEventImage(file);
        await event.save();
        refreshEvents();
        return NextResponse.json({ message: 'Event updated successfully', event });
    } catch (error) {
        return apiError(error, 'Unable to update the event. Please try again.');
    }
}

export async function PUT(req: NextRequest, context: RouteParams) {
    return updateEvent(req, context);
}

export async function PATCH(req: NextRequest, context: RouteParams) {
    return updateEvent(req, context);
}

export async function DELETE(_req: NextRequest, context: RouteParams) {
    try {
        const slug = await getSlug(context);
        await connectDB();
        const event = await Event.findOne({ slug });
        if (!event) throw new RequestError('Event not found.', 404);
        await Booking.deleteMany({ eventId: event._id });
        await event.deleteOne();
        refreshEvents();
        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error) {
        return apiError(error, 'Unable to delete the event. Please try again.');
    }
}
