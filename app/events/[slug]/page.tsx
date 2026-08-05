import {Suspense} from "react";
import EventDetails from "@/components/EventDetails";
import { fallbackEvents } from "@/lib/constants";

export async function generateStaticParams() {
  return fallbackEvents.map((event) => ({
    slug: event.slug,
  }));
}

const EventDetailsPage = async ({ params }: { params: Promise<{ slug: string }>}) => {
    const { slug } = await params;

    return (
        <main>
            <Suspense fallback={<div>Loading...</div>}>
                <EventDetails params={slug} />
            </Suspense>
        </main>
    )
}
export default EventDetailsPage