import type { CollectionConfig } from 'payload';

/**
 * Images of restaurants, dishes and articles. Files live in Garage and are served publicly under
 * /media by the gateway; only raster formats, since the files are served from the shop's origin.
 */
export const Media: CollectionConfig = {
    slug: 'media',
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            localized: true,
            required: true,
        },
    ],
    upload: {
        mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/avif',
        ],
        // Variants (card, wide) are made by the sharp transformer in payload.config.ts. The
        // thumbnail is the public variant URL; Payload's own file route only knows the local disk.
        adminThumbnail: ({ doc }) => {
            const variants = doc.variants as Record<string, { url?: string | null } | undefined> | undefined;
            return variants?.card?.url ?? (doc.url as string | undefined) ?? null;
        },
    },
};
