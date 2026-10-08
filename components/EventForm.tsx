'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface EventFormInitialData {
    title: string;
    description: string;
    overview: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    organizer: string;
    tags: string[];
    agenda: string[];
}

interface Props {
    mode: 'create' | 'edit';
    slug?: string;
    initialData?: EventFormInitialData;
}

type FormValues = Omit<EventFormInitialData, 'tags' | 'agenda'> & {
    tags: string;
    agenda: string;
};

const EMPTY_VALUES: FormValues = {
    title: '',
    description: '',
    overview: '',
    venue: '',
    location: '',
    date: '',
    time: '',
    mode: 'offline',
    audience: '',
    organizer: '',
    tags: '',
    agenda: '',
};

const TEXT_FIELD_KEYS = [
    'title',
    'description',
    'overview',
    'venue',
    'location',
    'date',
    'time',
    'mode',
    'audience',
    'organizer',
] as const;

const EventForm = ({ mode, slug, initialData }: Props) => {
    const router = useRouter();
    const [values, setValues] = useState<FormValues>(
        initialData
            ? {
                  title: initialData.title,
                  description: initialData.description,
                  overview: initialData.overview,
                  venue: initialData.venue,
                  location: initialData.location,
                  date: initialData.date,
                  time: initialData.time,
                  mode: initialData.mode,
                  audience: initialData.audience,
                  organizer: initialData.organizer,
                  tags: initialData.tags.join(', '),
                  agenda: initialData.agenda.join('\n'),
              }
            : EMPTY_VALUES
    );
    const [image, setImage] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError('');

        const tags = values.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        const agenda = values.agenda.split('\n').map((item) => item.trim()).filter(Boolean);

        if (tags.length === 0 || agenda.length === 0) {
            setError('Please provide at least one tag and one agenda item.');
            return;
        }

        if (mode === 'create' && !image) {
            setError('Please select an image file.');
            return;
        }
        if (image && (!image.type.startsWith('image/') || image.size > 5 * 1024 * 1024)) {
            setError('Please select an image file of 5 MB or smaller.');
            return;
        }

        const formData = new FormData();
        for (const key of TEXT_FIELD_KEYS) {
            formData.append(key, values[key]);
        }
        formData.append('tags', JSON.stringify(tags));
        formData.append('agenda', JSON.stringify(agenda));
        if (image) formData.append('image', image);

        setSubmitting(true);
        try {
            const res = await fetch(
                mode === 'create' ? '/api/events' : `/api/events/${slug}`,
                { method: mode === 'create' ? 'POST' : 'PUT', body: formData }
            );
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.event?.slug) {
                setError(data?.message ?? 'Something went wrong. Please try again.');
                return;
            }

            router.push(`/events/${data.event.slug}`);
            router.refresh();
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form id="event-form" onSubmit={handleSubmit}>
            {error && <p role="alert" className="error">{error}</p>}

            <div className="form-grid">
                <div className="field full-width">
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        required
                        maxLength={100}
                        placeholder="e.g. React Conf 2026"
                    />
                </div>

                <div className="field full-width">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        required
                        maxLength={1000}
                        placeholder="What is this event about?"
                    />
                </div>

                <div className="field full-width">
                    <label htmlFor="overview">Overview</label>
                    <textarea
                        id="overview"
                        name="overview"
                        value={values.overview}
                        onChange={handleChange}
                        required
                        maxLength={500}
                        placeholder="Short summary shown under Overview"
                    />
                </div>

                <div className="field">
                    <label htmlFor="venue">Venue</label>
                    <input
                        id="venue"
                        name="venue"
                        value={values.venue}
                        onChange={handleChange}
                        required
                        placeholder="Moscone Center"
                    />
                </div>

                <div className="field">
                    <label htmlFor="location">Location</label>
                    <input
                        id="location"
                        name="location"
                        value={values.location}
                        onChange={handleChange}
                        required
                        placeholder="San Francisco, CA"
                    />
                </div>

                <div className="field">
                    <label htmlFor="date">Date</label>
                    <input
                        id="date"
                        name="date"
                        type="date"
                        value={values.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="field">
                    <label htmlFor="time">Time</label>
                    <input
                        id="time"
                        name="time"
                        type="time"
                        value={values.time}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="field">
                    <label htmlFor="mode">Mode</label>
                    <select id="mode" name="mode" value={values.mode} onChange={handleChange} required>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>

                <div className="field">
                    <label htmlFor="audience">Audience</label>
                    <input
                        id="audience"
                        name="audience"
                        value={values.audience}
                        onChange={handleChange}
                        required
                        placeholder="React developers of all levels"
                    />
                </div>

                <div className="field">
                    <label htmlFor="organizer">Organizer</label>
                    <input
                        id="organizer"
                        name="organizer"
                        value={values.organizer}
                        onChange={handleChange}
                        required
                        placeholder="Meta React Team"
                    />
                </div>

                <div className="field full-width">
                    <label htmlFor="tags">Tags (comma separated)</label>
                    <input
                        id="tags"
                        name="tags"
                        value={values.tags}
                        onChange={handleChange}
                        required
                        placeholder="React, Frontend, JavaScript"
                    />
                </div>

                <div className="field full-width">
                    <label htmlFor="agenda">Agenda (one item per line)</label>
                    <textarea
                        id="agenda"
                        name="agenda"
                        value={values.agenda}
                        onChange={handleChange}
                        required
                        placeholder={'Opening Keynote\nWorkshop: Building with React 19'}
                    />
                </div>

                <div className="field full-width">
                    <label htmlFor="image">
                        Image{mode === 'edit' ? ' (leave empty to keep current)' : ''}
                    </label>
                    <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                        required={mode === 'create'}
                    />
                </div>
            </div>

            <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
            </button>
        </form>
    );
};

export default EventForm;
