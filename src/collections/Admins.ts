import type { CollectionConfig, PayloadRequest } from 'payload';
import type { Config } from '../config';

import { ADMIN_ROLE, bearerToken, cookieValue, identityVerifier, SESSION_COOKIE, sessionCookies } from '../auth/identity';

/**
 * People who may use the backoffice: identity accounts with role `admin`. There are no passwords
 * here. The login form signs in at identity, hands the access token to `POST /admins/session`, and
 * that sets it as an httpOnly cookie; the `identity` strategy checks it on every request against
 * identity's JWKS, so a revoked role ends access with the token's 15 minutes.
 */
export function admins(config: Config): CollectionConfig {
    const verify = identityVerifier(config.jwt);

    async function profile(token: string): Promise<{ email: string } | null> {
        const response = await fetch(`${config.identity.url}/v1/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.ok
            ? await response.json() as { email: string }
            : null;
    }

    async function findAdmin(req: PayloadRequest, identityId: string) {
        const found = await req.payload.find({
            collection: 'admins',
            where: {
                identityId: { equals: identityId },
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
            req,
        });
        return found.docs[0] ?? null;
    }

    return {
        slug: 'admins',
        admin: {
            useAsTitle: 'email',
            defaultColumns: ['email', 'lastLoginAt'],
        },
        access: {
            // Admins come from identity, never from this form.
            create: () => false,
            delete: () => false,
        },
        auth: {
            disableLocalStrategy: true,
            strategies: [
                {
                    name: 'identity',
                    authenticate: async ({ headers, payload }) => {
                        const token = cookieValue(headers, SESSION_COOKIE) ?? bearerToken(headers);
                        if (!token)
                            return { user: null };
                        const claims = await verify(token);
                        if (!claims?.roles.includes(ADMIN_ROLE))
                            return { user: null };
                        const found = await payload.find({
                            collection: 'admins',
                            where: {
                                identityId: { equals: claims.userId },
                            },
                            limit: 1,
                            depth: 0,
                            overrideAccess: true,
                        });
                        const admin = found.docs[0];
                        return {
                            user: admin
                                ? { ...admin, collection: 'admins', _strategy: 'identity' }
                                : null,
                        };
                    },
                },
            ],
        },
        endpoints: [
            {
                // Starts or renews a session with a fresh identity access token (Authorization header).
                path: '/session',
                method: 'post',
                handler: async (req) => {
                    const token = bearerToken(req.headers);
                    const claims = token
                        ? await verify(token)
                        : null;
                    if (!token || !claims)
                        return Response.json({ code: 'INVALID_TOKEN' }, { status: 401 });
                    if (!claims.roles.includes(ADMIN_ROLE))
                        return Response.json({ code: 'NOT_AN_ADMIN' }, { status: 403 });
                    const me = await profile(token);
                    if (!me)
                        return Response.json({ code: 'INVALID_TOKEN' }, { status: 401 });
                    const now = new Date().toISOString();
                    const existing = await findAdmin(req, claims.userId);
                    if (existing) {
                        await req.payload.update({
                            collection: 'admins',
                            id: existing.id,
                            data: { email: me.email, lastLoginAt: now },
                            overrideAccess: true,
                            req,
                        });
                    }
                    else {
                        await req.payload.create({
                            collection: 'admins',
                            data: { identityId: claims.userId, email: me.email, lastLoginAt: now },
                            overrideAccess: true,
                            req,
                        });
                    }
                    const headers = new Headers();
                    for (const cookie of sessionCookies(token, claims.expiresAt - Date.now() / 1000, config.cookie.secure))
                        headers.append('Set-Cookie', cookie);
                    return Response.json({ expiresAt: claims.expiresAt }, { headers });
                },
            },
            {
                // When the current session ends, so the admin can renew it in time.
                path: '/session',
                method: 'get',
                handler: async (req) => {
                    const token = cookieValue(req.headers, SESSION_COOKIE);
                    const claims = token
                        ? await verify(token)
                        : null;
                    return claims
                        ? Response.json({ expiresAt: claims.expiresAt })
                        : Response.json({ code: 'NO_SESSION' }, { status: 401 });
                },
            },
            {
                path: '/session',
                method: 'delete',
                handler: async () => {
                    const headers = new Headers();
                    for (const cookie of sessionCookies('', 0, config.cookie.secure))
                        headers.append('Set-Cookie', cookie);
                    return new Response(null, { status: 204, headers });
                },
            },
        ],
        fields: [
            {
                name: 'identityId',
                type: 'text',
                required: true,
                unique: true,
                index: true,
                admin: { readOnly: true },
            },
            {
                name: 'email',
                type: 'email',
                required: true,
                admin: { readOnly: true },
            },
            {
                name: 'lastLoginAt',
                type: 'date',
                admin: {
                    readOnly: true,
                    date: { pickerAppearance: 'dayAndTime' },
                },
            },
        ],
    };
}
