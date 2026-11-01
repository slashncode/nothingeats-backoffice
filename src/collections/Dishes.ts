import type { CollectionConfig } from 'payload';

import { cents, euros, slug } from '../catalog/validation';
import { ALLERGENS, DIETARY_TAGS, MOODS } from '../catalog/vocabulary';
import { image, publishDocument, texts } from '../publishing';

export const DISH_TOPIC = 'backoffice.dish.v1';

/** Catalog's rule: a vegan dish cannot contain milk or eggs. */
function veganWithoutAnimalAllergens(dietary: unknown, { siblingData }: { siblingData: Record<string, unknown> }): true | string {
    const allergens = (siblingData.allergens as string[] | undefined) ?? [];
    return Array.isArray(dietary) && dietary.includes('vegan') && (allergens.includes('milk') || allergens.includes('eggs'))
        ? 'A vegan dish cannot contain milk or eggs'
        : true;
}

/**
 * Dishes on the restaurants' menus. Published versions go to catalog (`backoffice.dish.v1`); like
 * restaurants they are archived, not deleted.
 */
export const Dishes: CollectionConfig = {
    slug: 'dishes',
    labels: {
        singular: { de: 'Gericht', en: 'Dish' },
        plural: { de: 'Gerichte', en: 'Dishes' },
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: [
            'name',
            'restaurant',
            'price',
            'available',
            '_status',
        ],
        group: { de: 'Katalog', en: 'Catalog' },
    },
    versions: { drafts: true },
    access: {
        delete: () => false,
    },
    hooks: {
        beforeValidate: [
            // Slugs are unique per restaurant (catalog's addresses are /restaurants/<slug>#<dish>).
            async ({ data, req, originalDoc }) => {
                const restaurant = data?.restaurant ?? originalDoc?.restaurant;
                const dishSlug = data?.slug ?? originalDoc?.slug;
                if (!restaurant || !dishSlug)
                    return data;
                const restaurantId = typeof restaurant === 'object'
                    ? restaurant.id
                    : restaurant;
                const clash = await req.payload.find({
                    collection: 'dishes',
                    where: {
                        and: [
                            {
                                restaurant: { equals: restaurantId },
                            },
                            {
                                slug: { equals: dishSlug },
                            },
                            ...(originalDoc?.id
                                ? [
                                        {
                                            id: { not_equals: originalDoc.id },
                                        },
                                    ]
                                : []),
                        ],
                    },
                    limit: 1,
                    depth: 0,
                    overrideAccess: true,
                    req,
                });
                if (clash.totalDocs > 0)
                    throw new Error(`The restaurant already has a dish with the slug ${dishSlug}`);
                return data;
            },
        ],
        afterChange: [
            publishDocument({
                topic: DISH_TOPIC,
                type: 'nothingeats.backoffice.dish.published.v1',
                snapshot: doc => ({
                    dishId: doc.id,
                    restaurantId: typeof doc.restaurant === 'object'
                        ? doc.restaurant.id
                        : doc.restaurant,
                    slug: doc.slug,
                    section: texts(doc.section, 'section', 'dishes'),
                    name: texts(doc.name, 'name', 'dishes'),
                    description: texts(doc.description, 'description', 'dishes'),
                    priceCents: cents(doc.price),
                    dietary: [
                        ...(doc.dietary ?? []),
                    ].sort(),
                    allergens: [
                        ...(doc.allergens ?? []),
                    ].sort(),
                    spiceLevel: doc.spiceLevel,
                    calories: doc.calories,
                    moods: [
                        ...(doc.moods ?? []),
                    ].sort(),
                    position: doc.position,
                    available: Boolean(doc.available),
                    image: image(doc.image),
                    archived: Boolean(doc.archived),
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
            name: 'restaurant',
            type: 'relationship',
            relationTo: 'restaurants',
            required: true,
            index: true,
            label: { de: 'Restaurant', en: 'Restaurant' },
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            index: true,
            validate: slug,
            label: { de: 'Slug (URL)', en: 'Slug (URL)' },
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'section',
                    type: 'text',
                    required: true,
                    localized: true,
                    label: { de: 'Abschnitt der Karte', en: 'Menu section' },
                },
                {
                    name: 'position',
                    type: 'number',
                    required: true,
                    defaultValue: 0,
                    label: { de: 'Position', en: 'Position' },
                },
            ],
        },
        {
            name: 'description',
            type: 'textarea',
            required: true,
            localized: true,
            label: { de: 'Beschreibung', en: 'Description' },
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            label: { de: 'Foto (sonst die Illustration)', en: 'Photo (else the illustration)' },
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'price',
                    type: 'number',
                    required: true,
                    min: 0.1,
                    validate: euros,
                    admin: { step: 0.01 },
                    label: { de: 'Preis (€)', en: 'Price (€)' },
                },
                {
                    name: 'calories',
                    type: 'number',
                    required: true,
                    min: 0,
                    max: 5000,
                    label: { de: 'Kalorien', en: 'Calories' },
                },
                {
                    name: 'spiceLevel',
                    type: 'number',
                    required: true,
                    min: 0,
                    max: 3,
                    defaultValue: 0,
                    label: { de: 'Schärfe (0–3)', en: 'Heat (0–3)' },
                },
            ],
        },
        {
            name: 'dietary',
            type: 'select',
            hasMany: true,
            options: DIETARY_TAGS,
            validate: veganWithoutAnimalAllergens,
            label: { de: 'Ernährung', en: 'Diet' },
        },
        {
            name: 'allergens',
            type: 'select',
            hasMany: true,
            options: ALLERGENS,
            label: { de: 'Allergene', en: 'Allergens' },
        },
        {
            name: 'moods',
            type: 'select',
            hasMany: true,
            options: MOODS,
            label: { de: 'Gelüste', en: 'Cravings' },
            admin: {
                description: { de: 'Danach suchen Filter und der Craving Coach.', en: 'Search filters and the Craving Coach use these.' },
            },
        },
        {
            name: 'available',
            type: 'checkbox',
            defaultValue: true,
            label: { de: 'Bestellbar', en: 'Available' },
            admin: { position: 'sidebar' },
        },
        {
            name: 'archived',
            type: 'checkbox',
            defaultValue: false,
            label: { de: 'Archiviert', en: 'Archived' },
            admin: {
                position: 'sidebar',
                description: { de: 'Verschwindet von der Karte; alte Bestellungen bleiben.', en: 'Leaves the menu; past orders stay.' },
            },
        },
    ],
};
