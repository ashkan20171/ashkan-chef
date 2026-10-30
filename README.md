## Stage 56 — Recipe image loading reliability (2026-10-23)

- Centralized public HTTP(S) image URL validation in `mobile/src/utils/recipeImages.mjs`.
- Reused the same image URL validation in recipe cards and recipe detail hero.
- Added best-effort image prefetch when opening a recipe; network failures never block navigation.
- Added six automated JavaScript tests covering safe URLs and failed prefetches.
- Bumped app release metadata (1.2.1, build 44). No database migration.
- Image prefetch does not guarantee offline image availability. Full offline image caching and device-level testing remain future work.

## Ashkan Chef v48 — Localization and accessibility refinement

## What's new in Stage 48

- **Persian-first language selection:** Persian (`fa`, RTL) remains the default; users can switch to English (`en`, LTR) directly from the sign-in screen, without creating an account.
- **Persisted preference:** language selection is saved in AsyncStorage and reused in the app settings.
- **Online kitchen localization:** additional cloud recipe, bookmark, publishing and review controls now use the active language. Input alignment follows the chosen language.
- **Quality checks:** language and localization regression tests have been expanded to 68 passing JavaScript tests.

**Scope note:** Recipe titles, descriptions, user-generated content and server error messages are not automatically translated. Some older alerts and minor UI text remain in Persian; a full translation audit is still recommended before publication.

## Quick start

```bash
cd mobile
npm install
npm test
npx expo start -c
```

Backend: `cd backend/AshkanChef.Api && dotnet run`. Configure SQL Server and JWT secret first. Native builds and backend integration tests have not been executed in this environment.

---

# Ashkan Chef — Bilingual Cooking & Recipe Community

**A full-stack, Persian-first cooking companion with social recipes, analytics and a mobile-first experience.**

> Portfolio project / نمونه‌کار فول‌استک — React Native + Expo + ASP.NET Core 8 + SQL Server

