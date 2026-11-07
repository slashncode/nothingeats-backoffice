import type { PostgresAdapter } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';
import type { KafkaConnection } from '../config';
import { and, asc, inArray, isNotNull, isNull, lt } from '@payloadcms/db-postgres/drizzle';

import { ProduceAcks, Producer, stringSerializers } from '@platformatic/kafka';
import { outboxEvents } from './table';

export interface RelayConfig {
    kafka: KafkaConnection;
    pollIntervalMs: number;
    batchSize: number;
    maxBackoffMs: number;
    /** Published rows stay this long (for looking into), then they go. */
    retentionMs: number;
}

const PURGE_EVERY_MS = 60 * 60 * 1000;

/**
 * Publishes outbox rows to Kafka in insertion order and marks them, like platform-kafka's relay:
 * rows are locked with `FOR UPDATE SKIP LOCKED`, so replicas relay side by side without sending a
 * row twice; if Kafka is down the transaction rolls back and the batch comes again after a pause
 * that doubles. At least once: consumers deduplicate.
 */
export class OutboxRelay {
    private readonly producer: Producer<string, string, string, string>;
    private running = false;
    private loop: Promise<void> | undefined;
    private wake: (() => void) | undefined;
    private lastPurge = 0;

    constructor(private readonly payload: Payload, private readonly config: RelayConfig) {
        this.producer = new Producer({
            ...config.kafka,
            clientId: 'backoffice-outbox',
            serializers: stringSerializers,
            acks: ProduceAcks.ALL,
            idempotent: true,
        });
    }

    private get db() {
        return (this.payload.db as unknown as PostgresAdapter).drizzle;
    }

    start(): void {
        if (this.running)
            return;
        this.running = true;
        this.loop = this.run();
    }

    async stop(): Promise<void> {
        this.running = false;
        this.wake?.();
        await this.loop;
        await this.producer.close().catch(() => {});
    }

    /** Publishes one batch; returns how many events went out. */
    async publishBatch(): Promise<number> {
        return this.db.transaction(async (tx) => {
            const rows = await tx
                .select()
                .from(outboxEvents)
                .where(isNull(outboxEvents.publishedAt))
                .orderBy(asc(outboxEvents.position))
                .limit(this.config.batchSize)
                .for('update', { skipLocked: true });
            if (rows.length === 0)
                return 0;
            await this.producer.send({
                messages: rows.map(row => ({
                    topic: row.topic,
                    key: row.partitionKey,
                    value: row.payload,
                    headers: { 'content-type': 'application/cloudevents+json' },
                })),
            });
            await tx
                .update(outboxEvents)
                .set({
                    publishedAt: new Date(),
                })
                .where(inArray(outboxEvents.id, rows.map(row => row.id)));
            return rows.length;
        });
    }

    async purge(now = Date.now()): Promise<void> {
        await this.db
            .delete(outboxEvents)
            .where(and(isNotNull(outboxEvents.publishedAt), lt(outboxEvents.publishedAt, new Date(now - this.config.retentionMs))));
    }

    private async run(): Promise<void> {
        let backoff = this.config.pollIntervalMs;
        while (this.running) {
            try {
                const published = await this.publishBatch();
                if (published > 0)
                    this.payload.logger.info({ published }, 'Published outbox events');
                if (Date.now() - this.lastPurge > PURGE_EVERY_MS) {
                    await this.purge();
                    this.lastPurge = Date.now();
                }
                backoff = this.config.pollIntervalMs;
                if (published < this.config.batchSize)
                    await this.pause(this.config.pollIntervalMs);
            }
            catch (error) {
                this.payload.logger.warn({ err: error, retryInMs: backoff }, 'Publishing outbox events failed');
                await this.pause(backoff);
                backoff = Math.min(backoff * 2, this.config.maxBackoffMs);
            }
        }
    }

    private pause(ms: number): Promise<void> {
        return new Promise((resolve) => {
            const timer = setTimeout(resolve, ms);
            this.wake = () => {
                clearTimeout(timer);
                resolve();
            };
        });
    }
}

const RELAY = Symbol.for('nothingeats.backoffice.outboxRelay');

/**
 * One relay per process: the dev server initialises Payload again on every config change, and a
 * second loop would only compete for the same rows.
 */
export function startRelay(payload: Payload, config: RelayConfig): void {
    const holder = globalThis as typeof globalThis & { [RELAY]?: OutboxRelay };
    const previous = holder[RELAY];
    const relay = new OutboxRelay(payload, config);
    holder[RELAY] = relay;
    void (previous?.stop() ?? Promise.resolve()).then(() => relay.start());
    process.once('SIGTERM', () => void relay.stop());
}
