'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../../i18n';
import { PayloadLink, usePathname, useTranslation } from '@payloadcms/ui';

const PATH = '/admin/accounts';

/** The accounts view in the sidebar, after the collections; marked like Payload's own links. */
export function AccountsNavLink() {
    const { t } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const selected = usePathname()?.startsWith(PATH) ?? false;
    return (
        <PayloadLink href={PATH} className={`nav__link${selected ? ' nav__link--selected' : ''}`} aria-current={selected ? 'page' : undefined}>
            <span className="nav__link-label">{t('backoffice:accountsTitle')}</span>
        </PayloadLink>
    );
}
