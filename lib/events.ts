import { cacheLife, cacheTag } from 'next/cache';
import { Booking, Event, type IEvent } from '@/database';
import { fallbackEvents } from '@/lib/constants';
import connectDB from '@/lib/mongodb';

// Values passed into client components must contain neither ObjectIds nor documents.
export type EventView = Omit<IEvent, 'createdAt' | 'updatedAt'> & {
  _id?: string;
  createdAt: string;
  updatedAt: string;
};

function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getEvents(): Promise<EventView[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('events');

  if (!process.env.MONGODB_URI) return serialize<EventView[]>(fallbackEvents);
  try {
    await connectDB();
    return serialize<EventView[]>(await Event.find().sort({ createdAt: -1 }).lean());
  } catch (error) {
    console.error('Unable to load events; showing samples:', error);
    return serialize<EventView[]>(fallbackEvents);
  }
}

export async function getEventBySlug(slug: string): Promise<EventView | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('events');

  const normalizedSlug = slug.trim().toLowerCase();
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      const event = await Event.findOne({ slug: normalizedSlug }).lean();
      return event ? serialize<EventView>(event) : null;
    } catch (error) {
      console.error('Unable to load event; checking samples:', error);
    }
  }
  const sample = fallbackEvents.find((event) => event.slug === normalizedSlug);
  return sample ? serialize<EventView>(sample) : null;
}

export async function getBookingCount(eventId: string): Promise<number | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('events');

  try {
    await connectDB();
    return await Booking.countDocuments({ eventId });
  } catch (error) {
    console.error('Unable to load booking count:', error);
    return null;
  }
}
