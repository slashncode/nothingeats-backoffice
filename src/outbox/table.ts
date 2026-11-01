import { sql } from '@payloadcms/db-postgres/drizzle';
import { bigserial, index, pgTable, text, timestamp, uuid } from '@payloadcms/db-postgres/drizzle/pg-core';

/**
 * The outbox, same shape as platform-kafka's: events wait here, written in the transaction of the
 * change they describe, until the relay has published them. Not a Payload collection; Payload's
 * schema hook adds it, so migrations create it like every other table.
 */
export const outboxEvents = pgTable('outbox_events', {
    id: uuid('id').primaryKey(),
    position: bigserial('position', { mode: 'number' }).notNull(),
    topic: text('topic').notNull(),
    partitionKey: text('partition_key').notNull(),
    type: text('type').notNull(),
    payload: text('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
}, table => [
    index('outbox_events_unpublished_idx').on(table.position).where(sql`${table.publishedAt} is null`),
]);
