# Trumple

Trumple is a daily timeline game. Players drag seven Trump-related events into chronological order, lock in their answer, and try to solve the puzzle in as few attempts and as little time as possible.

- Live game: https://www.trumple.app/
- Production repository: https://github.com/pauloton/trumple
- Hosting: Vercel, deployed from `main`

## Edition schedule

- **Daily:** seven exactly dated events from Trump's second term (January 20, 2025 to today). The draw favors recent additions while retaining variety.
- **Sunday, This Week:** one event from each of the previous seven completed days. If a week is incomplete, Sunday safely falls back to the second-term daily game instead of inventing or replaying news.
- **First Saturday, Legacy Edition:** seven events spanning 2016 to today.

The second-term library contains 100 hand-reviewed events. New cards are researched through reputable journalism and must pass the Trumple test: normal policy is not enough.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Verify a change

```bash
npm run check
npm audit
```

`npm run check` runs the API and library tests and creates a production build. The suite checks determinism, schedule boundaries, invalid dates, CORS, editorial validation, refresh-source mapping, and every puzzle date in 2026.

## Project map

- `app/page.js` contains the game screens, drag-and-drop interaction, timer, local statistics, results, and sharing.
- `app/api/trump-puzzle/route.js` contains deterministic puzzle selection, the Legacy pool, answer keys, edition metadata, date validation, and CORS response.
- `data/seed-events.js` is the reviewed starting library.
- `data/curated-news-events.js` contains the expanded sourced journalism library.
- `data/generated-events.js` contains the small number of weekly additions that clear the strict automatic filter.
- `data/presidential-events.js` is a source archive for discovery only. Raw government paperwork never enters the game.
- `lib/event-library.js` validates and combines both libraries and selects Sunday events.
- `scripts/refresh-event-library.mjs` collects and curates weekly candidates.
- `.github/workflows/refresh-event-library.yml` runs the refresh each weekend and publishes additions that pass every automatic check.
- `tests/` protects the game, schedule, library, and refresh contracts.
- `public/` contains the edition backgrounds and game artwork.

Player statistics remain in the browser under the `trumple_*` local-storage keys. There is no account or server-side player database.

## Automated weekly library

At 02:00 UTC every Sunday (Saturday evening in US time zones), GitHub Actions:

1. Collects up to 250 recent English-language Trump articles through GDELT, with Google News RSS as a rate-limit and outage fallback.
2. Keeps reporting from an allowlist of established news and primary-government domains.
3. Looks for specific spectacle, retaliation, absurdity, norm-breaking, dangerous chaos, or an obvious own goal. A direct presidential action alone does not qualify.
4. Selects at most one high-confidence Trumple per calendar day.
5. Rejects normal policy, analysis, opinion, indirect stories, vague or oversized headlines, invalid dates, malformed events, untrusted sources, and likely duplicates.
6. Runs the complete game test and production-build check.
7. Commits approved additions directly to `main`, which refreshes the playable library and deploys through Vercel.

The workflow needs no purchased API key and no weekly human approval. Stories that fail any automatic check are discarded. If fewer than seven calendar dates qualify in a week, Sunday uses the regular second-term game; daily games continue normally.

To rehearse the refresh without network access or changing the library:

```bash
npm run library:refresh -- --today 2026-08-16 --fixture tests/fixtures/refresh.json --dry-run
```

## Editorial rules

Before publishing an event:

1. Verify the event and exact date with a trustworthy source.
2. Keep the title at 50 characters or fewer.
3. Do not use em dashes.
4. Keep Trump as the focus of the event.
5. Use a concise, sardonic hint without inventing details.
6. Keep Sunday fair by publishing no more than one automatic event per calendar day.
7. Reject a card if a reasonable reader could say, "That is just ordinary policy."
8. Periodically audit automatic additions and tighten the filters if a weak pattern appears.

## Release

Changes pushed to `main` are deployed by Vercel. Always run `npm run check` and `npm audit` first, then verify these endpoints after deployment:

- `/api/trump-puzzle?date=2026-08-17` (second-term daily)
- `/api/trump-puzzle?date=2026-08-16` (safe Sunday fallback when the prior week is incomplete)
- `/api/trump-puzzle?date=2026-08-01` (Legacy Edition)

All successful API responses should include complete `editionMeta` data and the `Access-Control-Allow-Origin: *` header needed by the native client.
