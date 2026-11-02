'use client';

import type { BackofficeTranslationKeys, BackofficeTranslations } from '../../i18n';
import type { Page } from '../admin/api';
import { Button, useTranslation } from '@payloadcms/ui';
import { Fragment, useEffect, useState } from 'react';

import styles from '../admin/admin.module.css';
import { adminCall, customerByEmail, customerEmails, formatDateTime, formatMoney, usePagedList } from '../admin/api';

interface OrderLine { dishId: string; name: string; quantity: number; unitPriceCents: number; totalCents: number }

interface AdminOrder {
    userId: string;
    language: string;
    quotedSeconds: number;
    order: {
        id: string;
        status: string;
        placedAt: string;
        estimatedArrivalAt: string;
        restaurant: { slug: string; name: string };
        lines: OrderLine[];
        subtotalCents: number;
        deliveryFeeCents: number;
        discountCents: number;
        couponCode?: string | null;
        totalCents: number;
        dropOff: { latitude: number; longitude: number; label?: string | null };
        quoteSource: string;
    };
}

interface Today { day: string; placed: number; byStatus: Record<string, number> }

const STATUSES = [
    'PLACED',
    'ACCEPTED',
    'COOKING',
    'PICKED_UP',
    'EN_ROUTE',
    'DELIVERED',
] as const;

const STATUS_KEYS: Record<string, BackofficeTranslationKeys> = {
    PLACED: 'backoffice:orderStatusPlaced',
    ACCEPTED: 'backoffice:orderStatusAccepted',
    COOKING: 'backoffice:orderStatusCooking',
    PICKED_UP: 'backoffice:orderStatusPickedUp',
    EN_ROUTE: 'backoffice:orderStatusEnRoute',
    DELIVERED: 'backoffice:orderStatusDelivered',
};

