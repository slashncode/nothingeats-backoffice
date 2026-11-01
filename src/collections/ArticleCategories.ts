import type { CollectionConfig } from 'payload';

import { slug } from '../catalog/validation';

/** Sections of the magazine, e.g. "Rezepte, die du nie kochst". */
export const ArticleCategories: CollectionConfig = {
    slug: 'article-categories',
    labels: {
        singular: { de: 'Rubrik', en: 'Category' },
        plural: { de: 'Rubriken', en: 'Categories' },
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'position'],
        group: { de: 'Magazin', en: 'Magazine' },
    },
    defaultSort: 'position',
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
        {
            name: 'position',
            type: 'number',
            required: true,
            defaultValue: 0,
            label: { de: 'Position', en: 'Position' },
            admin: { position: 'sidebar' },
        },
    ],
};
