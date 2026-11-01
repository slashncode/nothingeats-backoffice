'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../../i18n';
import { Button, ConfirmationModal, useModal, useTranslation } from '@payloadcms/ui';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './accounts.module.css';

interface Account {
    id: string;
    email: string;
    locale: string;
    roles: string[];
    verified: boolean;
    createdAt: string;
    verifiedAt: string | null;
    lockedAt: string | null;
}

interface Action {
    account: Account;
    method: string;
    path: string;
    question?: string;
}

interface AccountPage {
    items: Account[];
    nextCursor: string | null;
}

const API = '/api/backoffice/v1/admin/accounts';
const CONFIRM_MODAL = 'confirm-account-action';

async function call(method: string, path = '') {
    const response = await fetch(`${API}${path}`, { method, credentials: 'same-origin' });
    if (!response.ok) {
        const problem = await response.json().catch(() => ({})) as { code?: string };
        throw new Error(problem.code ?? `HTTP ${response.status}`);
    }
    return response.status === 204
        ? undefined
        : response.json();
}

/** Search, lock or unlock, make admin, delete: every action goes to identity with the admin's token. */
export function AccountsClient({ ownId }: { ownId: string }) {
    const { t, i18n } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const [query, setQuery] = useState('');
    const [pages, setPages] = useState<AccountPage[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();
    const [pending, setPending] = useState<Action>();
    const { openModal } = useModal();
    // Only the newest request may fill the table: an earlier, slower one must not overwrite a search.
    const latestRef = useRef(0);
    const date = (value: string | null) => (value
        ? new Date(value).toLocaleDateString(i18n.language, { dateStyle: 'medium' })
        : '–');

    const load = useCallback(async (search: string, cursor?: string) => {
        const ticket = ++latestRef.current;
        setBusy(true);
        setError(undefined);
        try {
            const params = new URLSearchParams({ limit: '25' });
            if (search.trim())
                params.set('query', search.trim());
            if (cursor)
                params.set('cursor', cursor);
            const page = await call('GET', `?${params}`) as AccountPage;
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
        const timer = setTimeout(() => void load(query), 250);
        return () => clearTimeout(timer);
    }, [query, load]);

    async function run({ account, method, path }: Action) {
        setError(undefined);
        try {
            await call(method, `/${account.id}${path}`);
            await load(query);
        }
        catch (failure) {
            setError((failure as Error).message);
        }
    }

    // Anything that hurts asks first; unlocking does not.
    function act(account: Account, method: string, path: string, question?: string) {
        if (!question)
            return void run({ account, method, path });
        setPending({ account, method, path, question });
        openModal(CONFIRM_MODAL);
    }

    const accounts = pages.flatMap(page => page.items);
    const next = pages.at(-1)?.nextCursor;

    return (
        <div className={styles.view}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('backoffice:accountsTitle')}</h1>
                <p className={styles.intro}>{t('backoffice:accountsIntro')}</p>
            </header>
            <input
                className={styles.search}
                type="search"
                aria-label={t('backoffice:accountsSearch')}
                placeholder={t('backoffice:accountsSearch')}
                value={query}
                onChange={event => setQuery(event.target.value)}
            />
            {error && <p role="alert" className={styles.error}>{t('backoffice:accountsFailed', { code: error })}</p>}
            <div className="table">
                <table>
                    <thead>
                        <tr>
                            <th>{t('backoffice:accountsEmail')}</th>
                            <th>{t('backoffice:accountsRoles')}</th>
                            <th>{t('backoffice:accountsCreated')}</th>
                            <th>{t('backoffice:accountsState')}</th>
                            <th>{t('backoffice:accountsActions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((account) => {
                            const own = account.id === ownId;
                            const admin = account.roles.includes('admin');
                            return (
                                <tr key={account.id}>
                                    <td>{account.email}</td>
                                    <td>{account.roles.join(', ')}</td>
                                    <td>{date(account.createdAt)}</td>
                                    <td>
                                        {account.lockedAt
                                            ? t('backoffice:accountsLocked', {
                                                    date: date(account.lockedAt),
                                                })
                                            : account.verified
                                                ? t('backoffice:accountsActive')
                                                : t('backoffice:accountsUnverified')}
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {!own && (account.lockedAt
                                                ? <Button margin={false} buttonStyle="secondary" onClick={() => act(account, 'DELETE', '/lock')}>{t('backoffice:accountsUnlock')}</Button>
                                                : <Button margin={false} buttonStyle="secondary" onClick={() => act(account, 'PUT', '/lock', t('backoffice:accountsConfirmLock', { email: account.email }))}>{t('backoffice:accountsLock')}</Button>)}
                                            {!own && (admin
                                                ? <Button margin={false} buttonStyle="secondary" onClick={() => act(account, 'DELETE', '/roles/admin', t('backoffice:accountsConfirmRevoke', { email: account.email }))}>{t('backoffice:accountsRevokeAdmin')}</Button>
                                                : <Button margin={false} buttonStyle="secondary" onClick={() => act(account, 'PUT', '/roles/admin', t('backoffice:accountsConfirmGrant', { email: account.email }))}>{t('backoffice:accountsMakeAdmin')}</Button>)}
                                            {!own && <Button margin={false} buttonStyle="destructive" onClick={() => act(account, 'DELETE', '', t('backoffice:accountsConfirmDelete', { email: account.email }))}>{t('backoffice:accountsDelete')}</Button>}
                                            {own && <span className={styles.muted}>{t('backoffice:accountsYou')}</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!busy && accounts.length === 0 && <p>{t('backoffice:accountsNone')}</p>}
            {next && <Button margin={false} buttonStyle="secondary" disabled={busy} onClick={() => void load(query, next)}>{t('backoffice:accountsMore')}</Button>}
            <ConfirmationModal
                modalSlug={CONFIRM_MODAL}
                heading={t('backoffice:accountsConfirmTitle')}
                body={pending?.question ?? ''}
                onConfirm={() => (pending
                    ? run(pending)
                    : undefined)}
                onCancel={() => setPending(undefined)}
            />
        </div>
    );
}
