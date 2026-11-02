import { useCallback, useEffect, useRef, useState } from 'react';

const BASE = '/api/backoffice/v1/admin';

/** The service's problem code, shown in the view ("That did not work (CODE)"). */
export class AdminApiError extends Error {}

export async function adminCall<T>(method: string, path: string): Promise<T> {
    const response = await fetch(`${BASE}${path}`, { method, credentials: 'same-origin' });
    if (!response.ok) {
        const problem = await response.json().catch(() => ({})) as { code?: string };
        throw new AdminApiError(problem.code ?? `HTTP ${response.status}`);
    }
    return (response.status === 204
        ? undefined
        : await response.json()) as T;
}

interface Account { id: string; email: string }

/** The addresses behind customer ids, from identity; accounts deleted since are left out. */
export async function customerEmails(ids: string[]): Promise<Record<string, string>> {
    const unique = [
        ...new Set(ids),
    ].slice(0, 100);
    if (unique.length === 0)
        return {};
    const found = await adminCall<{ items: Account[] }>('GET', `/accounts?ids=${unique.map(encodeURIComponent).join(',')}`);
    return Object.fromEntries(found.items.map(account => [account.id, account.email]));
}

/** The customer with exactly this address, or null. */
export async function customerByEmail(email: string): Promise<string | null> {
    try {
        return (await adminCall<Account>('GET', `/accounts?email=${encodeURIComponent(email)}`)).id;
    }
    catch (failure) {
        if (failure instanceof AdminApiError && failure.message === 'USER_NOT_FOUND')
            return null;
        throw failure;
    }
}

export interface Page<T> { items: T[]; nextCursor: string | null }

/**
 * A list read page by page. A new [key] starts over; only the newest request may fill the list,
 * so a slow earlier one never overwrites what a later filter asked for.
 */
export function usePagedList<T>(key: string, load: (cursor: string | undefined) => Promise<Page<T>>) {
    const [pages, setPages] = useState<Page<T>[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();
    const latestRef = useRef(0);
    const loadRef = useRef(load);
    loadRef.current = load;

    const fetchPage = useCallback(async (cursor?: string) => {
        const ticket = ++latestRef.current;
        setBusy(true);
        setError(undefined);
        try {
            const page = await loadRef.current(cursor);
            if (ticket === latestRef.current) {
                setPages(previous => (cursor
                    ? [...previous, page]
                    : [page]));
            }
        }
        catch (failure) {
            if (ticket === latestRef.current)
                setError((failure as Error).message);
        }
        finally {
            if (ticket === latestRef.current)
                setBusy(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => void fetchPage(), 250);
        return () => clearTimeout(timer);
    }, [key, fetchPage]);

    return {
        items: pages.flatMap(page => page.items),
        next: pages.at(-1)?.nextCursor ?? null,
        busy,
        error,
        more: (cursor: string) => void fetchPage(cursor),
        reload: () => void fetchPage(),
    };
}

export function formatMoney(cents: number, language: string): string {
    return new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function formatDateTime(value: string | null | undefined, language: string): string {
    return value
        ? new Date(value).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' })
        : '–';
}
