import type { Payload } from 'payload';

export const NAMESPACES = ['web', 'ui'] as const;
export type Namespace = (typeof NAMESPACES)[number];

/** Nested i18next resources as dotted keys; arrays and non-strings are not editable texts. */
export function flatten(resource: unknown, prefix = ''): Record<string, string> {
    const flat: Record<string, string> = {};
    if (resource && typeof resource === 'object' && !Array.isArray(resource)) {
        for (const [key, value] of Object.entries(resource)) {
            const path = prefix
                ? `${prefix}.${key}`
                : key;
            if (typeof value === 'string')
                flat[path] = value;
            else if (value && typeof value === 'object' && !Array.isArray(value))
                Object.assign(flat, flatten(value, path));
        }
    }
    return flat;
}

export interface SyncResult {
    created: number;
    updated: number;
    orphaned: number;
}

/**
 * Brings the text keys in line with the deployed shop: new keys appear, changed defaults update,
 * keys the shop no longer has are marked as orphaned (their overrides stay, in case they return).
 */
export async function syncTexts(payload: Payload, defaultsUrl: string): Promise<SyncResult> {
    const defaults = new Map<string, { namespace: Namespace; de?: string; en?: string }>();
    for (const namespace of NAMESPACES) {
        for (const language of ['de', 'en'] as const) {
            const response = await fetch(`${defaultsUrl}/${namespace}.${language}.json`);
            if (!response.ok)
                throw new Error(`${defaultsUrl}/${namespace}.${language}.json answered ${response.status}`);
            for (const [key, text] of Object.entries(flatten(await response.json()))) {
                const id = `${namespace}:${key}`;
                const entry = defaults.get(id) ?? { namespace };
                entry[language] = text;
                defaults.set(id, entry);
            }
        }
    }

    const existing = await payload.find({
        collection: 'texts',
        pagination: false,
        depth: 0,
        overrideAccess: true,
        locale: 'de',
    });
    const known = new Map(existing.docs.map(doc => [doc.key, doc]));
    const result: SyncResult = { created: 0, updated: 0, orphaned: 0 };

    for (const [key, entry] of defaults) {
        const doc = known.get(key);
        if (!doc) {
            await payload.create({
                collection: 'texts',
                overrideAccess: true,
                data: {
                    key,
                    namespace: entry.namespace,
                    defaultDe: entry.de ?? '',
                    defaultEn: entry.en ?? '',
                    orphaned: false,
                },
            });
            result.created++;
        }
        else if (doc.defaultDe !== (entry.de ?? '') || doc.defaultEn !== (entry.en ?? '') || doc.orphaned) {
            await payload.update({
                collection: 'texts',
                id: doc.id,
                overrideAccess: true,
                data: { defaultDe: entry.de ?? '', defaultEn: entry.en ?? '', orphaned: false },
            });
            result.updated++;
        }
    }
    for (const doc of existing.docs) {
        if (!defaults.has(doc.key) && !doc.orphaned) {
            await payload.update({
                collection: 'texts',
                id: doc.id,
                overrideAccess: true,
                data: { orphaned: true },
            });
            result.orphaned++;
        }
    }
    return result;
}

const SYNC = Symbol.for('nothingeats.backoffice.textSync');

/** Syncs now and then every [intervalMs]; one loop per process (the dev server re-initialises). */
export function startTextSync(payload: Payload, defaultsUrl: string, intervalMs: number): void {
    const holder = globalThis as typeof globalThis & { [SYNC]?: ReturnType<typeof setInterval> };
    clearInterval(holder[SYNC]);
    const run = () =>
        syncTexts(payload, defaultsUrl).then(
            (result) => {
                if (result.created + result.updated + result.orphaned > 0)
                    payload.logger.info(result, 'Synced the shop texts');
            },
            error => payload.logger.warn({ err: error }, 'Syncing the shop texts failed; trying again later'),
        );
    void run();
    holder[SYNC] = setInterval(() => void run(), intervalMs);
    holder[SYNC].unref();
}
