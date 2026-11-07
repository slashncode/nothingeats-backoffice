// The image's entry point. `serve` (what the chart passes) starts the server: the TanStack Start
// handler from `dist/server` and the admin's static files from `dist/client`. Migrations run when
// Payload starts (prodMigrations), so there is no separate `migrate` mode.
import { serve } from 'srvx';
import { staticMiddleware } from 'srvx/static';

// eslint-disable-next-line antfu/no-import-dist -- the image runs the build output on purpose
import app from './dist/server/server.js';

// A client that went away mid-request (a closed tab, a navigation to another admin page) is not a
// server fault, but TanStack Start's error handler and React's server renderer both print the error
// Node destroys such a request with, and neither has a hook for it. Payload's own logger drops it
// in src/logging.ts.
const consoleError = console.error;
console.error = (...args) => {
    if (!args.some(arg => arg instanceof Error && arg.message === 'aborted' && arg.code === 'ECONNRESET'))
        consoleError(...args);
};

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
