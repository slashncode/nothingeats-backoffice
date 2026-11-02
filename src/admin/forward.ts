import type { PayloadRequest } from 'payload';

import { bearerToken, cookieValue, SESSION_COOKIE } from '../auth/identity';

/**
 * The backoffice changes nothing of other services itself: its admin views call each service's
 * admin API through here, with the signed-in admin's own token, and the service checks the role
 * again (journal record 040). Answers, problems included, pass through unchanged.
 */
export function forwarder(baseUrl: string) {
    return async (req: PayloadRequest, method: string, path: string): Promise<Response> => {
        if (!req.user)
            return Response.json({ code: 'UNAUTHENTICATED', status: 401 }, { status: 401 });
        const token = cookieValue(req.headers, SESSION_COOKIE) ?? bearerToken(req.headers);
        const url = new URL(req.url ?? 'http://localhost');
        const target = `${baseUrl}${path}${method === 'GET'
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
    };
}

/** A route parameter, encoded for the path of the service behind. */
export function param(req: PayloadRequest, name: string): string {
    return encodeURIComponent(String(req.routeParams?.[name] ?? ''));
}
