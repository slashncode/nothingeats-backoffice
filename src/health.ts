import type { PostgresAdapter } from '@payloadcms/db-postgres';
import type { Endpoint } from 'payload';
import { sql } from '@payloadcms/db-postgres/drizzle';

/**
 * Probes for Kubernetes, under the API path (`/api/backoffice/health/...`): live while the process
 * answers, ready while Postgres does.
 */
export const healthEndpoints: Endpoint[] = [
    {
        path: '/health/live',
        method: 'get',
        handler: () => Response.json({ status: 'UP' }),
    },
    {
        path: '/health/ready',
        method: 'get',
        handler: async (req) => {
            try {
                await (req.payload.db as unknown as PostgresAdapter).drizzle.execute(sql`select 1`);
                return Response.json({ status: 'UP' });
            }
            catch {
                return Response.json({ status: 'DOWN' }, { status: 503 });
            }
        },
    },
];
