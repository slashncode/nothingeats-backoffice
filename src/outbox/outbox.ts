import type { PostgresAdapter } from '@payloadcms/db-postgres';
import type { PayloadRequest } from 'payload';
import { randomUUID } from 'node:crypto';

import { outboxEvents } from './table';

export const SOURCE = '/nothingeats/backoffice';

/** A CloudEvent in structured mode, the envelope every NothingEats event uses. */
export interface CloudEvent<T> {
    specversion: '1.0';
    id: string;
    source: string;
    type: string;
    subject: string;
    time: string;
    datacontenttype: 'application/json';
    data: T;
}

export interface OutboxMessage<T> {
    topic: string;
    /** Record key and CloudEvents subject: the aggregate id, so events of one document stay in order. */
    key: string;
    type: string;
    data: T;
}

/**
 * Writes an event into the outbox inside the transaction of `req`, the one that saves the change it
 * describes: both are committed or neither is. Without a transaction it refuses instead of writing
 * an event that could outlive a rolled-back change.
 */
export async function enqueue<T>(req: PayloadRequest, message: OutboxMessage<T>, now = new Date()): Promise<CloudEvent<T>> {
    const adapter = req.payload.db as unknown as PostgresAdapter;
    const transactionId = req.transactionID
        ? await req.transactionID
        : undefined;
    const tx = transactionId === undefined
        ? undefined
        : adapter.sessions[transactionId]?.db;
    if (!tx)
        throw new Error(`No transaction for the outbox event ${message.type}; pass req to the operation`);
    const event: CloudEvent<T> = {
        specversion: '1.0',
        id: randomUUID(),
        source: SOURCE,
        type: message.type,
        subject: message.key,
        time: now.toISOString(),
        datacontenttype: 'application/json',
        data: message.data,
    };
    await tx.insert(outboxEvents).values({
        id: event.id,
        topic: message.topic,
        partitionKey: message.key,
        type: message.type,
        payload: JSON.stringify(event),
        createdAt: now,
    });
    return event;
}
