// Catalog's rules, checked while editing so a publish is not rejected later by catalog (its DLQ).

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function slug(value: unknown): true | string {
    return typeof value === 'string' && value.length >= 2 && value.length <= 60 && SLUG.test(value)
        ? true
        : '2–60 lowercase letters, digits or dashes';
}

export function timeOfDay(value: unknown): true | string {
    return typeof value === 'string' && TIME.test(value)
        ? true
        : 'HH:mm, e.g. 11:30';
}

export function euros(value: unknown): true | string {
    return typeof value === 'number' && value >= 0 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-6
        ? true
        : 'An amount in euros with at most two decimals';
}

export function cents(value: number): number {
    return Math.round(value * 100);
}
