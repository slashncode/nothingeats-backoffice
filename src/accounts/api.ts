import type { Endpoint, PayloadRequest } from 'payload';
import type { Config } from '../config';

import { bearerToken, cookieValue, SESSION_COOKIE } from '../auth/identity';

/**
 * Accounts live in identity; the backoffice only shows and changes them through identity's admin
 * API, with the signed-in admin's own token. It has no powers of its own: identity checks the role
 * again on every call.
 */
export function accountEndpoints(identity: Config['identity']): Endpoint[] {
    async function forward(req: PayloadRequest, method: string, path: string): Promise<Response> {
        if (!req.user)
            return Response.json({ code: 'UNAUTHENTICATED', status: 401 }, { status: 401 });
        const token = cookieValue(req.headers, SESSION_COOKIE) ?? bearerToken(req.headers);
        const url = new URL(req.url ?? 'http://localhost');
        const target = `${identity.url}/v1/admin/users${path}${method === 'GET'
            ? url.search
            : ''}`;
        const response = await fetch(target, {
            method,
            headers: { Authorization: `Bearer ${token}` },
        });
        const body = response.status === 204
            ? null
            : await response.text();
        return new Response(body, {
            status: response.status,
            headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json', 'Cache-Control': 'no-store' },
        });
    }

    const id = (req: PayloadRequest) => encodeURIComponent(String(req.routeParams?.id ?? ''));
    const role = (req: PayloadRequest) => encodeURIComponent(String(req.routeParams?.role ?? ''));

    return [
        {
            path: '/v1/admin/accounts',
            method: 'get',
            handler: req => forward(req, 'GET', ''),
        },
        {
            path: '/v1/admin/accounts/:id',
            method: 'get',
            handler: req => forward(req, 'GET', `/${id(req)}`),
        },
        {
            path: '/v1/admin/accounts/:id',
            method: 'delete',
            handler: req => forward(req, 'DELETE', `/${id(req)}`),
        },
        {
            path: '/v1/admin/accounts/:id/lock',
            method: 'put',
            handler: req => forward(req, 'PUT', `/${id(req)}/lock`),
        },
        {
            path: '/v1/admin/accounts/:id/lock',
            method: 'delete',
            handler: req => forward(req, 'DELETE', `/${id(req)}/lock`),
        },
        {
            path: '/v1/admin/accounts/:id/roles/:role',
            method: 'put',
            handler: req => forward(req, 'PUT', `/${id(req)}/roles/${role(req)}`),
        },
        {
            path: '/v1/admin/accounts/:id/roles/:role',
            method: 'delete',
            handler: req => forward(req, 'DELETE', `/${id(req)}/roles/${role(req)}`),
        },
    ];
}
