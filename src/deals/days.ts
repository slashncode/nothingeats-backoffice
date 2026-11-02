// Deals run for whole days in Hamburg: from midnight to midnight, whatever the editor's browser
// or the server think the time zone is, and across daylight saving changes.

const ZONE = 'Europe/Berlin';

const dayFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
const partsFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
});

/** The calendar day of [value] in Hamburg, `YYYY-MM-DD`. */
export function hamburgDay(value: string | Date): string {
    return dayFormat.format(new Date(value));
}

/** How far Hamburg is ahead of UTC at [time], in milliseconds. */
function offsetAt(time: number): number {
    const parts = Object.fromEntries(partsFormat.formatToParts(new Date(time)).map(part => [
        part.type,
        Number(part.value),
    ]));
    return Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!) - time;
}

/** Midnight at the start of [day] (`YYYY-MM-DD`) in Hamburg. */
export function startOfHamburgDay(day: string): Date {
    const [year, month, date] = day.split('-').map(Number);
    const utcMidnight = Date.UTC(year!, month! - 1, date!);
    // The offset at UTC midnight is right except on the night of a change; one more step fixes it.
    const first = utcMidnight - offsetAt(utcMidnight);
    return new Date(utcMidnight - offsetAt(first));
}

/** Midnight at the end of [day] in Hamburg (the start of the next one). */
export function endOfHamburgDay(day: string): Date {
    const [year, month, date] = day.split('-').map(Number);
    return startOfHamburgDay(new Date(Date.UTC(year!, month! - 1, date! + 1)).toISOString().slice(0, 10));
}
