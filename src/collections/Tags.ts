import type { CollectionConfig } from 'payload';

import { slug } from '../catalog/validation';

/** Free tags on articles, e.g. "Käse" or "Mitternacht". */
export const Tags: CollectionConfig = {
    slug: 'tags',
    labels: {
        singular: { de: 'Schlagwort', en: 'Tag' },
        plural: { de: 'Schlagwörter', en: 'Tags' },
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug'],
        group: { de: 'Blog', en: 'Blog' },
    },
    versions: false,
    access: {
        read: () => true,
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
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            validate: slug,
            label: { de: 'Slug (URL)', en: 'Slug (URL)' },
        },
    ],
};
