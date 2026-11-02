import type { Endpoint } from 'payload';
import type { Config } from '../config';

import { forwarder, param } from '../admin/forward';

/**
 * Accounts live in identity; the backoffice only shows and changes them through identity's admin
 * API, with the signed-in admin's own token. It has no powers of its own: identity checks the role
 * again on every call.
 */
export function accountEndpoints(identity: Config['identity']): Endpoint[] {
    const forward = forwarder(`${identity.url}/v1/admin/users`);
    return [
        {
            path: '/v1/admin/accounts',
            method: 'get',
            handler: req => forward(req, 'GET', ''),
        },
        {
            path: '/v1/admin/accounts/:id',
            method: 'get',
            handler: req => forward(req, 'GET', `/${param(req, 'id')}`),
        },
        {
            path: '/v1/admin/accounts/:id',
            method: 'delete',
            handler: req => forward(req, 'DELETE', `/${param(req, 'id')}`),
        },
        {
            path: '/v1/admin/accounts/:id/lock',
            method: 'put',
            handler: req => forward(req, 'PUT', `/${param(req, 'id')}/lock`),
        },
        {
            path: '/v1/admin/accounts/:id/lock',
            method: 'delete',
            handler: req => forward(req, 'DELETE', `/${param(req, 'id')}/lock`),
        },
        {
            path: '/v1/admin/accounts/:id/roles/:role',
            method: 'put',
            handler: req => forward(req, 'PUT', `/${param(req, 'id')}/roles/${param(req, 'role')}`),
        },
        {
            path: '/v1/admin/accounts/:id/roles/:role',
            method: 'delete',
            handler: req => forward(req, 'DELETE', `/${param(req, 'id')}/roles/${param(req, 'role')}`),
        },
    ];
}
