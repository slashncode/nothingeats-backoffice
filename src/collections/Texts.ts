import type { CollectionConfig } from 'payload';

import { checkOverride } from '../texts/icu';

/**
 * The shop's texts (journal record 042): code owns the keys and the default wording, editors
 * override it here. The keys come from the deployed shop (`/locales/<namespace>.<language>.json`)
 * through the sync; an empty override means the default applies.
 */
export const Texts: CollectionConfig = {
    slug: 'texts',
    labels: {
        singular: { de: 'Text', en: 'Text' },
        plural: { de: 'Texte', en: 'Texts' },
    },
    admin: {
        useAsTitle: 'key',
        defaultColumns: [
            'key',
            'defaultDe',
            'value',
            'orphaned',
        ],
        listSearchableFields: ['key', 'defaultDe', 'defaultEn'],
        group: { de: 'Shop', en: 'Shop' },
        description: {
            de: 'Alle Texte des Shops. Leer lassen = Standardtext. Platzhalter wie {count} müssen bleiben.',
            en: 'Every text of the shop. Leave empty for the default. Placeholders like {count} must stay.',
        },
    },
    defaultSort: 'key',
    versions: false,
    access: {
        // Keys come from the sync, never from the form; removed keys are marked, not deleted.
        create: () => false,
        delete: () => false,
    },
    fields: [
        {
            name: 'key',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            label: { de: 'Schlüssel', en: 'Key' },
            admin: { readOnly: true },
        },
        {
            name: 'namespace',
            type: 'select',
            required: true,
            options: [
                {
                    value: 'web',
                    label: { de: 'Shop', en: 'Shop' },
                },
                {
                    value: 'ui',
                    label: { de: 'Bausteine (nothingeats-ui)', en: 'Components (nothingeats-ui)' },
                },
            ],
            label: { de: 'Bereich', en: 'Area' },
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'defaultDe',
                    type: 'textarea',
                    label: { de: 'Standard (Deutsch)', en: 'Default (German)' },
                    admin: { readOnly: true },
                },
                {
                    name: 'defaultEn',
                    type: 'textarea',
                    label: { de: 'Standard (Englisch)', en: 'Default (English)' },
                    admin: { readOnly: true },
                },
            ],
        },
        {
            name: 'value',
            type: 'textarea',
            localized: true,
            label: { de: 'Eigener Text', en: 'Own text' },
            validate: (value: string | null | undefined, { siblingData, req }: { siblingData: Record<string, unknown>; req: { locale?: string | null } }) => {
                if (!value?.trim())
                    return true;
                const fallback = (req.locale === 'en'
                    ? siblingData.defaultEn
                    : siblingData.defaultDe) as string | undefined;
                return checkOverride(value, fallback ?? undefined);
            },
        },
        {
            name: 'orphaned',
            type: 'checkbox',
            defaultValue: false,
            label: { de: 'Nicht mehr im Shop', en: 'No longer in the shop' },
            admin: { readOnly: true, position: 'sidebar' },
        },
    ],
};
