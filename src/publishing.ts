import type { CollectionAfterChangeHook, CollectionSlug, GlobalAfterChangeHook, GlobalSlug, PayloadRequest } from 'payload';
import { ValidationError } from 'payload';

import { enqueue } from './outbox/outbox';

export interface Texts { de: string; en: string }

/**
 * A localized field read with `locale: 'all'` from the published version. Payload 4 publishes per
 * language; events carry every language, so publishing one language while another is missing fails
 * here (and rolls back) instead of reaching the shop half empty.
 */
export function texts(value: unknown, path: string, collection?: string): Texts {
    const all = (value ?? {}) as Partial<Record<keyof Texts, unknown>>;
    const missing = (['de', 'en'] as const).filter(locale => typeof all[locale] !== 'string' || (all[locale] as string).trim() === '');
    if (missing.length > 0) {
        throw new ValidationError({
            collection,
            errors: [
                { path, message: `Not published in: ${missing.join(', ')}. The shop needs every language; publish all languages.` },
            ],
        });
    }
    return {
        de: (all.de as string).trim(),
        en: (all.en as string).trim(),
    };
}

/** Alt texts may lag behind: the English one falls back to the German one. */
function altTexts(value: unknown): Texts {
    const all = (value ?? {}) as Partial<Record<keyof Texts, string | null>>;
    const de = all.de?.trim() || all.en?.trim() || '';
    return { de, en: all.en?.trim() || de };
}

interface MediaDoc {
    url?: string | null;
    width?: number | null;
    height?: number | null;
    focalX?: number | null;
    focalY?: number | null;
    alt?: unknown;
    variants?: Record<string, { url?: string | null } | null | undefined> | null;
}

export interface ImageSnapshot {
    url: string;
    cardUrl: string;
    wideUrl: string;
    width: number | null;
    height: number | null;
    focalX: number | null;
    focalY: number | null;
    alt: Texts;
}

/** An upload as events carry it: public URLs of the original and both variants, alt texts. */
export function image(value: unknown): ImageSnapshot | null {
    if (!value || typeof value !== 'object')
        return null;
    const media = value as MediaDoc;
    if (!media.url)
        return null;
    return {
        url: media.url,
        cardUrl: media.variants?.card?.url ?? media.url,
        wideUrl: media.variants?.wide?.url ?? media.url,
        width: media.width ?? null,
        height: media.height ?? null,
        focalX: media.focalX ?? null,
        focalY: media.focalY ?? null,
        alt: altTexts(media.alt),
    };
}

interface Publication<T> {
    topic: string;
    type: string;
    snapshot: (doc: Record<string, any>, req: PayloadRequest) => T | Promise<T>;
}

/**
 * Puts a full snapshot of a published document into the outbox, in the transaction that saves it.
 * Drafts stay in the CMS; only what is published reaches the shop.
 */
export function publishDocument<T>(publication: Publication<T>): CollectionAfterChangeHook {
    return async ({ doc, req, collection }) => {
        if (collection.versions?.drafts && doc._status !== 'published')
            return doc;
        const full = await req.payload.findByID({
            collection: collection.slug as CollectionSlug,
            id: doc.id,
            locale: 'all',
            depth: 1,
            draft: false,
            overrideAccess: true,
            req,
        });
        await enqueue(req, {
            topic: publication.topic,
            key: String(doc.id),
            type: publication.type,
            data: await publication.snapshot(full as Record<string, any>, req),
        });
        return doc;
    };
}

/** The same for a global (settings): one snapshot under the global's slug as key. */
export function publishGlobal<T>(publication: Publication<T>): GlobalAfterChangeHook {
    return async ({ doc, req, global, context }) => {
        if (global.versions?.drafts && doc._status !== 'published')
            return doc;
        // A first language published on its own (the seed); the event follows with the last one.
        if (context.partialPublish === true)
            return doc;
        const full = await req.payload.findGlobal({
            slug: global.slug as GlobalSlug,
            locale: 'all',
            depth: 1,
            overrideAccess: true,
            req,
        });
        await enqueue(req, {
            topic: publication.topic,
            key: global.slug,
            type: publication.type,
            data: await publication.snapshot(full as Record<string, any>, req),
        });
        return doc;
    };
}
