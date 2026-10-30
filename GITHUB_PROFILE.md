# GitHub repository setup

**Repository name:** `ashkan-chef-fullstack-recipe-platform`

**About (copy into GitHub Description):**
Bilingual cooking & recipe community built with React Native, Expo, ASP.NET Core 8 and SQL Server — Persian RTL / English LTR, JWT auth, creator analytics, secure media uploads and CI.

**Topics (copy into GitHub Topics):**
`react-native` `expo` `typescript-ready` `javascript` `aspnetcore` `dotnet` `csharp` `sql-server` `entity-framework-core` `rest-api` `jwt-authentication` `fullstack` `mobile-app` `recipe-app` `cooking-app` `bilingual` `rtl` `persian` `ui-ux` `github-actions`

**Short Persian About (for LinkedIn):**
Ashkan Chef | اپلیکیشن دوزبانه آشپزی و جامعه دستورهای غذایی با React Native، ASP.NET Core و SQL Server؛ شامل داشبورد تحلیلی، احراز هویت، مدیریت دستورها و طراحی RTL/LTR.

**Recruiter pitch (EN):**
An end-to-end portfolio project demonstrating mobile UX, authenticated APIs, relational data modeling, image processing, analytics, and release-oriented engineering. Automated utility tests are included; production readiness is not claimed.

**Suggested GitHub pinned-repo subtitle:**
Full-stack mobile engineering • React Native / .NET 8 • bilingual UX • API security

## v46 highlight
Persian-first RTL/English LTR language switching from authentication and app settings, with persisted preferences and additional localized online-recipe controls.

Stage 49: improved bilingual authentication UX, password feedback and accessible recipe cards.

Phase 50: polished recipe media loading, accessible favorites, locale-aware profile statistics and RTL text direction.

Phase 53: redesigned bilingual chef profile hero and accessible statistics cards.

Stage 56: resilient recipe image URLs and best-effort prefetching.


## Stage 68 — Offline-aware cloud recipe browsing
Cloud recipe listing now avoids network calls when connectivity is explicitly offline, reads the existing cached pages, displays a localized offline message, and refreshes page one when connectivity transitions from offline to online. Cache misses surface an error; authenticated mutations are not queued. JavaScript policy tests included.


### Stage 71
Search now uses a 400 ms debounce, recipe lists show localized skeleton/empty states, and FlatList rendering is tuned for mobile performance.

## Stage 72 — guarded pagination and duplicate-safe merging
- Added a reusable policy to determine whether another recipe page can be requested.
- Added a synchronous in-flight guard around the “Load more” action to prevent rapid repeated taps from issuing overlapping pagination requests.
- Made page merging remove duplicate IDs both against existing items and within the incoming page.
- Added regression tests for duplicate-page payloads and pagination eligibility.
- Mobile package version: 72.0.0; app version: 1.2.3.


### Stage 73
Recipe cards now prefer cached local images, persist successful remote loads to the existing bounded cache, and fall back to the network if a local cached image fails.


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

- Queued offline recipe writes and reads the latest persisted snapshot before each mutation to reduce stale-state overwrites.
- Tested deterministic queue ordering and continued operation after a failed task.
- Mobile package 77.0.0; app 1.2.8 (Android 51 / iOS 51).

## Stage 78 — Offline recipe persistence boundary
- Extracted offline recipe storage into a reusable store adapter with serialized mutations.
- Added tests for reload after simulated restart, concurrent changes, and storage failures.
- Mobile package 78.0.0; app 1.2.9 (Android 52 / iOS 52).


### Ashkan Chef — Stage 79
Offline-first UX improvements: localized online/offline/unknown connection status, centralized connectivity classification, and automated tests for partial/unknown network states. App version 1.3.0 (build 53).

### Stage 81 — Offline recipe sync coordinator

Added a typed-by-contract JavaScript coordinator for queuing recipe upserts/deletes, inspecting pending sync state, and dispatching through injected transport methods with deterministic idempotency keys. The API transport remains intentionally unconnected until the backend implements durable idempotency receipts and recipe conflict/version handling.


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
