import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent} from "@/database";
import {cacheLife} from "next/cache";
import { fallbackEvents } from "@/lib/constants";

import connectDB from "@/lib/mongodb";
import { Event } from "@/database";

async function fetchEvents(): Promise<IEvent[]> {
  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 }).lean();
    
    // Serialize Mongoose documents to plain objects (converts ObjectIds to strings)
    const serializedEvents = JSON.parse(JSON.stringify(events));
    
    if (!serializedEvents || serializedEvents.length === 0) {
      return fallbackEvents as IEvent[];
    }
    
    return serializedEvents as IEvent[];
  } catch (error) {
    console.error('Error fetching events:', error);
    // Fall back to local events when API/DB fails
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