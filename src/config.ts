import { z } from 'zod';

// Everything the backoffice reads from its environment, validated at startup (a bad value stops it
// before it serves anything). Same names as the other services: `__` nests, `_` separates words.

const environment = z.object({
    DATABASE__URL: z.string().default('postgres://localhost:15432/backoffice'),
    DATABASE__USER: z.string().default('backoffice'),
    DATABASE__PASSWORD: z.string().default(''),
    DATABASE__MAXIMUM_POOL_SIZE: z.coerce.number().int().positive().default(5),
    // Signs Payload's own tokens and encrypts its secrets; admins log in with identity's tokens.
    PAYLOAD__SECRET: z.string().min(32),
    // Admins are identity accounts with role `admin`; their tokens are checked like in every service.
    IDENTITY__URL: z.url().default('http://nothingeats.localhost/api/identity'),
    JWT__ISSUER: z.string().default('http://nothingeats.localhost/api/identity'),
    JWT__AUDIENCE: z.string().default('nothingeats'),
    JWT__JWKS_URL: z.url().default('http://nothingeats.localhost/api/identity/.well-known/jwks.json'),
    // Secure cookies behind HTTPS; false for the plain-HTTP local cluster.
    COOKIE__SECURE: z.stringbool().default(false),
    S3__ENDPOINT: z.url().default('http://localhost:13900'),
    S3__REGION: z.string().default('garage'),
    S3__BUCKET: z.string().default('media'),
    S3__ACCESS_KEY: z.string().default(''),
    S3__SECRET_KEY: z.string().default(''),
    // Public path of the bucket (Garage's website endpoint behind the gateway).
    MEDIA__PUBLIC_PATH: z.string().default('/media'),
});

export interface Config {
    database: { url: string; user: string; password: string; maximumPoolSize: number };
    payload: { secret: string };
    identity: { url: string };
    jwt: { issuer: string; audience: string; jwksUrl: string };
    cookie: { secure: boolean };
    s3: { endpoint: string; region: string; bucket: string; accessKey: string; secretKey: string };
    media: { publicPath: string };
}

export function loadConfig(source: Record<string, string | undefined> = process.env): Config {
    const parsed = environment.safeParse(source);
    if (!parsed.success) {
        // Names and reasons only: values may be secrets.
        const problems = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
        throw new Error(`Invalid configuration: ${problems.join('; ')}`);
    }
    const env = parsed.data;
    return {
        database: {
            url: env.DATABASE__URL,
            user: env.DATABASE__USER,
            password: env.DATABASE__PASSWORD,
            maximumPoolSize: env.DATABASE__MAXIMUM_POOL_SIZE,
        },
        payload: { secret: env.PAYLOAD__SECRET },
        identity: { url: env.IDENTITY__URL },
        jwt: { issuer: env.JWT__ISSUER, audience: env.JWT__AUDIENCE, jwksUrl: env.JWT__JWKS_URL },
        cookie: { secure: env.COOKIE__SECURE },
        s3: {
            endpoint: env.S3__ENDPOINT,
            region: env.S3__REGION,
            bucket: env.S3__BUCKET,
            accessKey: env.S3__ACCESS_KEY,
            secretKey: env.S3__SECRET_KEY,
        },
        media: { publicPath: env.MEDIA__PUBLIC_PATH },
    };
}
