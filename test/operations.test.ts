import type { AddressInfo } from 'node:net';
import type { PayloadRequest } from 'payload';
import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { operationsEndpoints } from '../src/admin/endpoints';

describe('the operations proxy', () => {
    const seen: string[] = [];
    let base: string;
    let close: () => void;

    beforeAll(async () => {
        const server = createServer((request, response) => {
            seen.push(`${request.method} ${request.url} ${request.headers.authorization}`);
            response.statusCode = request.method === 'POST'
                ? 202
                : 200;
            response.setHeader('Content-Type', 'application/json');
            response.end('{}');
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        close = () => server.close();
    });

    afterAll(() => close());

    async function call(method: string, path: string, url: string, routeParams: Record<string, string> = {}) {
        const services = {
            catalog: `${base}/api/catalog`,
            ordering: `${base}/api/ordering`,
            assistant: `${base}/api/assistant`,
            search: `${base}/api/search`,
        };
        const endpoint = operationsEndpoints(services).find(candidate => candidate.method === method && candidate.path === path);
        const request = {
            url,
            headers: new Headers({ cookie: 'ne_backoffice=admin-token' }),
            routeParams,
            user: { id: 1 },
        } as unknown as PayloadRequest;
        return endpoint!.handler(request);
    }

    it('reaches each service\'s admin API with the admin\'s token, queries only on reads', async () => {
        await call('get', '/v1/admin/orders', 'http://shop/x?status=DELIVERED&lang=de');
        await call('get', '/v1/admin/orders/today', 'http://shop/x');
        await call('get', '/v1/admin/orders/:id', 'http://shop/x?lang=en', { id: 'order 1' });
        await call('get', '/v1/admin/conversations/:id', 'http://shop/x', { id: 'conversation-1' });
        expect((await call('post', '/v1/admin/search/reindex', 'http://shop/x?ignored=1')).status).toBe(202);

        expect(seen).toEqual([
            'GET /api/ordering/v1/admin/orders?status=DELIVERED&lang=de Bearer admin-token',
            'GET /api/ordering/v1/admin/orders/today Bearer admin-token',
            'GET /api/ordering/v1/admin/orders/order%201?lang=en Bearer admin-token',
            'GET /api/assistant/v1/admin/conversations/conversation-1 Bearer admin-token',
            'POST /api/search/v1/admin/reindex Bearer admin-token',
        ]);
    });
});
