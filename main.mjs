// The image's entry point. `serve` (what the chart passes) starts the server: the TanStack Start
// handler from `dist/server` and the admin's static files from `dist/client`. Migrations run when
// Payload starts (prodMigrations), so there is no separate `migrate` mode.
import { serve } from 'srvx';
import { staticMiddleware } from 'srvx/static';

// eslint-disable-next-line antfu/no-import-dist -- the image runs the build output on purpose
import app from './dist/server/server.js';

const [mode = 'serve'] = process.argv.slice(2);
if (mode !== 'serve') {
    console.error(`Unknown mode "${mode}"; the backoffice only serves (migrations run on start).`);
    process.exit(2);
}

serve({
    port: Number(process.env.HTTP__PORT ?? 8080),
    hostname: '0.0.0.0',
    middleware: [
        staticMiddleware({ dir: 'dist/client' }),
    ],
    fetch: app.fetch,
    gracefulShutdown: true,
});
