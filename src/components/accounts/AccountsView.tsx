import type { AdminViewServerProps } from 'payload';

import { AdminPage } from '../admin/AdminPage';
import { AccountsClient } from './AccountsClient';

/** `/admin/accounts`: the shop's accounts (identity), inside the admin's frame. Admins only. */
export function AccountsView(props: AdminViewServerProps) {
    const user = props.initPageResult.req.user as { identityId?: string } | null;
    return (
        <AdminPage {...props}>
            <AccountsClient ownId={String(user?.identityId ?? '')} />
        </AdminPage>
    );
}
