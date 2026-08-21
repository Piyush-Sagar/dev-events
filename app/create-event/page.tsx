import EventForm from '@/components/EventForm';

const CreateEventPage = () => {
    return (
        <section className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <h1>Create Event</h1>
                <p className="text-light-200">
                    Fill in the details below to publish your event to DevEvents.
                </p>
            </div>

            <EventForm mode="create" />
        </section>
    );
};

export default CreateEventPage;
