import {Suspense} from "react";
import EventDetails from "@/components/EventDetails";
import { fallbackEvents } from "@/lib/constants";

export async function generateStaticParams() {
  return fallbackEvents.map((event) => ({
    slug: event.slug,
  }));
}

const EventDetailsPage = ({ params }: { params: Promise<{ slug: string }>}) => {
    return (
        <Suspense fallback={<p role="status">Loading event...</p>}>
            <EventDetails params={params} />
        </Suspense>
    )
}
export default EventDetailsPage
