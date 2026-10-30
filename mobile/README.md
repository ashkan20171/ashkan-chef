# Ashkan Chef — React Native (v4)

Persian RTL cooking companion built with Expo SDK 54.

## Features
- Browse and search recipes, categories, favorites
- Shopping list, cooking timer, meal planner, personal notes and ratings
- **New in v4:** create your own recipes with ingredients and cooking steps
- Local persistence using AsyncStorage; migrates v3/v2 data on first launch

## Run
```bash
npm install
npx expo start -c
```

## Limitations
This is an offline-first demo. No server, account authentication, video upload, or admin panel is implemented. Recipe photos are remote and need an internet connection. Not validated on physical Android/iOS devices.

## Next architecture step
Introduce Expo Router navigation, typed domain models, REST API service, and secure JWT authentication backed by ASP.NET Core and SQL Server.


### Stage 71 updates
Search is debounced by 400 ms. Loading skeletons and localized empty states distinguish offline, saved-library, and search-empty cases. FlatList rendering uses bounded batch/window settings. Run `npm test` to execute the JavaScript regression suite.

## Stage 72 — guarded pagination and duplicate-safe merging
- Added a reusable policy to determine whether another recipe page can be requested.
- Added a synchronous in-flight guard around the “Load more” action to prevent rapid repeated taps from issuing overlapping pagination requests.
- Made page merging remove duplicate IDs both against existing items and within the incoming page.
- Added regression tests for duplicate-page payloads and pagination eligibility.
- Mobile package version: 72.0.0; app version: 1.2.3.


## Stage 73 — offline-first recipe card images
- Recipe cards check the bounded local image cache before starting a remote image request, avoiding unnecessary network downloads when an image is already stored.
- Successfully loaded remote recipe images are persisted in the existing managed cache; a broken local cached image falls back to the remote URL before showing the final placeholder.
- Added regression checks for recipe-card cache lookup, persistence and local-to-remote fallback wiring.
- Mobile package version: 73.0.0; app version: 1.2.4 (Android versionCode 47 / iOS buildNumber 47).
- Device rendering and native production builds still require local validation.


## Stage 74 — bounded image retry UX
- Added a localized, accessible retry action when a recipe-card image fails to load.
- Retry attempts are bounded by the shared image retry policy, preventing infinite retry loops.
- Retrying re-checks the local image cache before falling back to the network.
- Mobile package version: 74.0.0; app version: 1.2.5 (Android versionCode 48 / iOS buildNumber 48).
- Device rendering and native production builds still require local validation.


## Stage 75 — Offline-aware image downloads

- Bulk downloads of favorite recipe images are disabled when the device reports no internet connection.
- If connectivity drops during a batch, the next image is not started; successfully cached images remain available.
- Connectivity reported as unknown does not block an intentional user action.
- Added unit tests for offline batch eligibility and stop conditions.


## Stage 76 — Offline library integrity and recovery

- Added an offline-library inspection result that distinguishes empty storage, malformed JSON, invalid top-level data and successfully recovered snapshots.
- Valid snapshots are normalized; malformed entries are skipped, duplicate recipe IDs are reconciled using the latest encountered snapshot, and the library remains bounded to its configured maximum.
- The offline storage panel now shows a localized recovery notice instead of silently treating corrupted saved data as an ordinary empty library. A successful save/removal clears the notice.
- Added regression tests for corrupted data, invalid shapes, duplicate reconciliation and partial recovery.
- Mobile package version: 76.0.0; app version: 1.2.7 (Android versionCode 50 / iOS buildNumber 50).
- Native device testing and production builds still require local validation.

## Stage 77 — Serialized offline-library mutations

- Offline recipe save/remove operations use a serialized async queue and reload the latest AsyncStorage snapshot before mutating it.
- Unit tests cover queue ordering, failure recovery, pending counts, and invalid tasks.
- Mobile package version: 77.0.0; app version: 1.2.8 (Android versionCode 51 / iOS buildNumber 51).

## Stage 78 — Offline recipe persistence boundary
- `src/utils/offlineRecipeStore.mjs` centralizes loading and serialized save/remove operations.
- `offlineRecipeStore.test.mjs` covers persisted reload using a fresh store instance, concurrent operations, failed writes, and adapter validation.
- Tests run with `npm test`; this does not replace testing on an Android/iOS device.


## Stage 79
The offline storage panel now explains the current connection state in Persian and English. Network signals are classified centrally, and unknown connectivity is handled conservatively instead of being assumed online. Run `npm test` to execute the offline-connection tests.

## Stage 80: synchronization outbox foundation

