import { describe, expect, it } from 'vitest';

import { endOfHamburgDay, hamburgDay, startOfHamburgDay } from '../src/deals/days';

describe('hamburg days', () => {
    it('find the calendar day in Hamburg, whatever the instant\'s own zone', () => {
        expect(hamburgDay('2026-11-02T23:30:00Z')).toBe('2026-11-03');
        expect(hamburgDay('2026-11-02T12:00:00Z')).toBe('2026-11-02');
    });

    it('run from midnight to midnight, in winter and summer and across the changes', () => {
        expect(startOfHamburgDay('2026-11-02').toISOString()).toBe('2026-11-01T23:00:00.000Z');
        expect(endOfHamburgDay('2026-11-02').toISOString()).toBe('2026-11-02T23:00:00.000Z');
        expect(startOfHamburgDay('2026-07-15').toISOString()).toBe('2026-07-14T22:00:00.000Z');
        // 29 March 2026 has 23 hours, 25 October 2026 has 25.
        expect(endOfHamburgDay('2026-03-29').getTime() - startOfHamburgDay('2026-03-29').getTime()).toBe(23 * 3600_000);
        expect(endOfHamburgDay('2026-10-25').getTime() - startOfHamburgDay('2026-10-25').getTime()).toBe(25 * 3600_000);
        expect(endOfHamburgDay('2026-12-31').toISOString()).toBe('2026-12-31T23:00:00.000Z');
    });
});
