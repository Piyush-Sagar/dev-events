import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import connectDB from '@/lib/mongodb';
import Event from '@/database/event.model';
import { getEvents } from '@/lib/events';
import { readEventForm } from '@/lib/event-input';
import { uploadEventImage } from '@/lib/cloudinary';
import { apiError } from '@/lib/api-errors';

export async function POST(req: NextRequest) {
    try {
        const { updates, file } = await readEventForm(req);
        await connectDB();
        // Validate text before uploading, so invalid forms don't create orphan images.
        const event = new Event({ ...updates, image: '/images/event-full.png' });
        await event.validate();
        event.image = await uploadEventImage(file!);
        await event.save();
        revalidatePath('/', 'layout');
        revalidateTag('events', { expire: 0 });
        return NextResponse.json({ message: 'Event created successfully', event }, { status: 201 });
    } catch (error) {
        return apiError(error, 'Unable to create the event. Please try again.');
    }
}

export async function GET() {
    try {
        const events = await getEvents();
        return NextResponse.json({ message: 'Events fetched successfully', events });
    } catch (error) {
        return apiError(error, 'Community events are temporarily unavailable.');
    }
}
