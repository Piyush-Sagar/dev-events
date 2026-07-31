import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent} from "@/database";
import {cacheLife} from "next/cache";
import { fallbackEvents } from "@/lib/constants";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL environment variable is not set');
}

async function fetchEvents(): Promise<IEvent[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/events`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch events:', response.status, errorData);
      // Fall back to local events when API fails
      console.warn('Falling back to local events data');
      return fallbackEvents as IEvent[];
    }

    const data = await response.json();
    return data.events || fallbackEvents as IEvent[];
  } catch (error) {
    console.error('Error fetching events:', error);
    // Fall back to local events on network/parse errors
    console.warn('Falling back to local events data');
    return fallbackEvents as IEvent[];
  }
}

const Page = async () => {
    'use cache';
    cacheLife('hours')
    const events = await fetchEvents();

    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events.length > 0 ? (
                      events.map((event: IEvent) => (
                        <li key={event.title || event.slug} className="list-none">
                            <EventCard {...event} />
                        </li>
                      ))
                    ) : (
                      <li className="list-none text-center py-12">
                        <p className="text-muted-foreground">
                          No events available at the moment. Check back soon!
                        </p>
                      </li>
                    )}
                </ul>
            </div>
        </section>
    )
}

export default Page;