![Status](https://img.shields.io/badge/status-portfolio%20project-orange) ![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB) ![.NET](https://img.shields.io/badge/.NET-8-512BD4) ![License](https://img.shields.io/badge/license-not%20specified-lightgrey)

## ✨ Highlights

- **Bilingual UI:** Persian (RTL) and English (LTR), with light and dark themes.
- **Recipe discovery:** search, categories, favorites and cooking instructions.
- **Kitchen tools:** shopping list, cooking timer and meal planning.
- **Community:** JWT sign-in, recipes CRUD, chef profiles, follows and reviews.
- **Creator analytics:** publication charts, follower activity and popular recipes.
- **Media:** authenticated upload, server-side image re-encoding and metadata removal.
- **Security-minded API:** rate limiting, structured errors, health endpoints and authenticated ownership checks.
- **Developer experience:** Node unit tests, PowerShell API smoke tests, GitHub Actions and Expo EAS build profiles.

## 🏗️ Architecture

```text
mobile/                        React Native + Expo client
  src/components/              Reusable UI and analytics
  src/screens/                 Authentication and community screens
  src/services/api.js          API client
  src/utils/network.mjs        Timeouts, typed errors, URL validation
backend/AshkanChef.Api/         ASP.NET Core 8 minimal API + EF Core
backend/smoke-tests/           Optional live-API smoke tests
.github/workflows/verify.yml   Automated Node tests and .NET build
```

## 🚀 Run locally

**Requirements:** Node.js, npm, Expo Go or Android emulator; .NET 8 SDK and SQL Server for cloud features.

```bash
cd mobile
npm install
npm test
npx expo start -c
```

```bash
cd backend/AshkanChef.Api
dotnet restore
dotnet build
dotnet run --urls http://localhost:5080
```

Configure `ASHKANCHEF_JWT_KEY` and a working SQL Server connection string in your environment. Set `EXPO_PUBLIC_API_URL` to your development machine's LAN address for physical devices (Android emulator default: `http://10.0.2.2:5080`). Never commit production secrets. HTTP is intended for local development only; use HTTPS for deployment.

### Android release (requires Expo account and signing credentials)

```bash
cd mobile
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

## 🆕 Stage 43

- Centralized, **timeout-aware** JSON and multipart HTTP requests (15-second default).
- Typed `ApiError`, bilingual error-message helper and validated API URL composition.
- Unit tests for network failure, 401, 429, 5xx and timeout behavior.
- Updated Android/iOS build numbers and polished recruiter-oriented project documentation.

## 🧪 Verification and limits

`npm test` validates pure JavaScript utilities. GitHub Actions is configured to build .NET, but passing live integration tests, device testing, security audit and store acceptance have **not** been established here. The backend needs a running SQL Server and environment configuration. The existing API remains a minimal-API monolith and is a candidate for future modularization. This repository does **not** claim production certification or a published app.

## 🗺️ Roadmap

- Automated ASP.NET Core integration tests with an isolated test database.
- Network retry UX, offline caching and queued drafts.
- Performance profiling and accessible UI review on Android and iOS.
- Privacy policy, signing verification, Play Store review and release monitoring.

## 🇮🇷 درباره پروژه

**Ashkan Chef** یک پروژه نمونه‌کار آموزش آشپزی و شبکه اجتماعی دستورهای غذایی است که رابط فارسی راست‌به‌چپ و انگلیسی چپ‌به‌راست، امکانات آشپزی روزمره، پروفایل آشپز، ثبت دستور، امتیازدهی و داشبورد آماری را ترکیب می‌کند. هدف پروژه نمایش مهارت‌های توسعه موبایل، API، امنیت و طراحی تجربه کاربری است.

## 🤝 Contributions

Issues and constructive feedback are welcome. Please avoid including private credentials or personal data in bug reports.


## Phase 44 — Offline public recipe browsing

The public recipe feed now keeps a **24-hour, bounded AsyncStorage cache** (at most 40 recipes per query/page). On network errors and timeouts only, the app displays previously fetched public recipes with a bilingual offline banner. Authenticated endpoints, private profiles, tokens and writes are **never cached**. Search/page cache keys are isolated, and storage failures do not break online browsing.

The offline cache is read-only: creating recipes, reviews, follows and uploads still require a connection. This is not a full offline synchronization engine.

Run `cd mobile && npm test` for offline cache unit tests. Backend integration tests, real device testing and production build remain outstanding.


## v45 — Offline saved recipes / ذخیره دستورهای آفلاین

- Bookmark up to 100 **public** recipes locally on the device, including ingredients and cooking steps.
- Saved recipes remain viewable without network access; no background synchronization or offline posting is claimed.
- Bookmark toggles and a Saved Recipes view are available in the cloud recipes screen.
- Saved snapshots can become stale; there is no guarantee that their images remain available offline.
- No JWT tokens, private profiles, or account data are written to the bookmarks cache.
- Six additional Node unit tests validate storage parsing, deduplication, limits and data minimization.
- Note: this is device-level storage, not account-bound encrypted storage. Do not use it for sensitive data.


## Stage 47 — Localization hardening
- Shared Persian-first / English translation catalog (`mobile/src/utils/i18n.mjs`).
- User-friendly localized network, authentication, rate-limit and server error messages.
- Localized confirmation dialogs for saved notes and shopping-list cleanup.
- Improved language-aware direction for recipe ingredients, shopping rows and password input.
- Added translation parity and API error localization tests.
- **Limitations:** full i18n coverage and native RTL layout testing on physical Android/iOS devices remain outstanding; user-generated recipe content is not machine translated.


## Stage 48 — bilingual polish

- Localized profile/session, local persistence, timer, and shopping-list alerts in Persian and English.
- Corrected English alignment for the home hero and eyebrow, and adjusted recipe back-button placement by language.
- Added 9 bilingual message tests. Persian remains the default language; saved preferences continue to apply.
- Not a claim of complete translation coverage; validate remaining screens on real Android/iOS devices.


## Stage 49 — Authentication UX and accessibility

- Bilingual Persian-first sign-in / sign-up with a clear contextual explanation.
- Registration-only password-strength feedback with accessible labels; validation remains enforced by the existing form and backend.
- Recipe cards support dynamic title fitting, wrapped metadata, and favorite selection accessibility state.
- Added pure-function tests for password-strength scoring and input edge cases.
- No SQL migration required.

**Verification:** JavaScript unit tests can be run with `cd mobile && npm test`. Android/iOS builds and live API/SQL Server integration require local validation.


## Phase 50 — UI refinement
- Recipe image loading feedback and accessible image labels; robust fallback on broken image URLs.
- Localized Persian/English statistics numbers and more resilient narrow-screen metric cards.
- Corrected Persian text direction in recipe instructions, body text, hints and meal-plan labels.
- Five source regression checks. No database migration.


## Stage 51 — Localized analytics polish

- Dashboard charts use Persian digits in FA and grouped English numerals in EN.
- Empty and all-zero time windows now show an explicit localized explanation.
- Pure analytics display helpers and five additional unit tests.
- Existing API, SQL Server schema, and RTL/LTR behavior remain unchanged.

Verification: `cd mobile && npm test`. Backend and device builds must be validated separately.


## v52 — Accessible chef dashboard cards
- Extracted reusable `ChefStatCard` with responsive equal-width KPI tiles and iconography.
- Locale-aware numeric formatting with defensive handling of invalid values.
- Added five focused unit tests for statistic display.
- Preserves Persian-first RTL and English LTR presentation.
- Device rendering and .NET/SQL Server integration remain unverified in this environment.


## Phase 53 — Bilingual Chef Profile Hero
- Introduced a reusable `ChefProfileHeader` component with a responsive profile hero, accessible photo controls, and theme-aware presentation.
- Refined KPI card minimum height, touch targets, and typography.
- Extracted pure locale-aware profile helpers with five unit tests.
- Persian remains the default (RTL), with English (LTR) supported.
- No database migration. Backend and device builds require local validation.


## v54 — Resilient recipe visuals and bilingual actions
- Reusable `RecipeHero` for detail images, loading state, and bilingual fallback when images are missing or broken.
- Recipe cards reset their image state when a recycled card receives another recipe.
- Local recipe creation, meal-plan shopping list, and reset confirmations now have bilingual feedback.
- Five source regression tests were added.
- No SQL migration required. Native device and backend integration tests are still pending.


## v55 — image loading UX
- Added a reusable animated `ImageSkeleton` for recipe cards and hero images.
- Skeleton stops on successful image load, failure, or unmount; no new dependencies.
- Added four source regression checks.
- Existing Persian-first/English language switch, RTL/LTR and dark theme remain unchanged.
- Android/iOS visual testing and backend integration tests are still pending.


## v57 — Resilient image retry and cache hints
- Added an accessible bilingual retry action on recipe detail images after network errors (at most two manual retries).
- The retry remounts the image to restart loading; failure states remain readable.
- Recipe card and hero images now request React Native in-memory/disk HTTP image caching via `cache: 'force-cache'` (platform-dependent, **not guaranteed offline persistence**).
- Added five focused retry-state tests. No new dependencies or SQL migrations.
- Device, Android/iOS builds, and backend integration have not been validated in this environment.


## Stage 58 — Opt-in-by-view offline recipe hero images
- Viewed recipe detail images (public HTTPS URLs only) are stored in app document storage using `expo-file-system/legacy` (Expo SDK 54).
- Cache limits: maximum 60 images and 8 MiB per downloaded image; oldest files are pruned. Partial downloads are deleted.
- Local cached image is preferred on subsequent detail views; remote image remains the fallback.
- `clearOfflineImages()` is available for a future storage-settings UI. This release does **not** add a settings button.
- Recipe feed thumbnails are **not** permanently cached by this module; this prevents mass background downloads.
- Cache filenames use a non-cryptographic deterministic hash and are not intended for secret/private URLs.
- Requires `npm install` to add `expo-file-system`. Backend/database schema unchanged.


## Stage 59 — Offline image storage settings
The bilingual Settings screen now includes an offline-image storage panel showing saved image count and bytes, refresh, and a destructive confirmation before clearing only downloaded images. Includes pure formatting tests. The app keeps Persian RTL by default and English LTR as an option. Device-level verification is still required.

## Stage 60 — Offline image management
- Inspect individual downloaded image files and their sizes.
- Delete one cached image at a time with confirmation and strict filename validation.
- View approximate cache capacity; count-based pruning from prior stages remains active.
- No database migration. Test on Android/iOS before release.


## Stage 61 — Offline image LRU & previews
- Persistent last-access metadata for cached public recipe images.
- Count- and byte-aware LRU cleanup, configurable maximum of 20, 40 or 60 images.
- Cached-image thumbnails and recently-used ordering in the offline storage panel.
- Metadata updates are serialized to avoid overlapping writes.
- Added five unit tests for eviction, budgets, input safety and settings.
- Device-level Expo filesystem behavior still requires Android/iOS verification.

## Stage 62 — Favorite image batch downloads

Settings now offers sequential download of favorite recipe images with per-image progress, successful/failed counts and stop-after-current-image behavior. Already cached images are reused; unsupported or duplicate URLs are skipped. A stopped batch can be restarted (previously cached files are reused). This is not a resumable byte-range download and does not cache recipe text.

Run `cd mobile && npm test`. Device and .NET integration tests are not covered by this suite.


## Stage 63 — Offline recipe instructions

The settings screen now includes a device-local offline recipe library. Users can snapshot favorite recipes (title, ingredients, cooking steps), reopen the saved instructions without network access, and remove individual snapshots. Snapshots are capped at 80 and never include authentication tokens or private notes. Images use the separate offline image download controls. Updates are manual snapshots; no background sync or conflict resolution is claimed.

## Stage 64 — Offline readiness and updates
The offline library now reports favorite recipes that are ready, missing, or outdated by comparing stored ingredients and steps with current versions. Saving favorites again refreshes outdated snapshots. The UI remains bilingual (Persian RTL / English LTR). This does not imply offline images are downloaded.


## Stage 65 — Favorite recipe offline status
- Favorite recipe cards show ready / outdated / not saved status, localized for Persian and English.
- Save or refresh a single recipe directly from its favorite card.
- Uses the existing offline library storage key and latest persisted snapshots to avoid stale writes.
- Only recipe text is saved; image downloads remain a separate feature.


## Stage 66 — Offline image-first detail view
- The recipe hero waits for the local image lookup before starting a remote request.
- Saved `file://` images are preferred when the device is offline.
- Images are persisted only after a successful remote image load (not after an error).
- Added six pure unit tests for image source selection and persistence policy.
- The image is still unavailable offline if it was never downloaded; no claim of fully offline networking is made.


## Stage 67 — Connection awareness
- Network status is monitored via `expo-network`; offline banner is bilingual and follows the active theme.
- Unknown reachability is not incorrectly reported as offline.
- Remote image prefetch is skipped when offline; saved recipes and cached images remain usable.
- Six unit tests cover connection classification and translations.
- Install dependencies with `npm install` before launching Expo.
- Note: Native device connectivity and backend builds are not verified by these Node tests.


## Stage 68 — Offline-aware cloud recipe browsing
Cloud recipe listing now avoids network calls when connectivity is explicitly offline, reads the existing cached pages, displays a localized offline message, and refreshes page one when connectivity transitions from offline to online. Cache misses surface an error; authenticated mutations are not queued. JavaScript policy tests included.


## Stage 69 — Resilient cloud recipe requests
- Ignore stale overlapping cloud-list responses to prevent older searches from overwriting new results.
- De-duplicate items across pagination boundaries and replace results when switching to My Recipes.
- Localized retry UI for failed cloud requests; pagination disabled while an error is visible.
- Six Node tests cover request identity, pagination, and fallback messages.
- Backend schema unchanged. Native device and .NET builds have not been verified.

## Stage 70 — Request cancellation and timeout hardening
- Cloud recipe searches cancel obsolete HTTP requests with AbortController.
- Request cancellation is distinguished from server timeouts and does not display an error banner.
- Cleanup cancels in-flight requests when leaving the screen.
- Added Node tests for cancellation, timeout and localized messages.
- This release does not introduce SQL migrations.


## Stage 71 — Search UX and recipe list performance

- Added a 400 ms debounced search for online recipes to reduce redundant API calls while typing.
- Added localized skeleton placeholders and distinct empty states for saved recipes, offline mode, and empty search results.
- Tuned FlatList batch size/window settings and keyboard tap behavior for mobile screens.
- Added pure policy helpers and regression tests for search normalization, list state, and list tuning.
- Updated app release metadata to 1.2.2 (Android versionCode 45 / iOS buildNumber 45).

Validation: JavaScript unit tests are run with `npm test`. Device rendering and Android/iOS production builds still require local device/build validation.

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

- Added a small promise-based async queue so offline recipe library writes run in a deterministic order and a failed write does not block subsequent work.
- Save and remove actions now read the latest persisted library inside the queued operation before applying changes, reducing stale-state overwrite and lost-update risks.
- Added focused unit tests for ordering, pending counts, recovery after rejected work, and invalid queue tasks.
- Mobile package version: 77.0.0; app version: 1.2.8 (Android versionCode 51 / iOS buildNumber 51).
- Validation covers Node unit tests and source syntax checks; no native device run or production build is claimed.

## Stage 78 — Offline recipe persistence boundary

- Extracted offline recipe persistence into a testable store adapter that owns serialized read-modify-write operations.
- Added restart-style tests using a fresh store instance over retained storage, concurrent save/remove operations, storage write failures, and adapter validation.
- The UI now delegates recipe save/remove/load to the shared store adapter rather than duplicating persistence logic.
- Mobile package version: 78.0.0; app version: 1.2.9 (Android versionCode 52 / iOS buildNumber 52).
- Automated Node tests pass; native device restart and production builds still require device/toolchain validation.


## Stage 79 — Offline connection clarity
- Added a localized connectivity status banner for offline image/recipe storage.
- Centralized online/offline/unknown classification and Persian/English status messages in `mobile/src/utils/offlineConnection.mjs`.
- Added automated coverage for partial network signals and safe unknown-state messaging.
- App version: 1.3.0; Android versionCode/iOS buildNumber: 53.

## Stage 81 — Recipe sync coordinator

The mobile app now has a recipe-level synchronization coordinator on top of the durable Stage 80 outbox. Local upsert/delete operations can be queued, inspected, and flushed through an injected authenticated transport; retry-safe idempotency metadata is passed to the transport. This is a client-side integration boundary, not a claim that server synchronization is live: the existing ASP.NET Core API still needs an idempotent sync endpoint, server-side operation receipts, and an explicit version/conflict policy before a production transport is connected.

Validation: mobile Node test suite includes the Stage 81 coordinator tests. Native builds and .NET backend builds require their respective toolchains and were not performed in this environment.


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
"# ashkan-chef" 
