'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const EventActions = ({ slug }: { slug: string }) => {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (
            !window.confirm(
                'Delete this event and all its bookings? This action cannot be undone.'
            )
        ) {
            return;
        }

        setDeleting(true);
        setError('');
        try {
            const res = await fetch(`/api/events/${slug}`, { method: 'DELETE' });

            if (res.ok) {
                router.push('/');
                return;
            }

            const data = await res.json().catch(() => null);
            setError(data?.message ?? 'Failed to delete event.');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex w-full flex-col gap-3 border-t border-gray-700 pt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-light-200">
                Manage Event
            </p>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Link
                href={`/events/${slug}/edit`}
                className="w-full cursor-pointer rounded-[6px] border border-dark-200 bg-dark-200 px-4 py-2.5 text-center text-lg font-semibold text-light-100 hover:border-gray-600"
            >
                Edit Event
            </Link>

            <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full cursor-pointer rounded-[6px] bg-red-500/90 px-4 py-2.5 text-lg font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {deleting ? 'Deleting...' : 'Delete Event'}
            </button>
        </div>
    );
};

export default EventActions;
