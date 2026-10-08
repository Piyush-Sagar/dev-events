import type { IEvent } from '@/database/event.model';
import { RequestError } from '@/lib/api-errors';

const TEXT_FIELDS = [
    'title', 'description', 'overview', 'venue', 'location',
    'date', 'time', 'mode', 'audience', 'organizer',
] as const;

type TextField = typeof TEXT_FIELDS[number];
export type EventUpdates = Partial<Pick<IEvent, TextField | 'tags' | 'agenda'>>;

export function parseEventForm(formData: FormData, partial = false) {
    const updates: EventUpdates = {};
    for (const field of TEXT_FIELDS) {
        if (partial && !formData.has(field)) continue;
        const value = formData.get(field);
        if (typeof value !== 'string' || !value.trim()) {
            throw new RequestError(`${field} is required.`);
        }
        updates[field] = value.trim();
    }

    for (const field of ['tags', 'agenda'] as const) {
        if (partial && !formData.has(field)) continue;
        const value = formData.get(field);
        let items: unknown;
        try {
            if (typeof value !== 'string') throw new Error();
            items = JSON.parse(value);
        } catch {
            throw new RequestError(`${field} must be a JSON array of non-empty strings.`);
        }
        if (!Array.isArray(items) || !items.length || items.some((item) => typeof item !== 'string' || !item.trim())) {
            throw new RequestError(`${field} must contain at least one non-empty string.`);
        }
        updates[field] = items.map((item: string) => item.trim());
    }

    const image = formData.get('image');
    let file: File | undefined;
    if (image !== null) {
        if (!(image instanceof File)) throw new RequestError('Image must be an uploaded file.');
        if (image.size > 0) {
            if (!image.type.startsWith('image/')) throw new RequestError('Please upload an image file.');
            if (image.size > 5 * 1024 * 1024) throw new RequestError('Image must be 5 MB or smaller.');
            file = image;
        }
    }
    if (!partial && !file) throw new RequestError('An image file is required.');
    if (partial && !Object.keys(updates).length && !file) throw new RequestError('No fields provided to update.');

    return { updates, file };
}

export async function readEventForm(request: Request, partial = false) {
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        throw new RequestError('Please submit event data as a form.');
    }
    return parseEventForm(formData, partial);
}
