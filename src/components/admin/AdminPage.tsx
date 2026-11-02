import type { AdminViewServerProps } from 'payload';
import { Gutter } from '@payloadcms/ui';
import { DefaultTemplate } from '@payloadcms/ui/rsc';

/** The admin's frame (nav, header) around an operations view. Admins only: initPage sends others to the login. */
export function AdminPage({ initPageResult, params, searchParams, children }: AdminViewServerProps & { children: React.ReactNode }) {
    const { req, locale, permissions, visibleEntities } = initPageResult;
    if (!req.user)
        return null;
    return (
        <DefaultTemplate
            i18n={req.i18n}
            locale={locale}
            params={params}
            payload={req.payload}
            permissions={permissions}
            searchParams={searchParams}
            user={req.user}
            visibleEntities={visibleEntities}
        >
            <Gutter>{children}</Gutter>
        </DefaultTemplate>
    );
}
