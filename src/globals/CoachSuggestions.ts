import type { GlobalConfig } from 'payload';

/** The chips under the Craving Coach's greeting: ready-made cravings to start a chat with. */
export const CoachSuggestions: GlobalConfig = {
    slug: 'coach-suggestions',
    label: { de: 'Craving-Coach-Vorschläge', en: 'Craving Coach suggestions' },
    admin: {
        group: { de: 'Shop', en: 'Shop' },
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'suggestions',
            type: 'array',
            maxRows: 6,
            label: { de: 'Vorschläge', en: 'Suggestions' },
            admin: {
                description: { de: 'Kurz, wie ein Kunde es tippen würde; der Coach nimmt höchstens 500 Zeichen.', en: 'Short, the way a customer would type it; the coach takes 500 characters at most.' },
            },
            fields: [
                {
                    name: 'text',
                    type: 'text',
                    required: true,
                    localized: true,
                    maxLength: 80,
                    label: { de: 'Text', en: 'Text' },
                },
            ],
        },
    ],
};
