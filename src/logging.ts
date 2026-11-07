import type { Config } from 'payload';

/**
 * The error Node destroys a request with when its client went away mid-request: a closed tab, a
 * navigation to another admin page, a fetch the admin aborted. Not a fault of the server.
 */
export function isClientGone(value: unknown): boolean {
    return value instanceof Error && value.message === 'aborted' && (value as NodeJS.ErrnoException).code === 'ECONNRESET';
}

const ERROR_LEVEL = 50;

/**
 * Payload's logger in the image: one JSON line per entry like the other services (Payload's
 * default prints colored text for a terminal), and a client that went away is not logged as an
 * error. Payload logs that one twice per aborted request body, as an error object and as `{ err }`.
 */
export function productionLogger(): Config['logger'] {
    return {
        options: {
            base: { service: 'backoffice' },
            hooks: {
                logMethod(args, method, level) {
                    const [first] = args as unknown[];
                    const error = first !== null && typeof first === 'object' && 'err' in first
                        ? first.err
                        : first;
                    if (level >= ERROR_LEVEL && isClientGone(error))
                        return;
                    method.apply(this, args);
                },
            },
        },
    };
}
