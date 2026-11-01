import type { AdminViewServerProps } from 'payload';
import { Gutter } from '@payloadcms/ui';
import { DefaultTemplate } from '@payloadcms/ui/rsc';

import { AccountsClient } from './AccountsClient';

/** `/admin/accounts`: the shop's accounts (identity), inside the admin's frame. Admins only. */
export function AccountsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
    const { req, locale, permissions, visibleEntities } = initPageResult;
    // initPage already sends visitors without a session to the login.
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
            <Gutter>
                <AccountsClient ownId={String((req.user as { identityId?: string }).identityId ?? '')} />
            </Gutter>
        </DefaultTemplate>
    );
}
