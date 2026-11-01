import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { sharpTransformer } from '@payloadcms/transformer-sharp';
import { buildConfig } from 'payload';

import { admins } from './collections/Admins';
import { Badges } from './collections/Badges';
import { Deals } from './collections/Deals';
import { Dishes } from './collections/Dishes';
import { Media } from './collections/Media';
import { Restaurants } from './collections/Restaurants';
import { loadConfig } from './config';
import { DealPlanner } from './globals/DealPlanner';
import { Wheel } from './globals/Wheel';
import { i18n } from './i18n';
import { startRelay } from './outbox/relay';
import { outboxEvents } from './outbox/table';
import { seedCommand } from './seed/command';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const config = loadConfig();
const Admins = admins(config);

function withCredentials(url: string, user: string, password: string): string {
    const parsed = new URL(url);
    parsed.username = encodeURIComponent(user);
    parsed.password = encodeURIComponent(password);
    return parsed.toString();
}

export default buildConfig({
    admin: {
        user: Admins.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
        components: {
            // No password form: admins sign in with their NothingEats account (identity).
            beforeLogin: ['/components/IdentityLogin#IdentityLogin'],
            // Renews the session with identity before the access token runs out.
            providers: ['/components/SessionKeeper#SessionKeeper'],
            logout: {
                Button: '/components/LogoutButton#LogoutButton',
            },
        },
    },
    // The shop's gateway sends /api/backoffice/* here; /api/* belongs to the services.
    routes: {
        api: '/api/backoffice',
    },
    collections: [
        Restaurants,
        Dishes,
        Deals,
        Badges,
        Media,
        Admins,
    ],
    globals: [DealPlanner, Wheel],
    cli: {
        commands: { seed: seedCommand },
    },
    i18n,
    editor: lexicalEditor(),
    secret: config.payload.secret,
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: postgresAdapter({
        pool: {
            // node-postgres lets the URL win over separate user/password options, so both go in.
            connectionString: withCredentials(config.database.url, config.database.user, config.database.password),
            max: config.database.maximumPoolSize,
        },
        // Ids travel in events to other services; catalog's ids are UUIDs already.
        idType: 'uuid',
        // The seed keeps catalog's ids, so orders and search keep pointing at the same dishes.
        allowIDOnCreate: true,
        beforeSchemaInit: [
            ({ schema }) => ({
                ...schema,
                tables: { ...schema.tables, outbox_events: outboxEvents },
            }),
        ],
        migrationDir: path.resolve(dirname, 'migrations'),
        // Migrations everywhere, the dev server included: no interactive schema push.
        push: false,
    }),
    onInit: (payload) => {
        if (!config.outbox.relayEnabled)
            return;
        startRelay(payload, {
            bootstrapServers: config.kafka.bootstrapServers,
            pollIntervalMs: config.outbox.pollIntervalMs,
            batchSize: 100,
            maxBackoffMs: 30_000,
            retentionMs: config.outbox.retentionDays * 24 * 60 * 60 * 1000,
        });
    },
    localization: {
        locales: [
            { code: 'de', label: 'Deutsch' },
            { code: 'en', label: 'English' },
        ],
        defaultLocale: 'de',
        fallback: true,
    },
    upload: {
        transformers: [
            sharpTransformer({
                collections: {
                    media: {
                        variants: [
                            { name: 'card', width: 640, height: 400 },
                            { name: 'wide', width: 1280, height: 640 },
                        ],
                        // Originals larger than this are scaled down on upload.
                        resizeOptions: { width: 2400, height: 2400, withoutEnlargement: true },
                        focalPoint: true,
                    },
                },
            }),
        ],
    },
    storage: [
        s3Storage({
            collections: {
                media: {
                    // Files are public through the gateway; no detour through Payload.
                    disablePayloadAccessControl: true,
                    generateFileURL: ({ filename, prefix }) =>
                        [config.media.publicPath, prefix, filename].filter(Boolean).join('/'),
                },
            },
            bucket: config.s3.bucket,
            config: {
                endpoint: config.s3.endpoint,
                region: config.s3.region,
                forcePathStyle: true,
                credentials: {
                    accessKeyId: config.s3.accessKey,
                    secretAccessKey: config.s3.secretKey,
                },
            },
        }),
    ],
});
