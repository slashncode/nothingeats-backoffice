import type { AdminViewServerProps } from 'payload';

import { AdminPage } from '../admin/AdminPage';
import { SearchIndexClient } from './SearchIndexClient';

/** `/admin/search-index`: the search service's live index and its reindex runs. */
export function SearchIndexView(props: AdminViewServerProps) {
    return (
        <AdminPage {...props}>
            <SearchIndexClient />
        </AdminPage>
    );
}
