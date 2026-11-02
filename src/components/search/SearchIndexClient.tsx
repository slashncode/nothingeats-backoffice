'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../../i18n';
import { Button, ConfirmationModal, useModal, useTranslation } from '@payloadcms/ui';
import { useCallback, useEffect, useState } from 'react';

import styles from '../admin/admin.module.css';
import { adminCall, formatDateTime } from '../admin/api';

interface Run {
    id: string;
    startedAt: string;
    finishedAt?: string;
    events?: number;
    generation?: string;
    failed: boolean;
}

interface IndexStatus {
    live?: string;
    dishes: number;
    restaurants: number;
    running?: Run;
    last?: Run;
}

const CONFIRM_MODAL = 'confirm-reindex';

/** The live index; a reindex runs in the search service, and the view follows it until it ends. */
export function SearchIndexClient() {
    const { t, i18n } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const { openModal } = useModal();
    const [status, setStatus] = useState<IndexStatus>();
    const [error, setError] = useState<string>();
    const language = i18n.language;

    const refresh = useCallback(async () => {
        try {
            setStatus(await adminCall<IndexStatus>('GET', '/search/index'));
        }
        catch (failure) {
            setError((failure as Error).message);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    // While a run goes on, ask again every two seconds.
    useEffect(() => {
        if (!status?.running)
            return;
        const timer = setInterval(() => void refresh(), 2000);
        return () => clearInterval(timer);
    }, [status?.running, refresh]);

    async function reindex() {
        setError(undefined);
        try {
            await adminCall('POST', '/search/reindex');
        }
        catch (failure) {
            setError((failure as Error).message);
        }
        await refresh();
    }

    const last = status?.last;
    return (
        <div className={styles.view}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('backoffice:searchTitle')}</h1>
                <p className={styles.intro}>{t('backoffice:searchIntro')}</p>
            </header>
            {error && <p role="alert" className={styles.error}>{t('backoffice:failed', { code: error })}</p>}
            {status && (
                <>
                    <dl className={styles.stats}>
                        <div className={styles.stat}>
                            <dt>{t('backoffice:searchDishes')}</dt>
                            <dd>{status.dishes}</dd>
                        </div>
                        <div className={styles.stat}>
                            <dt>{t('backoffice:searchRestaurants')}</dt>
                            <dd>{status.restaurants}</dd>
                        </div>
                    </dl>
                    <dl className={styles.detail}>
                        <dt>{t('backoffice:searchLive')}</dt>
                        <dd>{status.live ?? '–'}</dd>
                        <dt>{t('backoffice:searchLast')}</dt>
                        <dd role="status">
                            {status.running
                                ? t('backoffice:searchRunning', {
                                        time: formatDateTime(status.running.startedAt, language),
                                    })
                                : !last
                                        ? t('backoffice:searchNever')
                                        : last.failed
                                            ? t('backoffice:searchLastFailed', {
                                                    time: formatDateTime(last.finishedAt, language),
                                                })
                                            : t('backoffice:searchLastResult', {
                                                    time: formatDateTime(last.finishedAt, language),
                                                    events: last.events ?? 0,
                                                    generation: last.generation ?? '',
                                                })}
                        </dd>
                    </dl>
                    <div>
                        <Button margin={false} disabled={Boolean(status.running)} onClick={() => openModal(CONFIRM_MODAL)}>
                            {t('backoffice:searchReindex')}
                        </Button>
                    </div>
                </>
            )}
            <ConfirmationModal
                modalSlug={CONFIRM_MODAL}
                heading={t('backoffice:confirmTitle')}
                body={t('backoffice:searchConfirm')}
                onConfirm={reindex}
            />
        </div>
    );
}
