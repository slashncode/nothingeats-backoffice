import type { GlobalConfig } from 'payload';

import { cents, euros } from '../catalog/validation';
import { publishGlobal } from '../publishing';

export const DEAL_PLANNER_TOPIC = 'backoffice.deal-planner.v1';

function positiveIntegers(value: unknown): true | string {
    return Array.isArray(value) && value.length > 0 && value.every(item => Number.isInteger(item) && item > 0)
        ? true
        : 'At least one whole number above 0';
}

/** How catalog's planner keeps deals running between the scheduled ones. */
export const DealPlanner: GlobalConfig = {
    slug: 'deal-planner',
    label: { de: 'Deal-Planer', en: 'Deal planner' },
    admin: {
        group: { de: 'Katalog', en: 'Catalog' },
    },
    hooks: {
        afterChange: [
            publishGlobal({
                topic: DEAL_PLANNER_TOPIC,
                type: 'nothingeats.backoffice.deal-planner.published.v1',
                snapshot: doc => ({
                    enabled: Boolean(doc.enabled),
                    concurrent: doc.concurrent,
                    durationsMinutes: doc.durationsMinutes,
                    percentages: doc.percentages,
                    minimumPriceCents: cents(doc.minimumPrice),
                }),
            }),
        ],
    },
    fields: [
        {
            name: 'enabled',
            type: 'checkbox',
            defaultValue: true,
            label: { de: 'Planer an', en: 'Planner on' },
        },
        {
            name: 'concurrent',
            type: 'number',
            required: true,
            min: 0,
            max: 20,
            defaultValue: 3,
            label: { de: 'Deals gleichzeitig', en: 'Deals at once' },
        },
        {
            name: 'durationsMinutes',
            type: 'number',
            hasMany: true,
            required: true,
            defaultValue: [30, 45, 60],
            validate: positiveIntegers,
            label: { de: 'Laufzeiten (Minuten)', en: 'Durations (minutes)' },
        },
        {
            name: 'percentages',
            type: 'number',
            hasMany: true,
            required: true,
            defaultValue: [20, 25, 30, 40],
            validate: positiveIntegers,
            label: { de: 'Rabatte (%)', en: 'Discounts (%)' },
        },
        {
            name: 'minimumPrice',
            type: 'number',
            required: true,
            defaultValue: 5,
            validate: euros,
            admin: { step: 0.01 },
            label: { de: 'Nur Gerichte ab (€)', en: 'Only dishes from (€)' },
        },
    ],
};
