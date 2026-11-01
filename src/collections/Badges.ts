import type { CollectionConfig, Condition } from 'payload';

import { cents, euros } from '../catalog/validation';
import { publishDocument, texts } from '../publishing';

export const BADGE_TOPIC = 'backoffice.badge.v1';

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The rule types loyalty knows; new types need code there. */
const RULE_TYPES = [
    {
        value: 'orders',
        label: { de: 'Bestellungen', en: 'Orders' },
    },
    {
        value: 'restaurants',
        label: { de: 'Verschiedene Restaurants', en: 'Different restaurants' },
    },
    {
        value: 'streak',
        label: { de: 'Tage in Folge', en: 'Days in a row' },
    },
    {
        value: 'level',
        label: { de: 'Level', en: 'Level' },
    },
    {
        value: 'orderItems',
        label: { de: 'Gerichte in einer Bestellung', en: 'Dishes in one order' },
    },
    {
        value: 'caloriesAvoided',
        label: { de: 'Vermiedene Kalorien', en: 'Calories avoided' },
    },
    {
        value: 'stampCards',
        label: { de: 'Volle Stempelkarten', en: 'Full stamp cards' },
    },
    {
        value: 'dealOrders',
        label: { de: 'Bestellungen mit Deal', en: 'Orders with a deal' },
    },
    {
        value: 'couponOrders',
        label: { de: 'Bestellungen mit Gutschein', en: 'Orders with a coupon' },
    },
    {
        value: 'orderTotal',
        label: { de: 'Bestellwert einer Bestellung', en: 'Total of one order' },
    },
    {
        value: 'moneyNotSpent',
        label: { de: 'Nicht ausgegebenes Geld', en: 'Money not spent' },
    },
    {
        value: 'placedBetween',
        label: { de: 'Bestellt zwischen (Uhrzeit)', en: 'Placed between (time)' },
    },
    {
        value: 'wheelPrize',
        label: { de: 'Nur vom Glücksrad', en: 'Only from the wheel' },
    },
];

const COUNT_RULES = [
    'orders',
    'restaurants',
    'streak',
    'level',
    'orderItems',
    'caloriesAvoided',
    'stampCards',
    'dealOrders',
    'couponOrders',
];
const MONEY_RULES = ['orderTotal', 'moneyNotSpent'];

const ruleIs = (types: string[]): Condition => (_, siblingData) => types.includes(siblingData?.type);

/** The rule as loyalty reads it: the same shapes as its former badges.json. */
function rule(value: Record<string, any>) {
    switch (value.type) {
        case 'placedBetween':
            return { type: value.type, fromHour: value.fromHour, toHour: value.toHour };
        case 'orderTotal':
        case 'moneyNotSpent':
            return {
                type: value.type,
                minCents: cents(value.minimum),
            };
        case 'wheelPrize':
            return { type: value.type };
        default:
            return { type: value.type, min: value.min };
    }
}

/**
 * Badges and the rule that earns each. Loyalty consumes them (`backoffice.badge.v1`); the rule
 * types are code there, the numbers and texts live here. Badges are never deleted (people own
 * them), only retired.
 */
export const Badges: CollectionConfig = {
    slug: 'badges',
    labels: {
        singular: { de: 'Abzeichen', en: 'Badge' },
        plural: { de: 'Abzeichen', en: 'Badges' },
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'tier', 'key', 'active'],
        group: { de: 'Belohnungen', en: 'Rewards' },
    },
    defaultSort: 'position',
    // Drafts: an editor saves the German text, then the English one, then publishes.
    versions: { drafts: true },
    access: {
        delete: () => false,
    },
    hooks: {
        afterChange: [
            publishDocument({
                topic: BADGE_TOPIC,
                type: 'nothingeats.backoffice.badge.published.v1',
                snapshot: doc => ({
                    badgeId: doc.id,
                    key: doc.key,
                    tier: doc.tier,
                    name: texts(doc.name, 'name', 'badges'),
                    description: texts(doc.description, 'description', 'badges'),
                    rule: rule(doc.rule),
                    position: doc.position,
                    active: Boolean(doc.active),
                }),
            }),
        ],
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            localized: true,
            label: { de: 'Name', en: 'Name' },
        },
        {
            name: 'key',
            type: 'text',
            required: true,
            unique: true,
            validate: (value: unknown) => typeof value === 'string' && KEY.test(value)
                ? true
                : 'lowercase-with-dashes',
            // Earned badges point at the key; it never changes after the badge exists.
            access: {
                update: () => false,
            },
            label: { de: 'Schlüssel', en: 'Key' },
            admin: {
                description: { de: 'Fest nach dem Anlegen, z. B. night-owl.', en: 'Fixed once created, e.g. night-owl.' },
            },
        },
        {
            name: 'description',
            type: 'textarea',
            required: true,
            localized: true,
            label: { de: 'Beschreibung', en: 'Description' },
        },
        {
            name: 'tier',
            type: 'select',
            required: true,
            options: [
                {
                    value: 'BRONZE',
                    label: { de: 'Bronze', en: 'Bronze' },
                },
                {
                    value: 'SILVER',
                    label: { de: 'Silber', en: 'Silver' },
                },
                {
                    value: 'GOLD',
                    label: { de: 'Gold', en: 'Gold' },
                },
            ],
            label: { de: 'Stufe', en: 'Tier' },
        },
        {
            name: 'rule',
            type: 'group',
            label: { de: 'Regel', en: 'Rule' },
            fields: [
                {
                    name: 'type',
                    type: 'select',
                    required: true,
                    options: RULE_TYPES,
                    label: { de: 'Art', en: 'Type' },
                },
                {
                    name: 'min',
                    type: 'number',
                    min: 1,
                    required: true,
                    label: { de: 'Mindestens', en: 'At least' },
                    admin: {
                        condition: ruleIs(COUNT_RULES),
                    },
                },
                {
                    name: 'minimum',
                    type: 'number',
                    min: 0,
                    required: true,
                    validate: euros,
                    admin: {
                        step: 0.01,
                        condition: ruleIs(MONEY_RULES),
                    },
                    label: { de: 'Mindestens (€)', en: 'At least (€)' },
                },
                {
                    type: 'row',
                    admin: {
                        condition: ruleIs(['placedBetween']),
                    },
                    fields: [
                        {
                            name: 'fromHour',
                            type: 'number',
                            min: 0,
                            max: 23,
                            required: true,
                            label: { de: 'Ab Stunde', en: 'From hour' },
                        },
                        {
                            name: 'toHour',
                            type: 'number',
                            min: 0,
                            max: 23,
                            required: true,
                            label: { de: 'Bis Stunde', en: 'To hour' },
                        },
                    ],
                },
            ],
        },
        {
            name: 'position',
            type: 'number',
            required: true,
            defaultValue: 0,
            label: { de: 'Position', en: 'Position' },
            admin: { position: 'sidebar' },
        },
        {
            name: 'active',
            type: 'checkbox',
            defaultValue: true,
            label: { de: 'Aktiv', en: 'Active' },
            admin: {
                position: 'sidebar',
                description: { de: 'Inaktive Abzeichen gibt es nicht mehr zu verdienen; verdiente bleiben.', en: 'Inactive badges can no longer be earned; earned ones stay.' },
            },
        },
    ],
};
