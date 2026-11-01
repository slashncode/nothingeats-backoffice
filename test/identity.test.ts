import type { AddressInfo } from 'node:net';
import { createServer } from 'node:http';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearerToken, cookieValue, identityVerifier, SESSION_COOKIE, sessionCookies } from '../src/auth/identity';

const issuer = 'http://identity.test/api/identity';
const audience = 'nothingeats';

describe('identity tokens', () => {
    let privateKey: CryptoKey;
    let jwksUrl: string;
    let close: () => void;

    beforeAll(async () => {
        const pair = await generateKeyPair('RS256');
        privateKey = pair.privateKey;
        const jwk = {
            ...(await exportJWK(pair.publicKey)),
            kid: 'current',
            alg: 'RS256',
            use: 'sig',
        };
        const server = createServer((_, response) => {
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({
                keys: [jwk],
            }));
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        jwksUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/jwks.json`;
        close = () => server.close();
    });

    afterAll(() => close());

    function token(claims: Record<string, unknown>, options: { issuer?: string; audience?: string; expiresIn?: string } = {}) {
        return new SignJWT(claims)
            .setProtectedHeader({ alg: 'RS256', kid: 'current' })
            .setSubject('9a0f1c2e-0000-4000-8000-000000000001')
            .setIssuer(options.issuer ?? issuer)
            .setAudience(options.audience ?? audience)
            .setIssuedAt()
            .setExpirationTime(options.expiresIn ?? '15m')
            .sign(privateKey);
    }

    it('accepts a token of identity with its roles', async () => {
        const verify = identityVerifier({ issuer, audience, jwksUrl });
        const claims = await verify(await token({
            roles: ['admin'],
        }));
        expect(claims?.userId).toBe('9a0f1c2e-0000-4000-8000-000000000001');
        expect(claims?.roles).toEqual(['admin']);
    });

    it('rejects another issuer, another audience and expired tokens', async () => {
        const verify = identityVerifier({ issuer, audience, jwksUrl });
        expect(await verify(await token({
            roles: ['admin'],
        }, { issuer: 'http://elsewhere' }))).toBeNull();
        expect(await verify(await token({
            roles: ['admin'],
        }, { audience: 'other' }))).toBeNull();
        expect(await verify(await token({
            roles: ['admin'],
        }, { expiresIn: '-1m' }))).toBeNull();
        expect(await verify('not-a-token')).toBeNull();
    });
});

describe('session cookies', () => {
    it('scopes the session to the admin and its API, never to the whole shop', () => {
        const cookies = sessionCookies('abc', 899.6, false);
        expect(cookies).toEqual([
            `${SESSION_COOKIE}=abc; Path=/admin; Max-Age=899; HttpOnly; SameSite=Strict`,
            `${SESSION_COOKIE}=abc; Path=/api/backoffice; Max-Age=899; HttpOnly; SameSite=Strict`,
        ]);
        expect(sessionCookies('abc', 10, true)[0]).toContain('; Secure');
    });

    it('reads the cookie and the bearer token from request headers', () => {
        const headers = new Headers({ cookie: `other=1; ${SESSION_COOKIE}=a%3Db; x=2`, authorization: 'Bearer t0k3n' });
        expect(cookieValue(headers, SESSION_COOKIE)).toBe('a=b');
        expect(cookieValue(headers, 'missing')).toBeNull();
        expect(bearerToken(headers)).toBe('t0k3n');
        expect(bearerToken(new Headers({ authorization: 'Basic x' }))).toBeNull();
    });
});
