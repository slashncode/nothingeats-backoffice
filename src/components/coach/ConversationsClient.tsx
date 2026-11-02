'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../../i18n';
import type { Page } from '../admin/api';
import { Button, useTranslation } from '@payloadcms/ui';
import { useState } from 'react';

import styles from '../admin/admin.module.css';
import { adminCall, customerByEmail, customerEmails, formatDateTime, usePagedList } from '../admin/api';

interface Summary {
    id: string;
    userId: string;
    title: string;
    messageCount: number;
    tokens: number;
    updatedAt: string;
}

/** An AI SDK UI message as the assistant stores it: text parts and tool parts (`tool-<name>`). */
interface Part {
    type: string;
    text?: string;
    input?: Record<string, unknown>;
    output?: { shown?: { name?: string; reason?: string }[] };
}

interface Transcript {
    id: string;
    userId: string;
    title: string;
    messages: { id: string; role: string; parts: Part[] }[];
}

/** The list, filtered by customer; a transcript opens below it. Reading one is logged by the assistant. */
export function ConversationsClient() {
    const { t, i18n } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const [email, setEmail] = useState('');
    const [noCustomer, setNoCustomer] = useState(false);
    const [emails, setEmails] = useState<Record<string, string>>({});
    const [transcript, setTranscript] = useState<Transcript>();
    const [error, setError] = useState<string>();
    const language = i18n.language;

    const list = usePagedList<Summary>(email, async (cursor) => {
        const params = new URLSearchParams({ limit: '25' });
        if (cursor)
            params.set('cursor', cursor);
        setNoCustomer(false);
        if (email.trim()) {
            const userId = await customerByEmail(email.trim());
            if (!userId) {
                setNoCustomer(true);
                return { items: [], nextCursor: null };
            }
            params.set('userId', userId);
        }
        const page = await adminCall<Page<Summary>>('GET', `/conversations?${params}`);
        const named = await customerEmails(page.items.map(item => item.userId)).catch(() => ({}));
        setEmails(previous => ({
            ...previous,
            ...named,
        }));
        return page;
    });

    async function read(id: string) {
        setError(undefined);
        try {
            setTranscript(await adminCall<Transcript>('GET', `/conversations/${encodeURIComponent(id)}`));
        }
        catch (failure) {
            setError((failure as Error).message);
        }
    }

    function describe(part: Part): string[] {
        if (part.type === 'text' && part.text)
            return [part.text];
        if (part.type === 'tool-searchDishes') {
            return [
                t('backoffice:coachSearched', {
                    query: String(part.input?.query ?? ''),
                }),
            ];
        }
        if (part.type === 'tool-getDish') {
            return [
                t('backoffice:coachLookedUp', {
                    id: String(part.input?.id ?? ''),
                }),
            ];
        }
        if (part.type === 'tool-recommendDishes')
            return (part.output?.shown ?? []).map(dish => t('backoffice:coachShowed', { dish: dish.name ?? '', reason: dish.reason ?? '' }));
        return [];
    }

    return (
        <div className={styles.view}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('backoffice:coachTitle')}</h1>
                <p className={styles.intro}>{t('backoffice:coachIntro')}</p>
            </header>
            <input
                className={styles.search}
                type="search"
                aria-label={t('backoffice:ordersCustomer')}
                placeholder={t('backoffice:ordersCustomer')}
                value={email}
                onChange={event => setEmail(event.target.value)}
            />
            {noCustomer && <p className={styles.muted}>{t('backoffice:ordersNoCustomer')}</p>}
            {(list.error ?? error) && <p role="alert" className={styles.error}>{t('backoffice:failed', { code: list.error ?? error ?? '' })}</p>}
            {transcript && (
                <section className={styles.transcript} aria-label={transcript.title}>
                    <div className={styles.actions}>
                        <strong>{emails[transcript.userId] ?? t('backoffice:ordersDeleted')}</strong>
                        <Button margin={false} buttonStyle="secondary" onClick={() => setTranscript(undefined)}>{t('backoffice:coachClose')}</Button>
                    </div>
                    {transcript.messages.map((message) => {
                        // Parts have no ids of their own; their place in a stored message never changes.
                        const lines = message.parts.flatMap((part, partIndex) => describe(part).map((text, lineIndex) => ({
                            key: `${message.id}:${partIndex}:${lineIndex}`,
                            text,
                            tool: part.type !== 'text',
                        })));
                        if (lines.length === 0)
                            return null;
                        const user = message.role === 'user';
                        return (
                            <div key={message.id} className={`${styles.message} ${user ? styles.messageUser : ''}`}>
                                <span className={styles.messageRole}>
                                    {user
                                        ? t('backoffice:coachCustomer')
                                        : t('backoffice:coachCoach')}
                                </span>
                                {lines.map(line => <p key={line.key} className={line.tool ? styles.tool : undefined}>{line.text}</p>)}
                            </div>
                        );
                    })}
                </section>
            )}
            <div className="table">
                <table>
                    <thead>
                        <tr>
                            <th>{t('backoffice:coachUpdated')}</th>
                            <th>{t('backoffice:ordersCustomerColumn')}</th>
                            <th>{t('backoffice:coachTopic')}</th>
                            <th>{t('backoffice:coachMessages')}</th>
                            <th>{t('backoffice:coachTokens')}</th>
                            <th aria-label={t('backoffice:coachOpen')} />
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.map(item => (
                            <tr key={item.id}>
                                <td>{formatDateTime(item.updatedAt, language)}</td>
                                <td>{emails[item.userId] ?? <span className={styles.muted}>{t('backoffice:ordersDeleted')}</span>}</td>
                                <td>{item.title}</td>
                                <td>{item.messageCount}</td>
                                <td>{item.tokens.toLocaleString(language)}</td>
                                <td>
                                    <button type="button" className={styles.linkButton} onClick={() => void read(item.id)}>{t('backoffice:coachOpen')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!list.busy && list.items.length === 0 && !noCustomer && <p>{t('backoffice:coachNone')}</p>}
            {list.next && <Button margin={false} buttonStyle="secondary" disabled={list.busy} onClick={() => list.more(list.next!)}>{t('backoffice:more')}</Button>}
        </div>
    );
}
