import type { Payload } from 'payload';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_PROFILE } from '../globals/Wheel';

// The shop's starting content, the backoffice's own copy since phase 6: catalog's restaurants and
// dishes with their ids (orders, search and coach cards keep pointing at the same dishes), the
// badges loyalty used to read from badges.json, the wheel's prizes and odds. Idempotent: what
// exists stays as it is.

interface Texts { de: string; en: string }

interface SeedDish {
    id: string;
    slug: string;
    section: Texts;
    name: Texts;
    description: Texts;
    priceCents: number;
    dietary: string[];
    allergens: string[];
    spiceLevel: number;
    calories: number;
    moods: string[];
    position: number;
    available: boolean;
}

interface SeedRestaurant {
    id: string;
    slug: string;
    name: string;
    description: Texts;
    cuisine: string;
    rating: number;
    deliveryMinutes: number;
    deliveryFeeCents: number;
    minimumOrderCents: number;
    latitude: number;
    longitude: number;
    opensAt: string;
    closesAt: string;
    dishes: SeedDish[];
}

interface SeedBadge {
    key: string;
    tier: string;
    name: Texts;
    description: Texts;
    rule: { type: string; min?: number; minCents?: number; fromHour?: number; toHour?: number };
}

interface SeedPrize { key: string; kind: string; label: Texts; [term: string]: unknown }
interface SeedWheel { prizes: SeedPrize[]; profiles: { name: string; weights: Record<string, number> }[] }

export interface SeedResult {
    restaurants: number;
    dishes: number;
    badges: number;
    wheel: boolean;
    dealPlanner: boolean;
}

async function json<T>(directory: string, file: string): Promise<T> {
    return JSON.parse(await readFile(path.join(directory, file), 'utf8')) as T;
}

// Payload 4's Local API checks access by default; the seed runs as the system.
const euros = (cents: number) => cents / 100;
const lower = (values: string[]) => values.map(value => value.toLowerCase());

