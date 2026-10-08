import {Suspense} from "react";
import EventDetails from "@/components/EventDetails";

const EventDetailsPage = ({ params }: { params: Promise<{ slug: string }>}) => {
    return (
        <Suspense fallback={<p role="status">Loading event...</p>}>
            <EventDetails params={params} />
        </Suspense>
    )
}
export default EventDetailsPage
