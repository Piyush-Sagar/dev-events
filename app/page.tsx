import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { events } from "@/lib/constants"
import { title } from "process"


const home = () => {
  return (
    <div>
      <section>
        <h1 className="text-center">The Hub for Every Dev <br/> Event You Can't Miss</h1>
        <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>
        <ExploreBtn />

        <div className="mt-20 space-y-7">
          <h3>Featured Events</h3>
          <ol className="events">
            {events.map((event)=>(
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