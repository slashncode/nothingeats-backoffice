'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../i18n';
import { Button, useTranslation } from '@payloadcms/ui';
import { useState } from 'react';

import { login, SessionError, startSession } from './session';

function target(): string {
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    return redirect?.startsWith('/admin')
        ? redirect
        : '/admin';
}

/** Sign-in with the NothingEats account; only accounts with role `admin` get in. */
export function IdentityLogin() {
    const { t } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError(undefined);
        try {
            const session = await login(email, password);
            await startSession(session.accessToken);
            window.location.assign(target());
        }
        catch (failure) {
            const status = failure instanceof SessionError
                ? failure.status
                : 0;
            setError(
                status === 401
                    ? t('backoffice:loginWrong')
                    : status === 403
                        ? t('backoffice:loginNotAdmin')
                        : status === 429
                            ? t('backoffice:loginTooMany')
                            : t('backoffice:loginFailed'),
            );
            setBusy(false);
        }
    }

    return (
        <form onSubmit={event => void submit(event)} style={{ display: 'grid', gap: 'var(--base)' }}>
            <p>{t('backoffice:loginIntro')}</p>
            <div className="field-type email">
                <label className="field-label" htmlFor="identity-email">{t('backoffice:loginEmail')}</label>
                <input id="identity-email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            <div className="field-type password">
                <label className="field-label" htmlFor="identity-password">{t('backoffice:loginPassword')}</label>
                <input id="identity-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
            </div>
            {error && <p role="alert" style={{ color: 'var(--theme-error-500)' }}>{error}</p>}
            <Button type="submit" disabled={busy}>{t('backoffice:loginSubmit')}</Button>
        </form>
    );
}
