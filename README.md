# Trumple

Trumple is a daily timeline game. Players drag seven Trump-related events into chronological order, lock in their answer, and try to solve the puzzle in as few attempts and as little time as possible.

- Live game: https://www.trumple.app/
- Production repository: https://github.com/pauloton/trumple
- Hosting: Vercel, deployed from `main`

## Current schedule

The reliable daily edition is served every day.

The recovered Sunday and Wednesday special editions are intentionally paused:

- Sunday's manual weekly list had not been refreshed since April 2026 and was replaying stale stories.
- Wednesday's second-term draft pool was not consistently ordered by event date, which could produce an incorrect answer key.

Both now fall back to the normal daily puzzle. Their draft data and visual themes remain in the code for a future sourced editorial rebuild.

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

`npm run check` runs the API contract tests and creates a production build. The test suite checks daily determinism, invalid dates, CORS, edition fallbacks, and every puzzle date in 2026.

## Project map

- `app/page.js` contains the game screens, drag-and-drop interaction, timer, local statistics, results, and sharing.
- `app/api/trump-puzzle/route.js` contains the editorial pools, deterministic puzzle selection, answer key, edition metadata, date validation, and CORS response.
- `tests/puzzle-api.test.mjs` protects the puzzle API contract.
- `public/` contains the edition backgrounds and game artwork.

Player statistics remain in the browser under the `trumple_*` local-storage keys. There is no account or server-side player database.

## Editorial rules

Before publishing an event:

1. Verify the event and exact date with a trustworthy source.
2. Keep the title at 50 characters or fewer.
3. Do not use em dashes.
4. Keep Trump as the focus of the event.
5. Use a concise, sardonic hint without inventing details.
6. Ensure the answer order is unambiguous; avoid multiple events on the same date unless their order is independently verifiable.

To restore a special edition, provide a fully verified chronological pool and replace its `events: null` value in `SPECIAL_EDITIONS`.

## Release

Changes pushed to `main` are deployed by Vercel. Always run `npm run check` and `npm audit` first, then verify these endpoints after deployment:

- `/api/trump-puzzle?date=2026-08-17` (daily)
- `/api/trump-puzzle?date=2026-08-16` (Sunday fallback)
- `/api/trump-puzzle?date=2026-08-19` (Wednesday fallback)

All successful API responses should include complete `editionMeta` data and the `Access-Control-Allow-Origin: *` header needed by the native client.
