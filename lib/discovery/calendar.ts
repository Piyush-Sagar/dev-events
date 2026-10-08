import type { DiscoveredEvent } from './types';

function escape(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// RFC 5545 uses a non-inclusive end date for all-day calendar events.
export function createEventCalendar(event: DiscoveredEvent, now = new Date()) {
    const end = new Date(`${event.endDate}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DevEvents//Developer Event Discovery//EN',
        'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${event.id}@dev-events`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${event.startDate.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, '')}`,
        `SUMMARY:${escape(event.title)}`, `LOCATION:${escape(event.location)}`,
        `DESCRIPTION:${escape(`Organizer: ${event.url}\nDates from developers.events; confirm times and exact venue with the organizer.`)}`,
        `URL:${event.url}`, 'END:VEVENT', 'END:VCALENDAR',
    ];
    // Fold long UTF-8 lines at 75 octets without splitting Unicode characters.
    return lines.map((line) => {
        const chunks: string[] = [];
        let current = '';
        for (const character of line) {
            if (Buffer.byteLength(current + character, 'utf8') > 75) {
                chunks.push(current);
                current = ' ';
            }
            current += character;
        }
        chunks.push(current);
        return chunks.join('\r\n');
    }).join('\r\n') + '\r\n';
}
