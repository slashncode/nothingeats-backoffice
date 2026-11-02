import type { AdminViewServerProps } from 'payload';

import { AdminPage } from '../admin/AdminPage';
import { OrdersClient } from './OrdersClient';

/** `/admin/orders`: every customer's orders, read from ordering. The restaurant filter lists the CMS's restaurants. */
export async function OrdersView(props: AdminViewServerProps) {
    const { req } = props.initPageResult;
    const restaurants = req.user
        ? await req.payload.find({
                collection: 'restaurants',
                limit: 200,
                depth: 0,
                sort: 'name',
                select: { name: true, slug: true },
                req,
            })
        : { docs: [] };
    return (
        <AdminPage {...props}>
            <OrdersClient restaurants={restaurants.docs.map(doc => ({ slug: doc.slug, name: doc.name }))} />
        </AdminPage>
    );
}
