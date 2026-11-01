import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { sharpTransformer } from '@payloadcms/transformer-sharp';
import { buildConfig } from 'payload';

import { admins } from './collections/Admins';
import { Media } from './collections/Media';
import { loadConfig } from './config';
import { i18n } from './i18n';

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
    collections: [Admins, Media],
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
        migrationDir: path.resolve(dirname, 'migrations'),
    }),
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