/** Today's numbers, filters and the list; a row opens the order's dishes, drop-off and quote. */
export function OrdersClient({ restaurants }: { restaurants: { slug: string; name: string }[] }) {
    const { t, i18n } = useTranslation<BackofficeTranslations, BackofficeTranslationKeys>();
    const [status, setStatus] = useState('');
    const [restaurant, setRestaurant] = useState('');
    const [email, setEmail] = useState('');
    const [noCustomer, setNoCustomer] = useState(false);
    const [today, setToday] = useState<Today>();
    const [emails, setEmails] = useState<Record<string, string>>({});
    const [open, setOpen] = useState<string>();
    const language = i18n.language;

    const list = usePagedList<AdminOrder>(`${status}|${restaurant}|${email}`, async (cursor) => {
        const params = new URLSearchParams({ limit: '25', lang: language });
        if (status)
            params.set('status', status);
        if (restaurant)
            params.set('restaurant', restaurant);
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
        const page = await adminCall<Page<AdminOrder>>('GET', `/orders?${params}`);
        const named = await customerEmails(page.items.map(item => item.userId)).catch(() => ({}));
        setEmails(previous => ({
            ...previous,
            ...named,
        }));
        return page;
    });

    useEffect(() => {
        void adminCall<Today>('GET', '/orders/today').then(setToday).catch(() => undefined);
    }, []);

    return (
        <div className={styles.view}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('backoffice:ordersTitle')}</h1>
                <p className={styles.intro}>{t('backoffice:ordersIntro')}</p>
            </header>
            {today && (
                <dl className={styles.stats} aria-label={t('backoffice:ordersToday')}>
                    <div className={styles.stat}>
                        <dt>{t('backoffice:ordersToday')}</dt>
                        <dd>{today.placed}</dd>
                    </div>
                    {STATUSES.map(key => (
                        <div key={key} className={styles.stat}>
                            <dt>{t(STATUS_KEYS[key]!)}</dt>
                            <dd>{today.byStatus[key] ?? 0}</dd>
                        </div>
                    ))}
                </dl>
            )}
            <div className={styles.filters}>
                <select className={styles.select} aria-label={t('backoffice:ordersStatus')} value={status} onChange={event => setStatus(event.target.value)}>
                    <option value="">{t('backoffice:ordersStatusAll')}</option>
                    {STATUSES.map(key => <option key={key} value={key}>{t(STATUS_KEYS[key]!)}</option>)}
                </select>
                <select className={styles.select} aria-label={t('backoffice:ordersRestaurant')} value={restaurant} onChange={event => setRestaurant(event.target.value)}>
                    <option value="">{t('backoffice:ordersRestaurantAll')}</option>
                    {restaurants.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                </select>
                <input
                    className={styles.search}
                    type="search"
                    aria-label={t('backoffice:ordersCustomer')}
                    placeholder={t('backoffice:ordersCustomer')}
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                />
            </div>
            {noCustomer && <p className={styles.muted}>{t('backoffice:ordersNoCustomer')}</p>}
            {list.error && <p role="alert" className={styles.error}>{t('backoffice:failed', { code: list.error })}</p>}
            <div className="table">
                <table>
                    <thead>
                        <tr>
                            <th>{t('backoffice:ordersPlaced')}</th>
                            <th>{t('backoffice:ordersCustomerColumn')}</th>
                            <th>{t('backoffice:ordersRestaurant')}</th>
                            <th>{t('backoffice:ordersItems')}</th>
                            <th>{t('backoffice:ordersTotal')}</th>
                            <th>{t('backoffice:ordersStatus')}</th>
                            <th aria-label={t('backoffice:ordersDetails')} />
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.map(({ userId, language: orderLanguage, quotedSeconds, order }) => (
                            <Fragment key={order.id}>
                                <tr>
                                    <td>{formatDateTime(order.placedAt, language)}</td>
                                    <td>{emails[userId] ?? <span className={styles.muted}>{t('backoffice:ordersDeleted')}</span>}</td>
                                    <td>{order.restaurant.name}</td>
                                    <td>{order.lines.reduce((sum, line) => sum + line.quantity, 0)}</td>
                                    <td>{formatMoney(order.totalCents, language)}</td>
                                    <td>
                                        {STATUS_KEYS[order.status]
                                            ? t(STATUS_KEYS[order.status]!)
                                            : order.status}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={styles.linkButton}
                                            aria-expanded={open === order.id}
                                            onClick={() => setOpen(open === order.id
                                                ? undefined
                                                : order.id)}
                                        >
                                            {open === order.id
                                                ? t('backoffice:ordersHide')
                                                : t('backoffice:ordersDetails')}
                                        </button>
                                    </td>
                                </tr>
                                {open === order.id && (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className={styles.detail}>
                                                <dl className={styles.facts}>
                                                    <dt>{t('backoffice:ordersLines')}</dt>
                                                    <dd>
                                                        {order.lines.map(line => (
                                                            <div key={line.dishId}>
                                                                {`${line.quantity} × ${line.name} – ${formatMoney(line.totalCents, language)}`}
                                                            </div>
                                                        ))}
                                                    </dd>
                                                    {order.couponCode && (
                                                        <>
                                                            <dt>{t('backoffice:ordersCoupon')}</dt>
                                                            <dd>{`${order.couponCode} (−${formatMoney(order.discountCents, language)})`}</dd>
                                                        </>
                                                    )}
                                                    <dt>{t('backoffice:ordersDropOff')}</dt>
                                                    <dd>{order.dropOff.label ?? `${order.dropOff.latitude.toFixed(4)}, ${order.dropOff.longitude.toFixed(4)}`}</dd>
                                                    <dt>{t('backoffice:ordersQuote')}</dt>
                                                    <dd>
                                                        {t(order.quoteSource === 'delivery'
                                                            ? 'backoffice:ordersQuoteDelivery'
                                                            : 'backoffice:ordersQuoteEstimate', {
                                                            minutes: Math.round(quotedSeconds / 60),
                                                        })}
                                                    </dd>
                                                    <dt>{t('backoffice:ordersArrival')}</dt>
                                                    <dd>{formatDateTime(order.estimatedArrivalAt, language)}</dd>
                                                    <dt>{t('backoffice:ordersLanguage')}</dt>
                                                    <dd>{orderLanguage}</dd>
                                                </dl>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {!list.busy && list.items.length === 0 && !noCustomer && <p>{t('backoffice:ordersNone')}</p>}
            {list.next && <Button margin={false} buttonStyle="secondary" disabled={list.busy} onClick={() => list.more(list.next!)}>{t('backoffice:more')}</Button>}
        </div>
    );
}
