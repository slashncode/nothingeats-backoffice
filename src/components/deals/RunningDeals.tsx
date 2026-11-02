'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../../i18n';
import { Button, ConfirmationModal, PayloadLink, useModal, useTranslation } from '@payloadcms/ui';
import { useCallback, useEffect, useState } from 'react';

import styles from '../admin/admin.module.css';
import { adminCall, formatDateTime, formatMoney } from '../admin/api';

interface CatalogDeal {
    id: string;
    source: 'PLANNER' | 'BACKOFFICE';
    percentOff: number;
    priceCents: number;
    regularPriceCents: number;
    startsAt: string;
    endsAt: string;
    running: boolean;
    dish: { name: string };
    restaurant: { name: string };
}

const CONFIRM_MODAL = 'confirm-end-deal';

/**
 * Catalog's deals now and later, under the planner's settings. A running planner deal can be ended
 * at once (the planner fills the slot with another dish); a deal from "Deals of the day" is
 * cancelled there, so this list links to it instead.
 */
export function RunningDeals() {
    const { t, i18n } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const { openModal } = useModal();
    const [deals, setDeals] = useState<CatalogDeal[]>();
    const [ending, setEnding] = useState<CatalogDeal>();
    const [error, setError] = useState<string>();
    const language = i18n.language;

    const load = useCallback(async () => {
        try {
            setDeals((await adminCall<{ items: CatalogDeal[] }>('GET', `/deals?lang=${language}`)).items);
        }
        catch (failure) {
            setError((failure as Error).message);
        }
    }, [language]);

    useEffect(() => {
        void load();
    }, [load]);

    async function end() {
        if (!ending)
            return;
        setError(undefined);
        try {
            await adminCall('DELETE', `/deals/${encodeURIComponent(ending.id)}`);
        }
        catch (failure) {
            setError((failure as Error).message);
        }
        setEnding(undefined);
        await load();
    }

    return (
        <div className={styles.view}>
            <header className={styles.header}>
                <h2 className={styles.subtitle}>{t('backoffice:dealsRunningTitle')}</h2>
                <p className={styles.intro}>{t('backoffice:dealsRunningIntro')}</p>
            </header>
            {error && <p role="alert" className={styles.error}>{t('backoffice:failed', { code: error })}</p>}
            {deals && deals.length === 0 && <p>{t('backoffice:dealsNone')}</p>}
            {deals && deals.length > 0 && (
                <div className="table">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('backoffice:dealsDish')}</th>
                                <th>{t('backoffice:ordersRestaurant')}</th>
                                <th>{t('backoffice:dealsPrice')}</th>
                                <th>{t('backoffice:dealsWhen')}</th>
                                <th aria-label={t('backoffice:ordersActionsLabel')} />
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map(deal => (
                                <tr key={deal.id}>
                                    <td>{deal.dish.name}</td>
                                    <td>{deal.restaurant.name}</td>
                                    <td>{`−${deal.percentOff} %: ${formatMoney(deal.priceCents, language)} (${formatMoney(deal.regularPriceCents, language)})`}</td>
                                    <td>
                                        {deal.running
                                            ? t('backoffice:dealsUntil', {
                                                    time: formatDateTime(deal.endsAt, language),
                                                })
                                            : t('backoffice:dealsFrom', {
                                                    time: formatDateTime(deal.startsAt, language),
                                                })}
                                    </td>
                                    <td>
                                        {deal.source === 'PLANNER'
                                            ? deal.running && (
                                                <Button
                                                    margin={false}
                                                    buttonStyle="secondary"
                                                    onClick={() => {
                                                        setEnding(deal);
                                                        openModal(CONFIRM_MODAL);
                                                    }}
                                                >
                                                    {t('backoffice:dealsEnd')}
                                                </Button>
                                            )
                                            : (
                                                    <PayloadLink href={`/admin/collections/deals/${deal.id}`}>
                                                        {t('backoffice:dealsScheduled')}
                                                    </PayloadLink>
                                                )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmationModal
                modalSlug={CONFIRM_MODAL}
                heading={t('backoffice:confirmTitle')}
                body={ending
                    ? t('backoffice:dealsConfirmEnd', { dish: ending.dish.name })
                    : ''}
                onConfirm={end}
                onCancel={() => setEnding(undefined)}
            />
        </div>
    );
}
