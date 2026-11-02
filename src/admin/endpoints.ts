import type { Endpoint } from 'payload';
import type { Config } from '../config';

import { forwarder, param } from './forward';

/**
 * The operations views (orders, coach transcripts, search index) read through each owning
 * service's admin API. Read only, except starting a reindex.
 */
export function operationsEndpoints(services: Config['services']): Endpoint[] {
    const ordering = forwarder(`${services.ordering}/v1/admin/orders`);
    const assistant = forwarder(`${services.assistant}/v1/admin/conversations`);
    const search = forwarder(`${services.search}/v1/admin`);
    return [
        {
            path: '/v1/admin/orders',
            method: 'get',
            handler: req => ordering(req, 'GET', ''),
        },
        // Before `:id`, so "today" is not taken for an order id.
        {
            path: '/v1/admin/orders/today',
            method: 'get',
            handler: req => ordering(req, 'GET', '/today'),
        },
        {
            path: '/v1/admin/orders/:id',
            method: 'get',
            handler: req => ordering(req, 'GET', `/${param(req, 'id')}`),
        },
        {
            path: '/v1/admin/conversations',
            method: 'get',
            handler: req => assistant(req, 'GET', ''),
        },
        {
            path: '/v1/admin/conversations/:id',
            method: 'get',
            handler: req => assistant(req, 'GET', `/${param(req, 'id')}`),
        },
        {
            path: '/v1/admin/search/index',
            method: 'get',
            handler: req => search(req, 'GET', '/index'),
        },
        {
            path: '/v1/admin/search/reindex',
            method: 'post',
            handler: req => search(req, 'POST', '/reindex'),
        },
    ];
}
