'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../../i18n';
import { NavGroup, PayloadLink, usePathname, useTranslation } from '@payloadcms/ui';

const LINKS: { path: string; label: BackofficeTranslationKeys }[] = [
    { path: '/admin/orders', label: 'backoffice:ordersTitle' },
    { path: '/admin/coach', label: 'backoffice:coachTitle' },
    { path: '/admin/accounts', label: 'backoffice:accountsTitle' },
    { path: '/admin/search-index', label: 'backoffice:searchTitle' },
];

/** The views on other services' data, as one group in the sidebar after the collections. */
export function OperationsNav() {
    const { t } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const pathname = usePathname() ?? '';
    return (
        <NavGroup label={t('backoffice:operations')}>
            {LINKS.map(({ path, label }) => {
                const selected = pathname.startsWith(path);
                return (
                    <PayloadLink key={path} href={path} className={`nav__link${selected ? ' nav__link--selected' : ''}`} aria-current={selected ? 'page' : undefined}>
                        <span className="nav__link-label">{t(label)}</span>
                    </PayloadLink>
                );
            })}
        </NavGroup>
    );
}
