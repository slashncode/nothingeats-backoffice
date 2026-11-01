import type { Condition, GlobalConfig } from 'payload';
import { ValidationError } from 'payload';

import { cents, euros } from '../catalog/validation';
import { publishGlobal, texts } from '../publishing';

export const WHEEL_TOPIC = 'backoffice.wheel.v1';

/** The odds everyone gets unless an experiment variant has its own profile. */
export const DEFAULT_PROFILE = 'default';

const KEY = /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/;
const kindIs = (kinds: string[]): Condition => (_, siblingData) => kinds.includes(siblingData?.kind);

interface Prize { key: string; kind: string; percent?: number; amount?: number; maxDiscount?: number | null; minimumOrder?: number; xp?: number; badgeKey?: string; label: unknown }
interface Profile { name: string; weights?: { prize: string; weight: number }[] }

function prizeSnapshot(prize: Prize) {
    const base = {
        key: prize.key,
        kind: prize.kind,
        label: texts(prize.label, `prizes.${prize.key}.label`),
    };
    switch (prize.kind) {
        case 'PERCENT':
            return {
                ...base,
                value: prize.percent,
                maxDiscountCents: prize.maxDiscount == null
                    ? null
                    : cents(prize.maxDiscount),
                minimumOrderCents: cents(prize.minimumOrder ?? 0),
            };
        case 'AMOUNT':
            return {
                ...base,
                value: cents(prize.amount ?? 0),
                maxDiscountCents: null,
                minimumOrderCents: cents(prize.minimumOrder ?? 0),
            };
        case 'FREE_DELIVERY':
            return {
                ...base,
                value: 0,
                maxDiscountCents: null,
                minimumOrderCents: cents(prize.minimumOrder ?? 0),
            };
        case 'FREE_DISH':
            return {
                ...base,
                value: 0,
                maxDiscountCents: cents(prize.maxDiscount ?? 0),
                minimumOrderCents: 0,
            };
        case 'BONUS_XP':
            return { ...base, xp: prize.xp };
        default:
            return { ...base, badgeKey: prize.badgeKey };
    }
}

/**
 * The wheel of fortune: its prizes (in the order of the segments) and named odds profiles. Loyalty
 * consumes it (`backoffice.wheel.v1`) and draws there; the PostHog flag `spin-wheel-odds` only
 * picks the profile by its variant, everyone else gets `default`.
 */
