import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCLICommand } from 'payload/cli';
import { z } from 'zod';

import { seed } from './seed';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../seed');

/** `payload seed`: the shop's starting content; whatever exists already stays untouched. */
export const seedCommand = defineCLICommand({
    description: 'Load the starting content (restaurants, dishes, badges, wheel, deal planner) where it is missing',
    input: z.object({}),
    handler: async ({ getPayload }) => {
        const payload = await getPayload();
        const result = await seed(payload, directory);
        payload.logger.info(result, 'Seed done');
        return { result };
    },
});
