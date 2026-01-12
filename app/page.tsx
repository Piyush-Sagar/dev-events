import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { IEvent } from "@/database";
const BASE_URL=process.env.NEXT_PUBLIC_BASE_URL;


const home = async () => {
  const response=await fetch(`${BASE_URL}/api/events`)
  const {events}=await response.json();
  return (
    <div>
      <section>
        <h1 className="text-center">The Hub for Every Dev <br/> Event You Can't Miss</h1>
        <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>
        <ExploreBtn />

        <div className="mt-20 space-y-7">
          <h3>Featured Events</h3>
          <ol className="events">
            {events.map((event:IEvent)=>(
              <li key={event.title}>
                <EventCard {...event} />
              </li>
            ))}
          </ol>

        </div>
      </section>
    </div>
  )
}

export default home