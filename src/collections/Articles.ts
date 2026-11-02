import type { CollectionConfig } from 'payload';

import { slug } from '../catalog/validation';

/**
 * The blog: articles in German and English, served to the shop by this service itself (no
 * events: nothing else needs them). Each language is published on its own; a language that is not
 * published is not shown in that language.
 */
export const Articles: CollectionConfig = {
    slug: 'articles',
    labels: {
        singular: { de: 'Artikel', en: 'Article' },
        plural: { de: 'Artikel', en: 'Articles' },
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: [
            'title',
            'category',
            'publishedAt',
            '_status',
        ],
        group: { de: 'Blog', en: 'Blog' },
    },
    defaultSort: '-publishedAt',
    versions: { drafts: true },
    access: {
        // Visitors see published articles only; admins everything.
        read: ({ req }) => (req.user
            ? true
            : {
                    _status: { equals: 'published' },
                }),
    },
    hooks: {
        beforeChange: [
            // The date shown is the first publish, unless an editor sets one.
            ({ data }) => {
                if (data._status === 'published' && !data.publishedAt)
                    data.publishedAt = new Date().toISOString();
                return data;
            },
        ],
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            localized: true,
            label: { de: 'Titel', en: 'Title' },
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
                description: { de: 'Ein Slug für beide Sprachen, z. B. die-pizza-die-nie-kam.', en: 'One slug for both languages, e.g. the-pizza-that-never-came.' },
            },
        },
        {
            name: 'excerpt',
            type: 'textarea',
            required: true,
            localized: true,
            maxLength: 280,
            label: { de: 'Anreißer', en: 'Teaser' },
        },
        {
            name: 'cover',
            type: 'upload',
            relationTo: 'media',
            label: { de: 'Titelbild', en: 'Cover image' },
        },
        {
            name: 'body',
            type: 'richText',
            required: true,
            localized: true,
            label: { de: 'Text', en: 'Body' },
        },
        {
            name: 'category',
            type: 'relationship',
            relationTo: 'article-categories',
            label: { de: 'Rubrik', en: 'Category' },
            admin: { position: 'sidebar' },
        },
        {
            name: 'tags',
            type: 'relationship',
            relationTo: 'tags',
            hasMany: true,
            label: { de: 'Schlagwörter', en: 'Tags' },
            admin: { position: 'sidebar' },
        },
        {
            name: 'publishedAt',
            type: 'date',
            label: { de: 'Veröffentlicht am', en: 'Published on' },
            admin: {
                position: 'sidebar',
                date: { pickerAppearance: 'dayAndTime' },
            },
        },
    ],
};
