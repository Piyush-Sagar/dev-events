import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { getEvents } from "@/lib/events";

const Page = async () => {
    const events = await getEvents();

    return (
        <section id="home">
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can&apos;t Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div id="events" className="mt-20 scroll-mt-24 space-y-7">
                <h3>Featured Events</h3>
                {events.some((event) => !event._id) && (
                    <p className="text-sm text-light-200">Showing sample events. Booking and event management are available for saved events.</p>
                )}

                <ul className="events">
                    {events.length > 0 ? (
                      events.map((event) => (
                        <li key={event.slug} className="list-none">
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
