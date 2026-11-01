import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Endpoint, PayloadRequest, Where } from 'payload';
import { convertLexicalToHTML, defaultHTMLConverters, LinkHTMLConverter } from '@payloadcms/richtext-lexical/html';

// The content the backoffice serves itself (journal record 040): the magazine, the coach's
// suggestions and the text overrides. Read-only, public, short-cached; contract in docs/api.md.

type Language = 'de' | 'en';

function language(req: PayloadRequest): Language {
    const url = new URL(req.url ?? 'http://localhost');
    const raw = url.searchParams.get('lang') ?? req.headers.get('accept-language') ?? 'de';
    return raw.trim().toLowerCase().startsWith('en')
        ? 'en'
        : 'de';
}

function query(req: PayloadRequest, name: string): string | null {
    return new URL(req.url ?? 'http://localhost').searchParams.get(name);
}

const CACHE = { 'Cache-Control': 'public, max-age=60' };

function json(body: unknown, language: Language, status = 200) {
    return Response.json(body, {
        status,
        headers: { ...CACHE, 'Content-Language': language, 'Vary': 'Accept-Language' },
    });
}

function problem(status: number, code: string, title: string) {
    return Response.json({
        type: 'about:blank',
        status,
        code,
        title,
    }, {
        status,
        headers: { 'Content-Type': 'application/problem+json' },
    });
}

interface MediaDoc { url?: string | null; alt?: string | null; focalX?: number | null; focalY?: number | null; variants?: Record<string, { url?: string | null } | null> | null }

function image(value: unknown) {
    if (!value || typeof value !== 'object')
        return null;
    const media = value as MediaDoc;
    if (!media.url)
        return null;
    return {
        url: media.url,
        cardUrl: media.variants?.card?.url ?? media.url,
        wideUrl: media.variants?.wide?.url ?? media.url,
        alt: media.alt ?? '',
        focalX: media.focalX ?? null,
        focalY: media.focalY ?? null,
    };
}

interface Named { slug?: string; name?: string | null }

function named(value: unknown) {
    return value && typeof value === 'object' && (value as Named).slug
        ? { slug: (value as Named).slug!, name: (value as Named).name ?? '' }
        : null;
}

function summary(doc: Record<string, any>) {
    return {
        slug: doc.slug as string,
        title: doc.title as string,
        excerpt: doc.excerpt as string,
        cover: image(doc.cover),
        category: named(doc.category),
        tags: ((doc.tags ?? []) as unknown[]).map(named).filter(Boolean),
        publishedAt: (doc.publishedAt as string | null) ?? null,
    };
}

/** Links to other documents become paths in the shop. */
const converters = LinkHTMLConverter({
    internalDocToHref: ({ linkNode }) => {
        const doc = linkNode.fields.doc;
        const target = doc && typeof doc.value === 'object'
            ? (doc.value as { slug?: string })
            : undefined;
        if (!target?.slug)
            return '#';
        switch (doc?.relationTo) {
            case 'articles': return `/articles/${target.slug}`;
            case 'restaurants': return `/restaurants/${target.slug}`;
            default: return '#';
        }
    },
});

function bodyHtml(body: unknown): string {
    if (!body || typeof body !== 'object')
        return '';
    return convertLexicalToHTML({
        data: body as SerializedEditorState,
        converters: {
            ...defaultHTMLConverters,
            ...converters,
        },
        disableContainer: true,
    });
}

const PUBLISHED: Where = {
    _status: { equals: 'published' },
};

export const contentEndpoints: Endpoint[] = [
    {
        path: '/v1/articles',
        method: 'get',
        handler: async (req) => {
            const lang = language(req);
            const filters: Where[] = [PUBLISHED];
            const category = query(req, 'category');
            const tag = query(req, 'tag');
            if (category) {
                filters.push({
                    'category.slug': { equals: category },
                });
            }
            if (tag) {
                filters.push({
                    'tags.slug': { equals: tag },
                });
            }
            const page = Math.max(1, Number(query(req, 'page')) || 1);
            const limit = Math.min(50, Math.max(1, Number(query(req, 'limit')) || 12));
            const found = await req.payload.find({
                collection: 'articles',
                where: { and: filters },
                locale: lang,
                fallbackLocale: false,
                depth: 1,
                page,
                limit,
                sort: '-publishedAt',
                overrideAccess: true,
            });
            return json({
                items: found.docs.map(summary),
                page: found.page,
                totalPages: found.totalPages,
            }, lang);
        },
    },
    {
        path: '/v1/articles/:slug',
        method: 'get',
        handler: async (req) => {
            const lang = language(req);
            const found = await req.payload.find({
                collection: 'articles',
                where: {
                    and: [
                        PUBLISHED,
                        {
                            slug: {
                                equals: String(req.routeParams?.slug ?? ''),
                            },
                        },
                    ],
                },
                locale: lang,
                fallbackLocale: false,
                depth: 2,
                limit: 1,
                overrideAccess: true,
            });
            const doc = found.docs[0];
            if (!doc)
                return problem(404, 'ARTICLE_NOT_FOUND', 'There is no such article in this language');
            const html = bodyHtml(doc.body);
            const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
            return json({
                ...summary(doc),
                bodyHtml: html,
                readingMinutes: Math.max(1, Math.round(words / 200)),
            }, lang);
        },
    },
    {
        path: '/v1/article-categories',
        method: 'get',
        handler: async (req) => {
            const lang = language(req);
            const found = await req.payload.find({
                collection: 'article-categories',
                locale: lang,
                pagination: false,
                sort: 'position',
                overrideAccess: true,
            });
            return json({
                items: found.docs.map(named).filter(Boolean),
            }, lang);
        },
    },
    {
        path: '/v1/tags',
        method: 'get',
        handler: async (req) => {
            const lang = language(req);
            const found = await req.payload.find({
                collection: 'tags',
                locale: lang,
                pagination: false,
                sort: 'slug',
                overrideAccess: true,
            });
            return json({
                items: found.docs.map(named).filter(Boolean),
            }, lang);
        },
    },
    {
        path: '/v1/coach-suggestions',
        method: 'get',
        handler: async (req) => {
            const lang = language(req);
            const global = await req.payload.findGlobal({
                slug: 'coach-suggestions',
                locale: lang,
                fallbackLocale: false,
                overrideAccess: true,
            });
            const items = (global.suggestions ?? []).map(row => row.text).filter((text): text is string => Boolean(text?.trim()));
            return json({ items }, lang);
        },
    },
    {
        // The overrides of one language: only texts an editor changed, keyed like the shop's resources.
        path: '/v1/texts',
        method: 'get',
        handler: async (req) => {
            const lang = language(req);
            const found = await req.payload.find({
                collection: 'texts',
                where: {
                    and: [
                        {
                            value: { exists: true },
                        },
                        {
                            orphaned: { not_equals: true },
                        },
                    ],
                },
                locale: lang,
                fallbackLocale: false,
                pagination: false,
                depth: 0,
                overrideAccess: true,
            });
            const texts: Record<string, Record<string, string>> = { web: {}, ui: {} };
            for (const doc of found.docs) {
                const value = doc.value?.trim();
                const [namespace, ...rest] = doc.key.split(':');
                if (value && namespace && texts[namespace])
                    texts[namespace][rest.join(':')] = value;
            }
            return json(texts, lang);
        },
    },
];
