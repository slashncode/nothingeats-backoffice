import type { Config } from '../config';
import { createRemoteJWKSet, jwtVerify } from 'jose';

/** An identity access token that passed the checks every NothingEats service makes. */
export interface IdentityClaims {
    userId: string;
    roles: string[];
    expiresAt: number;
}

export const ADMIN_ROLE = 'admin';

/** Name of the cookie that carries the admin's identity access token to /admin and the API. */
export const SESSION_COOKIE = 'ne_backoffice';

/**
 * Verifies identity's access tokens against its JWKS (signature, issuer, audience, expiry), like
 * the Kotlin services do. The key set is fetched once and refreshed when an unknown `kid` shows up.
 */
export function identityVerifier(config: Config['jwt']) {
    const keys = createRemoteJWKSet(new URL(config.jwksUrl));
    return async (token: string): Promise<IdentityClaims | null> => {
        try {
            const { payload } = await jwtVerify(token, keys, {
                issuer: config.issuer,
                audience: config.audience,
                algorithms: ['RS256'],
            });
            const roles = Array.isArray(payload.roles)
                ? payload.roles.filter(role => typeof role === 'string')
                : [];
            if (!payload.sub || !payload.exp)
                return null;
            return { userId: payload.sub, roles, expiresAt: payload.exp };
        }
        catch {
            return null;
        }
    };
}

export function bearerToken(headers: Headers): string | null {
    const header = headers.get('authorization');
    return header?.startsWith('Bearer ')
        ? header.slice('Bearer '.length)
        : null;
}

export function cookieValue(headers: Headers, name: string): string | null {
    for (const part of (headers.get('cookie') ?? '').split(';')) {
        const [key, ...value] = part.trim().split('=');
        if (key === name)
            return decodeURIComponent(value.join('='));
    }
    return null;
}

/**
 * The session cookie twice: once for the admin pages, once for the API. Never for `/`, so the
 * token does not travel to every service of the shop.
 */
export function sessionCookies(token: string, maxAgeSeconds: number, secure: boolean): string[] {
    return ['/admin', '/api/backoffice'].map(path => [
        `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
        `Path=${path}`,
        `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
        'HttpOnly',
        'SameSite=Strict',
        ...(secure
            ? ['Secure']
            : []),
    ].join('; '));
}
