# nothingeats-backoffice

The backoffice of [NothingEats](https://github.com/slashncode/nothingeats) ("Order everything. Eat nothing."): a [Payload](https://payloadcms.com) 4 headless CMS on TanStack Start, Postgres and Garage.

It is not an admin UI glued onto the services' databases. It is a bounded context of its own, upstream of catalog and loyalty: it owns the shop's content and publishes it through a transactional outbox, and the services consume it and stay the only producers of their own events.

| Content | Owned here | Reaches the shop |
|---|---|---|
| Restaurants, dishes, flash deals, deal planner settings, badges, wheel prizes and odds | yes | outbox → Kafka → catalog / loyalty |
| Articles, categories, tags, coach suggestions, text overrides | yes | this service's public API |
| Accounts | no (identity) | edited through identity's admin API |

## Sign-in

There are no passwords in the backoffice. Admins sign in with their NothingEats account at identity; the backoffice checks the access token against identity's JWKS (like every service), keeps it as an httpOnly cookie scoped to `/admin` and `/api/backoffice`, and renews it before it expires. A revoked `admin` role ends access with the token's 15 minutes.

## Images

Uploads go to Garage (S3 API) with variants made by sharp; the shop's gateway serves the bucket publicly under `/media`.

## Events

Contract: [`docs/events.md`](docs/events.md). The outbox is a table next to Payload's (added through the
Postgres adapter's schema hook), the relay publishes with `FOR UPDATE SKIP LOCKED` like the Kotlin services.

## Local development

```sh
kubectl --context k3d-nothingeats -n nothingeats port-forward svc/garage 13900:3900
scripts/dev-env.sh pnpm dev        # http://localhost:3100/admin
```

First start on an empty database: `scripts/dev-env.sh pnpm payload migrate`, then `scripts/dev-env.sh pnpm payload seed`
(restaurants and dishes with catalog's ids, badges, the wheel, the deal planner).

`scripts/dev-env.sh` reads the database and Garage credentials from the gitops repo's SOPS files into the environment; nothing lands on disk. The dev server proxies `/api/identity` and `/media` to the local cluster, so the admin runs on one origin like in the cluster.

## License

MIT
