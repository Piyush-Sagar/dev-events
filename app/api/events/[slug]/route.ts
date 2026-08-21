import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Error as MongooseError } from 'mongoose';

import connectDB from '@/lib/mongodb';
import Event from '@/database/event.model';
import { Booking } from '@/database';
import { fallbackEvents } from '@/lib/constants';

// Define route params type for type safety
type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

// Text fields allowed to be updated directly on the event document
const UPDATABLE_TEXT_FIELDS = [
  'title',
  'description',
  'overview',
  'venue',
  'location',
  'date',
  'time',
  'mode',
  'audience',
  'organizer',
] as const;

type UpdatableTextField = (typeof UPDATABLE_TEXT_FIELDS)[number];

/**
 * GET /api/events/[slug]
 * Fetches a single events by its slug
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  // Await and extract slug from params
  const { slug } = await params;

  // Validate slug parameter
  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    return NextResponse.json(
      { message: 'Invalid or missing slug parameter' },
      { status: 400 }
    );
  }

  // Sanitize slug (remove any potential malicious input)
  const sanitizedSlug = slug.trim().toLowerCase();

  try {
    // Connect to database
    await connectDB();

    // Query events by slug
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    // Handle events not found
    if (!event) {
      return NextResponse.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 }
      );
    }

    // Return successful response with events data
    return NextResponse.json(
      { message: 'Event fetched successfully', event },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching events by slug:', error);
    }

    // Fall back to local events when database is unavailable
    const fallbackEvent = fallbackEvents.find(e => e.slug === sanitizedSlug);
    if (fallbackEvent) {
      console.warn('Falling back to local events data');
      return NextResponse.json(
        { message: 'Event fetched successfully (fallback)', event: fallbackEvent },
        { status: 200 }
      );
    }

    // Handle specific error types
    if (error instanceof Error) {
      // Handle database connection errors
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          { message: 'Database configuration error' },
          { status: 500 }
        );
      }

      // Return generic error with error message
      return NextResponse.json(
        { message: 'Failed to fetch events', error: error.message },
        { status: 500 }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Shared implementation for PUT and PATCH /api/events/[slug]
 * Accepts FormData; applies only the provided fields, with optional image replacement
 */
async function updateEvent(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { slug } = await params;

  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    return NextResponse.json(
      { message: 'Invalid or missing slug parameter' },
      { status: 400 }
    );
  }

  const sanitizedSlug = slug.trim().toLowerCase();

  try {
    await connectDB();

    const event = await Event.findOne({ slug: sanitizedSlug });

    if (!event) {
      return NextResponse.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const updates: Partial<Record<UpdatableTextField, string>> = {};
    for (const field of UPDATABLE_TEXT_FIELDS) {
      const value = formData.get(field);
      if (typeof value === 'string' && value.trim() !== '') {
        updates[field] = value;
      }
    }

    let tags: string[] | undefined;
    let agenda: string[] | undefined;
    try {
      if (formData.has('tags')) tags = JSON.parse(formData.get('tags') as string);
      if (formData.has('agenda')) agenda = JSON.parse(formData.get('agenda') as string);

      if ((tags && !Array.isArray(tags)) || (agenda && !Array.isArray(agenda))) {
        throw new Error();
      }
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON format for 'tags' or 'agenda' field" },
        { status: 400 }
      );
    }

    let newImageUrl: string | undefined;
    const file = formData.get('image');
    if (file instanceof File && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
          if (error) return reject(error);

          resolve(results);
        }).end(buffer);
      });

      newImageUrl = (uploadResult as { secure_url: string }).secure_url;
    }

    if (Object.keys(updates).length === 0 && !tags && !agenda && !newImageUrl) {
      return NextResponse.json(
        { message: 'No valid fields provided to update' },
        { status: 400 }
      );
    }

    Object.assign(event, updates);
    if (tags) event.tags = tags;
    if (agenda) event.agenda = agenda;
    if (newImageUrl) event.image = newImageUrl;

    // save() runs pre-save hooks (slug regeneration, date/time normalization) and full schema validation
    const updatedEvent = await event.save();

    revalidatePath('/', 'layout');
    revalidateTag('events', 'max');

    return NextResponse.json(
      { message: 'Event updated successfully', event: updatedEvent },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating event by slug:', error);
    }

    if (error instanceof MongooseError.ValidationError) {
      return NextResponse.json(
        { message: 'Event validation failed', error: error.message },
        { status: 400 }
      );
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    ) {
      return NextResponse.json(
        { message: 'An event with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update event', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/events/[slug]
 * Updates an existing event by its slug
 */
export async function PUT(
  req: NextRequest,
  params: RouteParams
): Promise<NextResponse> {
  return updateEvent(req, params);
}

/**
 * PATCH /api/events/[slug]
 * Partially updates an existing event by its slug
 */
export async function PATCH(
  req: NextRequest,
  params: RouteParams
): Promise<NextResponse> {
  return updateEvent(req, params);
}

/**
 * DELETE /api/events/[slug]
 * Deletes an event by its slug along with its related bookings
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { slug } = await params;

  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    return NextResponse.json(
      { message: 'Invalid or missing slug parameter' },
      { status: 400 }
    );
  }

  const sanitizedSlug = slug.trim().toLowerCase();

  try {
    await connectDB();

    const event = await Event.findOne({ slug: sanitizedSlug });

    if (!event) {
      return NextResponse.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 }
      );
    }

    await Booking.deleteMany({ eventId: event._id });
    await event.deleteOne();

    revalidatePath('/', 'layout');
    revalidateTag('events', 'max');

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting event by slug:', error);
    }

    return NextResponse.json(
      { message: 'Failed to delete event', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
