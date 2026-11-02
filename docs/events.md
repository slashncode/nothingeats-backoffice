# Events: `backoffice.*`

The backoffice is the upstream context for the shop's content (journal record 040). Every published change
goes into its outbox in the transaction that saves it; a relay publishes it to Kafka.

CloudEvents in structured mode (`application/cloudevents+json`), `source` = `/nothingeats/backoffice`,
record key and `subject` = the document id (globals: their slug). Topics are compacted and every event is a
full snapshot in all languages, so a consumer can rebuild from the start of the topic. Consumers must
ignore unknown fields.

Only published content is sent. Payload publishes per language; an event needs every language
(`{de, en}`), so publishing while a language is missing fails in the backoffice instead of reaching the
shop half empty. Nothing is ever deleted: restaurants and dishes are `archived`, deals `cancelled`,
badges set `active: false`.

Images are `null` or `{url, cardUrl, wideUrl, width, height, focalX, focalY, alt: {de, en}}`; URLs are
paths on the shop's origin (`/media/...`, Garage behind the gateway). Money is in cents, times are
ISO-8601 instants unless noted.

## `backoffice.restaurant.v1` → catalog

| `type` | `data` |
|---|---|
| `nothingeats.backoffice.restaurant.published.v1` | `restaurantId`, `slug`, `name`, `description`, `cuisine`, `rating`, `deliveryMinutes`, `deliveryFeeCents`, `minimumOrderCents`, `latitude`, `longitude`, `opensAt`, `closesAt` (`HH:mm`, Berlin time; past midnight allowed), `image`, `archived` |

## `backoffice.dish.v1` → catalog

| `type` | `data` |
|---|---|
| `nothingeats.backoffice.dish.published.v1` | `dishId`, `restaurantId`, `slug` (unique per restaurant), `section`, `name`, `description`, `priceCents`, `dietary`, `allergens` (lowercase, sorted), `spiceLevel` (0–3), `calories`, `moods` (sorted), `position`, `available`, `image` (`null`: the shop draws its illustration), `archived` |

A dish event can arrive before its restaurant's event; consumers wait for (or retry until) the restaurant.

## `backoffice.deal.v1` → catalog

| `type` | `data` |
|---|---|
| `nothingeats.backoffice.deal.published.v1` | `dealId`, `dishId`, `percentOff` (5–90), `startsAt`, `endsAt` (midnight to midnight in Hamburg: editors pick whole days), `cancelled` |

Scheduled by an editor. Catalog prices it from the dish's price at the time and plans its own deals around it.

## `backoffice.deal-planner.v1` → catalog (key `deal-planner`)

| `type` | `data` |
|---|---|
| `nothingeats.backoffice.deal-planner.published.v1` | `enabled`, `concurrent`, `percentages` (list), `minimumPriceCents` (planner deals run until midnight in Hamburg) |

## `backoffice.badge.v1` → loyalty

| `type` | `data` |
|---|---|
| `nothingeats.backoffice.badge.published.v1` | `badgeId`, `key` (never changes), `tier` (`BRONZE`, `SILVER`, `GOLD`), `name`, `description`, `rule`, `position`, `active` |

`rule` is one of `{type, min}` (`orders`, `restaurants`, `streak`, `level`, `orderItems`, `caloriesAvoided`,
`stampCards`, `dealOrders`, `couponOrders`), `{type, minCents}` (`orderTotal`, `moneyNotSpent`),
`{type: "placedBetween", fromHour, toHour}` or `{type: "wheelPrize"}`.

## `backoffice.wheel.v1` → loyalty (key `wheel`)

| `type` | `data` |
|---|---|
| `nothingeats.backoffice.wheel.published.v1` | `prizes` (in the order of the wheel's segments), `profiles` |

A prize is `{key, kind, label}` plus its terms: `PERCENT` and `AMOUNT` (`value`: percent or cents,
`maxDiscountCents`, `minimumOrderCents`), `FREE_DELIVERY` (`minimumOrderCents`), `FREE_DISH`
(`maxDiscountCents`), `BONUS_XP` (`xp`), `BADGE` (`badgeKey`; who has it already gets bonus XP).
A profile is `{name, weights: {<prize key>: weight}}`; `default` applies to everyone, other profiles are
named after the variants of the PostHog flag `spin-wheel-odds`.