export const Wheel: GlobalConfig = {
    slug: 'wheel',
    label: { de: 'Glücksrad', en: 'Wheel of fortune' },
    admin: {
        group: { de: 'Belohnungen', en: 'Rewards' },
    },
    // Drafts: labels need both languages before the wheel is published.
    versions: { drafts: true },
    hooks: {
        beforeChange: [
            ({ data }) => {
                const keys = new Set((data.prizes as Prize[] | undefined ?? []).map(prize => prize.key));
                const profiles = (data.profiles as Profile[] | undefined) ?? [];
                const errors: { path: string; message: string }[] = [];
                if (!profiles.some(profile => profile.name === DEFAULT_PROFILE))
                    errors.push({ path: 'profiles', message: `A profile named "${DEFAULT_PROFILE}" is needed` });
                profiles.forEach((profile, index) => {
                    const weights = profile.weights ?? [];
                    if (!weights.some(entry => entry.weight > 0))
                        errors.push({ path: `profiles.${index}.weights`, message: 'At least one prize needs a weight above 0' });
                    weights.forEach((entry, row) => {
                        if (!keys.has(entry.prize))
                            errors.push({ path: `profiles.${index}.weights.${row}.prize`, message: `No prize with the key ${entry.prize}` });
                    });
                });
                if (errors.length > 0)
                    throw new ValidationError({ global: 'wheel', errors });
                return data;
            },
        ],
        afterChange: [
            publishGlobal({
                topic: WHEEL_TOPIC,
                type: 'nothingeats.backoffice.wheel.published.v1',
                snapshot: doc => ({
                    prizes: (doc.prizes as Prize[]).map(prizeSnapshot),
                    profiles: (doc.profiles as Profile[]).map(profile => ({
                        name: profile.name,
                        weights: Object.fromEntries((profile.weights ?? []).map(entry => [entry.prize, entry.weight])),
                    })),
                }),
            }),
        ],
    },
    fields: [
        {
            name: 'prizes',
            type: 'array',
            required: true,
            minRows: 2,
            label: { de: 'Preise (im Uhrzeigersinn)', en: 'Prizes (clockwise)' },
            admin: { initCollapsed: true },
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'key',
                            type: 'text',
                            required: true,
                            validate: (value: unknown) => typeof value === 'string' && KEY.test(value)
                                ? true
                                : 'UPPER_SNAKE_CASE, e.g. PERCENT_10',
                            label: { de: 'Schlüssel', en: 'Key' },
                        },
                        {
                            name: 'kind',
                            type: 'select',
                            required: true,
                            label: { de: 'Art', en: 'Kind' },
                            options: [
                                {
                                    value: 'PERCENT',
                                    label: { de: 'Prozent-Gutschein', en: 'Percent coupon' },
                                },
                                {
                                    value: 'AMOUNT',
                                    label: { de: 'Euro-Gutschein', en: 'Euro coupon' },
                                },
                                {
                                    value: 'FREE_DELIVERY',
                                    label: { de: 'Gratis Lieferung', en: 'Free delivery' },
                                },
                                {
                                    value: 'FREE_DISH',
                                    label: { de: 'Gratis Gericht', en: 'Free dish' },
                                },
                                {
                                    value: 'BONUS_XP',
                                    label: { de: 'Bonus-XP', en: 'Bonus XP' },
                                },
                                {
                                    value: 'BADGE',
                                    label: { de: 'Abzeichen', en: 'Badge' },
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'label',
                    type: 'text',
                    required: true,
                    localized: true,
                    label: { de: 'Text auf dem Rad', en: 'Label on the wheel' },
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'percent',
                            type: 'number',
                            min: 1,
                            max: 100,
                            required: true,
                            label: { de: 'Prozent', en: 'Percent' },
                            admin: {
                                condition: kindIs(['PERCENT']),
                            },
                        },
                        {
                            name: 'amount',
                            type: 'number',
                            min: 0.01,
                            required: true,
                            validate: euros,
                            admin: {
                                step: 0.01,
                                condition: kindIs(['AMOUNT']),
                            },
                            label: { de: 'Betrag (€)', en: 'Amount (€)' },
                        },
                        {
                            name: 'maxDiscount',
                            type: 'number',
                            min: 0,
                            validate: (value: unknown) => value == null || euros(value),
                            admin: {
                                step: 0.01,
                                condition: kindIs(['PERCENT', 'FREE_DISH']),
                            },
                            label: { de: 'Höchstens (€)', en: 'At most (€)' },
                        },
                        {
                            name: 'minimumOrder',
                            type: 'number',
                            min: 0,
                            defaultValue: 0,
                            validate: euros,
                            admin: {
                                step: 0.01,
                                condition: kindIs(['PERCENT', 'AMOUNT', 'FREE_DELIVERY']),
                            },
                            label: { de: 'Mindestbestellwert (€)', en: 'Minimum order (€)' },
                        },
                        {
                            name: 'xp',
                            type: 'number',
                            min: 1,
                            required: true,
                            label: { de: 'XP', en: 'XP' },
                            admin: {
                                condition: kindIs(['BONUS_XP']),
                            },
                        },
                        {
                            name: 'badgeKey',
                            type: 'text',
                            required: true,
                            label: { de: 'Abzeichen (Schlüssel)', en: 'Badge (key)' },
                            admin: {
                                condition: kindIs(['BADGE']),
                                description: { de: 'Wer es schon hat, bekommt stattdessen Bonus-XP.', en: 'Who has it already gets bonus XP instead.' },
                            },
                        },
                    ],
                },
            ],
        },
        {
            name: 'profiles',
            type: 'array',
            required: true,
            minRows: 1,
            label: { de: 'Gewinnchancen', en: 'Odds' },
            admin: {
                description: { de: '"default" gilt für alle; weitere Profile heißen wie die Varianten des PostHog-Flags spin-wheel-odds.', en: '"default" applies to everyone; other profiles are named after the variants of the PostHog flag spin-wheel-odds.' },
            },
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    label: { de: 'Profil', en: 'Profile' },
                },
                {
                    name: 'weights',
                    type: 'array',
                    label: { de: 'Gewichte', en: 'Weights' },
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'prize',
                                    type: 'text',
                                    required: true,
                                    label: { de: 'Preis (Schlüssel)', en: 'Prize (key)' },
                                },
                                {
                                    name: 'weight',
                                    type: 'number',
                                    required: true,
                                    min: 0,
                                    label: { de: 'Gewicht', en: 'Weight' },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