`src/utils/offlineSyncOutbox.mjs` provides a durable queue boundary for recipe upserts and deletes. It supports per-recipe operation coalescing, transport idempotency keys, acknowledgement removal, bounded exponential retry scheduling, and partial recovery of malformed queue records. The transport is injected by the caller; no live API synchronization is enabled until the backend endpoint and conflict/version contract are defined.

Run `npm test` to execute the mobile utility suite (227 tests).

## Stage 81 — Recipe sync coordinator

- Added `src/utils/recipeSyncService.mjs`, a service layer that combines validated recipe upsert/delete requests with the persistent offline outbox.
- The coordinator exposes `queueUpsert`, `queueDelete`, `flush`, and a compact `status` report. It routes queued operations to explicitly injected `transport.upsert` / `transport.delete` methods and forwards deterministic idempotency metadata.
- Transport injection is intentional. The current ASP.NET API does not yet expose an idempotent recipe-sync contract or conflict/version semantics, so this stage does **not** claim live server synchronization. Do not wire a non-idempotent POST endpoint as a retry-safe transport.
- Added service tests for validation, queue coalescing, status, operation routing, idempotency metadata, and retained failures.


## Stage 82 — Authenticated recipe sync API foundation

- Added authenticated ASP.NET Core endpoints `POST /api/sync/recipes/upsert` and `POST /api/sync/recipes/delete`. Both require an `Idempotency-Key` header and scope client recipe IDs and operation receipts to the authenticated user.
- Added per-recipe `ClientId` and `SyncVersion` fields, owner-scoped uniqueness, and durable operation receipts. Upsert/delete writes and their receipts are saved in a database transaction. Version mismatches return HTTP 409 with server version information instead of silently overwriting newer server data.
- Added `backend/upgrade_v82_recipe_sync.sql` for existing SQL Server databases. Apply this script before deploying the new API.
- Added a mobile `recipeSyncTransport` adapter and wired it to the existing authenticated API request helper, including the idempotency header. The adapter remains opt-in; no UI/background scheduler automatically drains the queue yet.
- Conflict responses are intentionally not auto-merged. A client workflow still needs to persist returned server versions and offer an explicit conflict-resolution choice before unattended production sync is enabled.
- Mobile package version: 82.0.0; app version: 1.3.3 (Android versionCode 56 / iOS buildNumber 56).

Validation: Node utility tests and JavaScript syntax/JSON checks are run for this stage. The .NET SDK and a SQL Server instance are not available in this environment, so backend compilation, migration execution, authenticated HTTP integration, and concurrency testing remain required locally.


## Stage 82 — Authenticated recipe sync API foundation

- Added authenticated ASP.NET Core endpoints `POST /api/sync/recipes/upsert` and `POST /api/sync/recipes/delete`. Both require an `Idempotency-Key` header and scope client recipe IDs and operation receipts to the authenticated user.
- Added per-recipe `ClientId` and `SyncVersion` fields, owner-scoped uniqueness, and durable operation receipts. Upsert/delete writes and their receipts are saved in serializable database transactions. Version mismatches return HTTP 409 with server version information instead of silently overwriting newer server data.
- Added `backend/upgrade_v82_recipe_sync.sql` for existing SQL Server databases. Apply this script before deploying the new API.
- Added a mobile `recipeSyncTransport` adapter and wired it to the existing authenticated API request helper, including the idempotency header. The adapter remains opt-in; no UI/background scheduler automatically drains the queue yet.
- Conflict responses are intentionally not auto-merged. A client workflow still needs to persist returned server versions and offer an explicit conflict-resolution choice before unattended production sync is enabled.
- Mobile package version: 82.0.0; app version: 1.3.3 (Android versionCode 56 / iOS buildNumber 56).

Validation: 237 Node utility tests pass, and the changed JavaScript modules plus app/package JSON pass syntax/format checks. The .NET SDK and a SQL Server instance are not available in this environment, so backend compilation, migration execution, authenticated HTTP integration, and concurrency testing remain required locally.


## Stage 83 — Automatic sync lifecycle and recipe photo coverage

- Connected the durable mobile recipe outbox to the authenticated sync transport in the app lifecycle. Queued operations are flushed when an authenticated session is online, and newly created local recipes are queued immediately.
- Added a bilingual pending-sync indicator; offline operations remain persisted and are retried on the next online session.
- Ensured recipe images are resolved for every category: a valid recipe-specific URL is preferred, otherwise a category-specific photo is selected, with a general fallback for unknown categories. Recipe cards, detail hero, prefetch, and sync payload use the resolved image.
- Added tests for image fallback/coverage and image URL transport.
- Mobile package version: 83.0.0; Expo version 1.3.4; Android versionCode 57; iOS buildNumber 57.

Validation: `npm test` — 242 tests passed. The app was not run on a physical device/emulator, and the backend/SQL Server were not built or exercised in this environment.