export async function seed(payload: Payload, directory: string): Promise<SeedResult> {
    const result: SeedResult = {
        restaurants: 0,
        dishes: 0,
        badges: 0,
        wheel: false,
        dealPlanner: false,
    };
    const { restaurants } = await json<{ restaurants: SeedRestaurant[] }>(directory, 'catalog.json');

    for (const restaurant of restaurants) {
        const exists = await payload.find({
            overrideAccess: true,
            collection: 'restaurants',
            where: {
                id: { equals: restaurant.id },
            },
            limit: 1,
            depth: 0,
            draft: true,
        });
        if (exists.totalDocs === 0) {
            // German first as a draft, then English with the publish: an event always has both.
            await payload.create({
                overrideAccess: true,
                collection: 'restaurants',
                locale: 'de',
                draft: true,
                data: {
                    id: restaurant.id,
                    name: restaurant.name,
                    slug: restaurant.slug,
                    description: restaurant.description.de,
                    cuisine: restaurant.cuisine as never,
                    rating: restaurant.rating,
                    deliveryMinutes: restaurant.deliveryMinutes,
                    deliveryFee: euros(restaurant.deliveryFeeCents),
                    minimumOrder: euros(restaurant.minimumOrderCents),
                    opensAt: restaurant.opensAt,
                    closesAt: restaurant.closesAt,
                    location: { latitude: restaurant.latitude, longitude: restaurant.longitude },
                    archived: false,
                    _status: 'draft',
                },
            });
            await payload.update({
                overrideAccess: true,
                collection: 'restaurants',
                id: restaurant.id,
                locale: 'en',
                // Status is per language in Payload 4; the shop needs both, so publish all of them.
                publishAllLocales: true,
                data: { description: restaurant.description.en, _status: 'published' },
            });
            result.restaurants++;
        }

        for (const dish of restaurant.dishes) {
            const dishExists = await payload.find({
                overrideAccess: true,
                collection: 'dishes',
                where: {
                    id: { equals: dish.id },
                },
                limit: 1,
                depth: 0,
                draft: true,
            });
            if (dishExists.totalDocs > 0)
                continue;
            await payload.create({
                overrideAccess: true,
                collection: 'dishes',
                locale: 'de',
                draft: true,
                data: {
                    id: dish.id,
                    restaurant: restaurant.id,
                    slug: dish.slug,
                    name: dish.name.de,
                    section: dish.section.de,
                    description: dish.description.de,
                    price: euros(dish.priceCents),
                    dietary: lower(dish.dietary) as never,
                    allergens: lower(dish.allergens) as never,
                    spiceLevel: dish.spiceLevel,
                    calories: dish.calories,
                    moods: dish.moods as never,
                    position: dish.position,
                    available: dish.available,
                    archived: false,
                    _status: 'draft',
                },
            });
            await payload.update({
                overrideAccess: true,
                collection: 'dishes',
                id: dish.id,
                locale: 'en',
                publishAllLocales: true,
                data: {
                    name: dish.name.en,
                    section: dish.section.en,
                    description: dish.description.en,
                    _status: 'published',
                },
            });
            result.dishes++;
        }
    }

    const badges = await json<SeedBadge[]>(directory, 'badges.json');
    for (const [position, badge] of badges.entries()) {
        const exists = await payload.find({
            overrideAccess: true,
            collection: 'badges',
            where: {
                key: { equals: badge.key },
            },
            limit: 1,
            depth: 0,
            draft: true,
        });
        if (exists.totalDocs > 0)
            continue;
        const created = await payload.create({
            overrideAccess: true,
            collection: 'badges',
            locale: 'de',
            draft: true,
            data: {
                key: badge.key,
                tier: badge.tier as never,
                name: badge.name.de,
                description: badge.description.de,
                rule: {
                    type: badge.rule.type as never,
                    ...(badge.rule.min === undefined
                        ? {}
                        : { min: badge.rule.min }),
                    ...(badge.rule.minCents === undefined
                        ? {}
                        : {
                                minimum: euros(badge.rule.minCents),
                            }),
                    ...(badge.rule.fromHour === undefined
                        ? {}
                        : { fromHour: badge.rule.fromHour, toHour: badge.rule.toHour }),
                } as never,
                position,
                active: true,
                _status: 'draft',
            },
        });
        await payload.update({
            overrideAccess: true,
            collection: 'badges',
            id: created.id,
            locale: 'en',
            publishAllLocales: true,
            data: { name: badge.name.en, description: badge.description.en, _status: 'published' },
        });
        result.badges++;
    }

    const wheel = await payload.findGlobal({ overrideAccess: true, slug: 'wheel', depth: 0 });
    if (!wheel.prizes?.length) {
        const seedWheel = await json<SeedWheel>(directory, 'wheel.json');
        const profiles = seedWheel.profiles.map(profile => ({
            name: profile.name,
            weights: Object.entries(profile.weights).map(([prize, weight]) => ({ prize, weight })),
        }));
        if (!profiles.some(profile => profile.name === DEFAULT_PROFILE))
            throw new Error('wheel.json needs a default profile');
        // German first, published without an event (a global has no published row yet to take the
        // other language from), then English with every language: that one emits the event.
        await payload.updateGlobal({
            overrideAccess: true,
            slug: 'wheel',
            locale: 'de',
            context: { partialPublish: true },
            data: {
                prizes: seedWheel.prizes.map(({ label, ...terms }) => ({ ...terms, label: label.de })) as never,
                profiles,
                _status: 'published',
            },
        });
        const german = await payload.findGlobal({
            overrideAccess: true,
            slug: 'wheel',
            depth: 0,
            locale: 'de',
        });
        await payload.updateGlobal({
            overrideAccess: true,
            slug: 'wheel',
            locale: 'en',
            publishAllLocales: true,
            data: {
                // Array rows keep their ids; only the English labels are new.
                prizes: (german.prizes ?? []).map((row, index) => ({ ...row, label: seedWheel.prizes[index]!.label.en })),
                _status: 'published',
            },
        });
        result.wheel = true;
    }

    const planner = await payload.findGlobal({ overrideAccess: true, slug: 'deal-planner', depth: 0 });
    if (planner.concurrent == null || !planner.updatedAt) {
        // The defaults of catalog's former DealSettings.
        await payload.updateGlobal({
            overrideAccess: true,
            slug: 'deal-planner',
            data: {
                enabled: true,
                concurrent: 3,
                durationsMinutes: [30, 45, 60],
                percentages: [20, 25, 30, 40],
                minimumPrice: 5,
            },
        });
        result.dealPlanner = true;
    }
    return result;
}
