import type { CollectionConfig } from 'payload';

import { publishDocument } from '../publishing';

export const DEAL_TOPIC = 'backoffice.deal.v1';

function after(value: unknown, { siblingData }: { siblingData: Record<string, unknown> }): true | string {
    const start = siblingData.startsAt
        ? new Date(siblingData.startsAt as string).getTime()
        : Number.NaN;
    const end = value
        ? new Date(value as string).getTime()
        : Number.NaN;
    return end > start
        ? true
        : 'Must be after the start';
}

/**
 * Flash deals an editor schedules. Catalog plans its own on top (settings: the deal planner global)
 * and leaves a dish alone while a scheduled deal runs. A deal is never deleted, only cancelled.
 */
export const Deals: CollectionConfig = {
    slug: 'deals',
    labels: {
        singular: { de: 'Blitzdeal', en: 'Flash deal' },
        plural: { de: 'Blitzdeals', en: 'Flash deals' },
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
                    startsAt: new Date(doc.startsAt).toISOString(),
                    endsAt: new Date(doc.endsAt).toISOString(),
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
                        date: { pickerAppearance: 'dayAndTime' },
                    },
                    label: { de: 'Beginn', en: 'Starts' },
                },
                {
                    name: 'endsAt',
                    type: 'date',
                    required: true,
                    validate: after,
                    admin: {
                        date: { pickerAppearance: 'dayAndTime' },
                    },
                    label: { de: 'Ende', en: 'Ends' },
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
