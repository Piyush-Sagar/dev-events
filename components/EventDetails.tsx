import {notFound} from "next/navigation";
import {getSimilarEventsBySlug} from "@/lib/actions/event.actions";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import EventActions from "@/components/EventActions";
import EventCard from "@/components/EventCard";
import { getBookingCount, getEventBySlug } from '@/lib/events';

const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string; }) => (
    <div className="flex-row-gap-2 items-center">
        <Image src={icon} alt={alt} width={17} height={17} />
        <p>{label}</p>
    </div>
)

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
    <div className="agenda">
        <h2>Agenda</h2>
        <ul>
            {agendaItems.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    </div>
)

const EventTags = ({ tags }: { tags: string[] }) => (
    <div className="flex flex-row gap-1.5 flex-wrap">
        {tags.map((tag) => (
            <div className="pill" key={tag}>{tag}</div>
        ))}
    </div>
)

const EventDetails = async ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    const event = await getEventBySlug(slug);
    if (!event) return notFound();

    const { title, description, image, overview, date, time, location, mode, agenda, audience, tags, organizer } = event;
    const [bookings, similarEvents] = await Promise.all([
        event._id ? getBookingCount(event._id) : Promise.resolve(null),
        getSimilarEventsBySlug(slug),
    ]);

    return (
        <section id="event">
            <div className="header">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>

            <div className="details">
                {/*    Left Side - Event Content */}
                <div className="content">
                    <Image src={image || '/images/event-full.png'} alt={title} width={800} height={457} className="banner" />

                    <section className="flex-col-gap-2">
                        <h2>Overview</h2>
                        <p>{overview}</p>
                    </section>

                    <section className="flex-col-gap-2">
                        <h2>Event Details</h2>

                        <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={date} />
                        <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
                        <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
                        <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
                        <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />
                    </section>

                    <EventAgenda agendaItems={agenda} />

                    <section className="flex-col-gap-2">
                        <h2>About the Organizer</h2>
                        <p>{organizer}</p>
                    </section>

                    <EventTags tags={tags} />
                </div>

                {/*    Right Side - Booking Form */}
                <aside className="booking">
                    <div className="signup-card">
                        <h2>Book Your Spot</h2>
                        {bookings !== null && (bookings > 0 ? (
                            <p className="text-sm">
                                Join {bookings} {bookings === 1 ? 'person who has' : 'people who have'} already booked their spot!
                            </p>
                        ): (
                            <p className="text-sm">Be the first to book your spot!</p>
                        ))}

                        {event._id ? (
                            <BookEvent eventId={event._id} slug={event.slug} />
                        ) : (
                            <p>This is a sample event. Booking becomes available when the event is saved to the database.</p>
                        )}
                    </div>

                    {event._id && <EventActions slug={event.slug} />}
                </aside>
            </div>

            {similarEvents.length > 0 && <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="events">
                    {similarEvents.map((similarEvent) => (
                        <EventCard key={similarEvent.slug} {...similarEvent} />
                    ))}
                </div>
            </div>}
        </section>
    )
}
export default EventDetails
