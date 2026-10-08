'use client';
import createBooking from "@/lib/actions/booking.action";
import { useState } from "react";
import { useRouter } from 'next/navigation';

const BookEvent = ({ eventId, slug }: { eventId: string; slug: string }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError('');
        try {
            const result = await createBooking({ eventId, slug, email });
            if (result.success) {
                setSubmitted(true);
                router.refresh();
            } else {
                setError(result.message);
            }
        } catch {
            setError('Unable to submit your booking. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <div id="book-event">
            {submitted ? (
                <p role="status" className="text-sm">Thank you for signing up!</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            id="email"
                            placeholder="Enter your email address"
                            required
                            autoComplete="email"
                            disabled={submitting}
                        />
                    </div>

                    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
                    <button type="submit" disabled={submitting} className="button-submit disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Booking...' : 'Book Your Spot'}</button>
                </form>
            )}
        </div>
    )
}
export default BookEvent;
