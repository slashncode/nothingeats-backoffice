import { beforeAll, describe, expect, it } from 'vitest';

describe('the Payload config', () => {
    beforeAll(() => {
        process.env.PAYLOAD__SECRET ??= 'x'.repeat(32);
    });

    // Handlers are tested on their own; this catches one that never made it into the config.
    it('registers every endpoint the shop and the admin call', async () => {
        const config = await (await import('../src/payload.config')).default;
        const routes = config.endpoints?.map(endpoint => `${endpoint.method} ${endpoint.path}`) ?? [];

        expect(routes).toEqual(expect.arrayContaining([
            'get /health/ready',
            'get /v1/articles',
            'get /v1/texts',
            'get /v1/admin/accounts',
            'put /v1/admin/accounts/:id/lock',
            'delete /v1/admin/accounts/:id',
        ]));
    });
});
