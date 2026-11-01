'use client';

import { useAuth } from '@payloadcms/ui';
import { useEffect } from 'react';

import { currentSession, refresh, startSession } from './session';

/** Renew this long before identity's access token runs out. */
const MARGIN_MS = 60_000;

/**
 * Keeps the backoffice session alive while the admin works: shortly before the access token
 * expires, refresh at identity and hand the new token to the backoffice. If identity says no (the
 * session ended, the role is gone), back to the login.
 */
export function SessionKeeper({ children }: { children?: React.ReactNode }) {
    const { user } = useAuth();

    useEffect(() => {
        if (!user)
            return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let expiresAt = 0;

        function schedule() {
            clearTimeout(timer);
            timer = setTimeout(() => void renew(), Math.max(0, expiresAt * 1000 - Date.now() - MARGIN_MS));
        }

        async function renew() {
            try {
                const tokens = await refresh();
                expiresAt = (await startSession(tokens.accessToken)).expiresAt;
                schedule();
            }
            catch {
                window.location.assign(`/admin/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            }
        }

        // Timers sleep with the laptop; check again whenever the tab comes back.
        function onVisible() {
            if (document.visibilityState === 'visible' && expiresAt * 1000 - Date.now() < MARGIN_MS)
                void renew();
        }

        void currentSession().then(
            (session) => {
                expiresAt = session.expiresAt;
                schedule();
            },
            () => void renew(),
        );
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [user]);

    return children;
}
