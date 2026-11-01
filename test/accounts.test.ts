import type { AddressInfo } from 'node:net';
import type { PayloadRequest } from 'payload';
import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { accountEndpoints } from '../src/accounts/api';

interface Seen { method?: string; url?: string; authorization?: string }

describe('the accounts proxy', () => {
    const seen: Seen[] = [];
    let identityUrl: string;
    let close: () => void;

    beforeAll(async () => {
        const server = createServer((request, response) => {
            seen.push({ method: request.method, url: request.url, authorization: request.headers.authorization });
            if (request.method === 'GET') {
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify({ items: [], nextCursor: null }));
                return;
            }
            response.statusCode = request.url?.endsWith('/lock')
                ? 409
                : 204;
            if (response.statusCode === 409) {
                response.setHeader('Content-Type', 'application/problem+json');
                response.end(JSON.stringify({ code: 'CANNOT_LOCK_OWN_ACCOUNT', status: 409 }));
                return;
            }
            response.end();
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        identityUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        close = () => server.close();
    });

    afterAll(() => close());

    function endpoint(method: string, path: string) {
        const found = accountEndpoints({ url: identityUrl }).find(candidate => candidate.method === method && candidate.path === path);
        if (!found)
            throw new Error(`no endpoint ${method} ${path}`);
        return found.handler;
    }

    function request(url: string, headers: Record<string, string>, routeParams: Record<string, string> = {}, user: unknown = { id: 1 }) {
        return {
            url,
            headers: new Headers(headers),
            routeParams,
            user,
        } as unknown as PayloadRequest;
    }

    it('forwards a search with the admin\'s own token from the session cookie', async () => {
        const response = await endpoint('get', '/v1/admin/accounts')(request('http://shop/api/backoffice/v1/admin/accounts?query=anna&limit=25', { cookie: 'ne_backoffice=admin-token' }));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ items: [], nextCursor: null });
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(seen.at(-1)).toEqual({ method: 'GET', url: '/v1/admin/users?query=anna&limit=25', authorization: 'Bearer admin-token' });
    });

    it('passes identity\'s answers through, problems included, and refuses without a session', async () => {
        const deleted = await endpoint('delete', '/v1/admin/accounts/:id')(request('http://shop/x?ignored=1', { authorization: 'Bearer script-token' }, { id: 'a/b' }));
        expect(deleted.status).toBe(204);
        expect(seen.at(-1)).toEqual({ method: 'DELETE', url: '/v1/admin/users/a%2Fb', authorization: 'Bearer script-token' });

        const locked = await endpoint('put', '/v1/admin/accounts/:id/lock')(request('http://shop/x', { cookie: 'ne_backoffice=t' }, { id: 'me' }));
        expect(locked.status).toBe(409);
        expect(await locked.json()).toEqual({ code: 'CANNOT_LOCK_OWN_ACCOUNT', status: 409 });

        const before = seen.length;
        const anonymous = await endpoint('get', '/v1/admin/accounts')(request('http://shop/x', {}, {}, null));
        expect(anonymous.status).toBe(401);
        expect(seen).toHaveLength(before);
    });
});
