import type { CollectionConfig } from 'payload';

import { endOfHamburgDay, hamburgDay, startOfHamburgDay } from '../deals/days';
import { publishDocument } from '../publishing';

export const DEAL_TOPIC = 'backoffice.deal.v1';

function notBeforeFirstDay(value: unknown, { siblingData }: { siblingData: Record<string, unknown> }): true | string {
    if (!value || !siblingData.startsAt)
        return 'Pick the last day';
    return hamburgDay(value as string) >= hamburgDay(siblingData.startsAt as string)
        ? true
        : 'The last day cannot be before the first';
}

/**
 * Deals an editor schedules for whole days: from midnight of the first day to midnight after the
 * last, in Hamburg. Catalog plans its own on top (settings: the deal planner global) and leaves a
 * dish alone while a scheduled deal runs. A deal is never deleted, only cancelled.
 */
export const Deals: CollectionConfig = {
    slug: 'deals',
    labels: {
        singular: { de: 'Tagesdeal', en: 'Deal of the day' },
        plural: { de: 'Tagesdeals', en: 'Deals of the day' },
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: [
            'title',
            'percentOff',
            'startsAt',
            'endsAt',
            'cancelled',
        ],
        group: { de: 'Katalog', en: 'Catalog' },
    },
    access: {
        delete: () => false,
    },
    hooks: {
        afterChange: [
            publishDocument({
                topic: DEAL_TOPIC,
                type: 'nothingeats.backoffice.deal.published.v1',
                snapshot: doc => ({
                    dealId: doc.id,
                    dishId: typeof doc.dish === 'object'
                        ? doc.dish.id
                        : doc.dish,
                    percentOff: doc.percentOff,
                    // The picked days, as the instants catalog needs.
                    startsAt: startOfHamburgDay(hamburgDay(doc.startsAt)).toISOString(),
                    endsAt: endOfHamburgDay(hamburgDay(doc.endsAt)).toISOString(),
                    cancelled: Boolean(doc.cancelled),
                }),
            }),
        ],
        beforeChange: [
            // A readable title for lists: "-30 % Margherita des Nichts".
            async ({ data, req }) => {
                if (data.dish && data.percentOff) {
                    const dishId = typeof data.dish === 'object'
                        ? data.dish.id
                        : data.dish;
                    const dish = await req.payload.findByID({
                        collection: 'dishes',
                        id: dishId,
                        depth: 0,
                        overrideAccess: true,
                        req,
                    });
                    data.title = `-${data.percentOff} % ${dish.name}`;
                }
                return data;
            },
        ],
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            admin: { hidden: true },
        },
        {
            name: 'dish',
            type: 'relationship',
            relationTo: 'dishes',
            required: true,
            label: { de: 'Gericht', en: 'Dish' },
        },
        {
            name: 'percentOff',
            type: 'number',
            required: true,
            min: 5,
            max: 90,
            label: { de: 'Rabatt (%)', en: 'Discount (%)' },
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'startsAt',
                    type: 'date',
                    required: true,
                    admin: {
                        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
                        description: { de: 'Ab Mitternacht', en: 'From midnight' },
                    },
                    label: { de: 'Erster Tag', en: 'First day' },
                },
                {
                    name: 'endsAt',
                    type: 'date',
                    required: true,
                    validate: notBeforeFirstDay,
                    admin: {
                        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
                        description: { de: 'Bis Mitternacht', en: 'Until midnight' },
                    },
                    label: { de: 'Letzter Tag', en: 'Last day' },
                },
            ],
        },
        {
            name: 'cancelled',
            type: 'checkbox',
            defaultValue: false,
            label: { de: 'Abgesagt', en: 'Cancelled' },
            admin: { position: 'sidebar' },
        },
    ],
};
