// Talks to identity on the same origin, like the shop does. The refresh token is identity's
// httpOnly cookie (path /api/identity/v1/sessions); this code never sees it.

interface TokenResponse {
    accessToken: string;
    expiresIn: number;
}

export class SessionError extends Error {
    constructor(readonly status: number, readonly code: string | undefined) {
        super(code ?? `HTTP ${status}`);
    }
}

async function call<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, { credentials: 'same-origin', ...init });
    if (!response.ok) {
        const problem = await response.json().catch(() => ({})) as { code?: string };
        throw new SessionError(response.status, problem.code);
    }
    return response.status === 204
        ? undefined as T
        : await response.json() as T;
}

export function login(email: string, password: string): Promise<TokenResponse> {
    return call('/api/identity/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
}

let inflight: Promise<TokenResponse> | undefined;

/**
 * A refresh rotates identity's cookie, and a used one revokes the whole session family. So, like
 * the shop: one refresh at a time per tab, and across tabs (shop tabs included) the same Web Lock.
 */
export function refresh(): Promise<TokenResponse> {
    inflight ??= (async () => {
        const run = () => call<TokenResponse>('/api/identity/v1/sessions/refresh', { method: 'POST' });
        try {
            return globalThis.navigator?.locks
                ? await navigator.locks.request('nothingeats-session-refresh', run)
                : await run();
        }
        finally {
            inflight = undefined;
        }
    })();
    return inflight;
}

/** Hands an access token to the backoffice, which keeps it as its httpOnly session cookie. */
export function startSession(accessToken: string): Promise<{ expiresAt: number }> {
    return call('/api/backoffice/admins/session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

export function currentSession(): Promise<{ expiresAt: number }> {
    return call('/api/backoffice/admins/session', { method: 'GET' });
}

export async function logout(): Promise<void> {
    await call('/api/backoffice/admins/session', { method: 'DELETE' }).catch(() => undefined);
    await call('/api/identity/v1/sessions/current', { method: 'DELETE' }).catch(() => undefined);
}
