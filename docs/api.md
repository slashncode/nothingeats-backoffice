# Public content API: `/api/backoffice/v1`

What the backoffice serves to the shop itself (no events: nothing else needs it). Read-only, no sign-in,
`Cache-Control: public, max-age=60`. Language from `?lang=de|en`, else `Accept-Language`, else German;
responses carry `Content-Language`.

| Path | Answer |
|---|---|
| `GET /articles?category=&tag=&page=&limit=` | `{items, page, totalPages}`, newest first; only articles published in the language |
| `GET /articles/{slug}` | an article with `bodyHtml` (escaped, links checked; internal links become shop paths) and `readingMinutes`; 404 `ARTICLE_NOT_FOUND` |
| `GET /article-categories` | `{items: [{slug, name}]}` in the editors' order |
| `GET /tags` | `{items: [{slug, name}]}` |
| `GET /coach-suggestions` | `{items: [string]}`: the chips under the Craving Coach's greeting; empty means "use your own" |
| `GET /texts` | `{web: {key: message}, ui: {key: message}}`: the texts editors changed (ICU messages with the default's placeholders); everything else stays as bundled |

An article summary is `{slug, title, excerpt, cover, category: {slug, name} | null, tags: [{slug, name}], publishedAt}`;
`cover` is `null` or `{url, cardUrl, wideUrl, alt, focalX, focalY}` (paths under `/media`).

Text keys come from the deployed shop: the backoffice reads `<TEXTS__DEFAULTS_URL>/<namespace>.<language>.json`
(`web` = the app's i18next resources, `ui` = nothingeats-ui's strings) every ten minutes, adds new keys and
marks removed ones.
