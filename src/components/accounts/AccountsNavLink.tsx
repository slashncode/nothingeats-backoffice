'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../../i18n';
import { useTranslation } from '@payloadcms/ui';

/** The accounts view in the sidebar, after the collections. */
export function AccountsNavLink() {
    const { t } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const selected = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/accounts');
    return (
        <a href="/admin/accounts" className={`nav__link${selected ? ' nav__link--selected' : ''}`} aria-current={selected ? 'page' : undefined}>
            <span className="nav__link-label">{t('backoffice:accountsTitle')}</span>
        </a>
    );
}
