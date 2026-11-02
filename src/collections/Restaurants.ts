import type { CollectionConfig } from 'payload';

import { cents, euros, slug, timeOfDay } from '../catalog/validation';
import { CUISINES } from '../catalog/vocabulary';
import { image, publishDocument, texts } from '../publishing';

export const RESTAURANT_TOPIC = 'backoffice.restaurant.v1';

/**
 * Restaurants of the shop. The backoffice owns them; catalog consumes every published version
 * (`backoffice.restaurant.v1`) and keeps publishing its own catalog events. Never deleted: past
 * orders point at them, so a restaurant leaves the shop by being archived.
 */
export const Restaurants: CollectionConfig = {
    slug: 'restaurants',
    labels: {
        singular: { de: 'Restaurant', en: 'Restaurant' },
        plural: { de: 'Restaurants', en: 'Restaurants' },
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: [
            'name',
            'cuisine',
            'rating',
            'archived',
            '_status',
        ],
        group: { de: 'Katalog', en: 'Catalog' },
    },
    versions: { drafts: true },
    access: {
        delete: () => false,
    },
    hooks: {
        afterChange: [
            publishDocument({
                topic: RESTAURANT_TOPIC,
                type: 'nothingeats.backoffice.restaurant.published.v1',
                snapshot: doc => ({
                    restaurantId: doc.id,
                    slug: doc.slug,
                    name: doc.name,
                    description: texts(doc.description, 'description', 'restaurants'),
                    cuisine: doc.cuisine,
                    rating: doc.rating,
                    deliveryMinutes: doc.deliveryMinutes,
                    deliveryFeeCents: cents(doc.deliveryFee),
                    minimumOrderCents: cents(doc.minimumOrder),
                    latitude: doc.location.latitude,
                    longitude: doc.location.longitude,
                    opensAt: doc.opensAt,
                    closesAt: doc.closesAt,
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
            label: { de: 'Name', en: 'Name' },
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            validate: slug,
            label: { de: 'Slug (URL)', en: 'Slug (URL)' },
            admin: {
                description: { de: 'Teil der Adresse, z. B. phantom-pizza. Später besser nicht mehr ändern.', en: 'Part of the address, e.g. phantom-pizza. Better not changed later.' },
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
            name: 'cuisine',
            type: 'select',
            required: true,
            options: CUISINES,
            label: { de: 'Küche', en: 'Cuisine' },
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            label: { de: 'Bild', en: 'Image' },
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'rating',
                    type: 'number',
                    required: true,
                    min: 0,
                    max: 5,
                    admin: { step: 0.1 },
                    label: { de: 'Bewertung (0–5)', en: 'Rating (0–5)' },
                },
                {
                    name: 'deliveryMinutes',
                    type: 'number',
                    required: true,
                    min: 1,
                    max: 180,
                    label: { de: 'Lieferzeit (Minuten)', en: 'Delivery time (minutes)' },
                },
            ],
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'deliveryFee',
                    type: 'number',
                    required: true,
                    min: 0,
                    validate: euros,
                    admin: { step: 0.01 },
                    label: { de: 'Liefergebühr (€)', en: 'Delivery fee (€)' },
                },
                {
                    name: 'minimumOrder',
                    type: 'number',
                    required: true,
                    min: 0,
                    validate: euros,
                    admin: { step: 0.01 },
                    label: { de: 'Mindestbestellwert (€)', en: 'Minimum order (€)' },
                },
            ],
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'opensAt',
                    type: 'text',
                    required: true,
                    validate: timeOfDay,
                    label: { de: 'Öffnet (HH:mm)', en: 'Opens (HH:mm)' },
                },
                {
                    name: 'closesAt',
                    type: 'text',
                    required: true,
                    validate: timeOfDay,
                    label: { de: 'Schließt (HH:mm)', en: 'Closes (HH:mm)' },
                    admin: {
                        description: { de: 'Nach Mitternacht geht: 18:00–02:00.', en: 'Past midnight works: 18:00–02:00.' },
                    },
                },
            ],
        },
        {
            name: 'location',
            type: 'group',
            label: { de: 'Ort (für den Kurier)', en: 'Location (for the courier)' },
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'latitude',
                            type: 'number',
                            required: true,
                            min: -90,
                            max: 90,
                            label: { de: 'Breitengrad', en: 'Latitude' },
                        },
                        {
                            name: 'longitude',
                            type: 'number',
                            required: true,
                            min: -180,
                            max: 180,
                            label: { de: 'Längengrad', en: 'Longitude' },
                        },
                    ],
                },
            ],
        },
        {
            // The menu lives here: every dish of the restaurant, and new ones are added from this list
            // (the dish's restaurant is set and stays). Not stored; it reads the dishes' restaurant.
            name: 'dishes',
            type: 'join',
            collection: 'dishes',
            on: 'restaurant',
            defaultSort: ['section', 'position'],
            defaultLimit: 100,
            label: { de: 'Speisekarte', en: 'Menu' },
            admin: {
                allowCreate: true,
                defaultColumns: [
                    'name',
                    'section',
                    'position',
                    'price',
                    'available',
                    '_status',
                ],
            },
        },
        {
            name: 'archived',
            type: 'checkbox',
            defaultValue: false,
            label: { de: 'Archiviert', en: 'Archived' },
            admin: {
                position: 'sidebar',
                description: { de: 'Verschwindet aus dem Shop; alte Bestellungen bleiben.', en: 'Leaves the shop; past orders stay.' },
            },
        },
    ],
};
