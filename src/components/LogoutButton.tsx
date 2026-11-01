'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../i18n';
import { LogOutIcon, useTranslation } from '@payloadcms/ui';

import { logout } from './session';

/** Ends the backoffice session and the identity session behind it (the shop's too, same browser). */
export function LogoutButton() {
    const { t } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    return (
        <button
            type="button"
            className="nav__log-out"
            aria-label={t('backoffice:logout')}
            title={t('backoffice:logout')}
            onClick={() => void logout().then(() => window.location.assign('/admin/login'))}
        >
            <LogOutIcon />
        </button>
    );
}
