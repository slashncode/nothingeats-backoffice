import type { AdminViewServerProps } from 'payload';

import { AdminPage } from '../admin/AdminPage';
import { ConversationsClient } from './ConversationsClient';

/** `/admin/coach`: the Craving Coach's conversations, read from the assistant. */
export function CoachView(props: AdminViewServerProps) {
    return (
        <AdminPage {...props}>
            <ConversationsClient />
        </AdminPage>
    );
}
