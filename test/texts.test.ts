import { describe, expect, it } from 'vitest';

import { checkOverride, placeholders } from '../src/texts/icu';
import { flatten } from '../src/texts/sync';

describe('text overrides', () => {
    it('finds placeholders, plural and select arguments included', () => {
        expect(placeholders('{count, plural, one {# Bestellung} other {# Bestellungen}} bei {name}')).toEqual(new Set(['count', 'name']));
        expect(placeholders('Gewonnen: {prize}')).toEqual(new Set(['prize']));
    });

    it('accepts an override with the same placeholders, refuses broken or changed ones', () => {
        expect(checkOverride('Du hast {prize} gewonnen!', 'Gewonnen: {prize}')).toBe(true);
        expect(checkOverride('Du hast gewonnen!', 'Gewonnen: {prize}')).toBe('Missing placeholders: {prize}');
        expect(checkOverride('Gewonnen: {preis}', 'Gewonnen: {prize}')).toBe('Missing placeholders: {prize}');
        expect(checkOverride('{count, plural, one {x}', '{count}')).toMatch(/^Not a valid message/);
    });

    it('flattens nested resources into dotted keys and leaves arrays out', () => {
        expect(flatten({
            coach: {
                title: 'Craving Coach',
                suggestions: ['a', 'b'],
                errors: { busy: 'Busy' },
            },
            app: 'NothingEats',
        })).toEqual({
            'coach.title': 'Craving Coach',
            'coach.errors.busy': 'Busy',
            'app': 'NothingEats',
        });
    });
});
