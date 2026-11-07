import type { LoggerOptions } from 'pino';
import { pino } from 'pino';
import { describe, expect, it } from 'vitest';

import { isClientGone, productionLogger } from '../src/logging';

function clientGone(): Error {
    return Object.assign(new Error('aborted'), { code: 'ECONNRESET' });
}

function capture() {
    const lines: Record<string, unknown>[] = [];
    const config = productionLogger() as { options: LoggerOptions };
    const logger = pino(config.options, {
        write: (line: string) => lines.push(JSON.parse(line)),
    });
    return { logger, lines };
}

describe('logging', () => {
    it('recognizes only the error of a client that went away', () => {
        expect(isClientGone(clientGone())).toBe(true);
        expect(isClientGone(new Error('aborted'))).toBe(false);
        expect(isClientGone(Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }))).toBe(false);
        expect(isClientGone('aborted')).toBe(false);
    });

    it('drops errors about a client that went away, in both shapes Payload logs them', () => {
        const { logger, lines } = capture();

        logger.error(clientGone());
        logger.error({
            err: clientGone(),
        });
        logger.error({
            err: new Error('database down'),
        });
        logger.info({
            err: clientGone(),
        }, 'kept below error level');

        expect(lines.map(it => it.msg)).toEqual(['database down', 'kept below error level']);
        expect(lines[0]).toMatchObject({ level: 50, service: 'backoffice' });
    });
});
