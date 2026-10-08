export function formatEventDates(start: string, end: string) {
    const formatter = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const startLabel = formatter.format(new Date(`${start}T00:00:00Z`));
    return start === end ? startLabel : `${startLabel} – ${formatter.format(new Date(`${end}T00:00:00Z`))}`;
}
