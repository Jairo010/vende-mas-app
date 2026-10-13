# 0003. Mobile offline-first data layer: expo-sqlite + Drizzle + outbox

- **Status**: Accepted — supersedes the data access of ADR 0002 (tasks over REST) and the
  "no offline database" rule of `utils-docs/SKILL_VENDE_MAS_MOBILE_DEVELOPMENT.md`.
- **Date**: 2026-10-12
- **Related**: API ADR 0016 (Visit as the unit of work), API ADR 0018 and
  `vende-mas-api/docs/sync-protocol.md` (the contract this ADR implements on the device).

---

## Context

Sellers work in shops, workshops and roads with poor or no coverage. The whole visit must
work offline: check-in with GPS, store photo, order, check-out and scheduling the next visit.
Before this decision the app read everything over REST, invented fake customers/products when
the API failed (`cust_…` ids) and had no queue, so offline work was silently lost.

The API (phase 3) already offers what an offline client needs: client-generated UUIDs,
idempotent `POST /sync/push` with per-operation verdicts, and a keyset `GET /sync/pull`.

## Decision

### 1. The device database is the source the UI reads

- **expo-sqlite** (Expo-maintained, no extra native setup) with **Drizzle ORM** for a typed
  schema and versioned migrations (`drizzle-kit generate` → `src/infrastructure/database/migrations`,
  applied at startup by `DatabaseProvider` with `useMigrations`).
- Tables: `customers`, `visits`, `orders`, `order_items`, `products`, `categories`,
  `promotions`, `outbox`, `pending_photos`, `sync_meta`. Instants are stored as ISO UTC text.
- Screens → hooks (React Query) → ports in `src/core/ports` → `Sqlite*Repository` adapters.
  React Query stays as the hook API, but its queries read SQLite (`networkMode: 'always'`),
  so the agenda opens instantly and offline.
- `*ApiService` classes are used **only** by the sync engine (`SyncApiService`).

### 2. Every write = local change + outbox entry, in one transaction

- Repositories validate business rules locally with the same state machine as the API
  (`VisitEntity`: SCHEDULED → IN_PROGRESS → COMPLETED / CANCELLED, outcomes per type, store
  photo required on the first opportunity visit, orders only for ACTIVE customers).
- The app generates the UUID of what it creates (`expo-crypto`), so later operations can
  reference it before it reaches the server.
- The outbox row carries the exact REST payload, a stable `idempotencyKey`
  (`visit-start-<id>`; repeatable actions get a unique suffix) and the device time with the
  local offset (`2026-10-14T09:30:00-05:00`).
- Entities keep a `sync_status` (`SYNCED | PENDING | REJECTED`) recomputed from the outbox.
- Mutations use `useOfflineMutation`: local write → invalidate queries → debounced sync.

### 3. Photos

Camera files are copied to the document directory (`photoFileStorageAdapter`) and registered
in `pending_photos`. The outbox entry stores `photoId` + `photoField`; the engine uploads the
photo first (`POST /files/photos` with the client `photoId`, idempotent) and injects the
returned URL into the payload. Operations behind a photo that cannot be uploaded wait (order
is preserved); after 5 failed attempts they are sent without it and the server decides.

### 4. Sync engine (`src/application/sync/sync-engine.ts`)

Single-flight run: **photos → push (batches of 100, in order) → pull (until `hasMore=false`)**.

| Push verdict | Engine action |
|---|---|
| APPLIED / DUPLICATE | delete from outbox, refresh entity status (order price adjustments are stored) |
| REJECTED | keep with the reason (`status=REJECTED`), shown in Más → Sincronización, can be discarded |
| RETRY | count the attempt, stop pushing; a later run resends with the same key |
| SKIPPED | keep, stop pushing |

- Network error / 401 / 5xx stop the run (`OFFLINE`, `UNAUTHORIZED`, `SERVER_ERROR`).
- Pull upserts by id and **never overwrites rows with pending outbox entries** (the seller's
  check-in/out wins until pushed; the server then returns the merged row). Customer tombstones
  delete locally, inactive products are hidden, promotions are replaced, an invalid cursor
  restarts the download.
- Triggers (`useSyncRunner`, mounted in the signed-in layout): start, reconnection (NetInfo),
  return to foreground, every 5 minutes, 1.5 s after a local change, and pull-to-refresh.
- Logout wipes the device database (another seller may sign in); the UI warns when there are
  changes not yet sent.

### 5. Time zone

All calendar math uses the business zone `America/Guayaquil` (`src/shared/utils/date`).
"Today" is never derived from UTC (after 19:00 in Ecuador UTC is already tomorrow).

## Consequences

- ✅ The full visit flow works in airplane mode and survives app restarts.
- ✅ Retries can never duplicate customers, visits, orders or photos (client ids + keys).
- ✅ Repository tests run real SQL: Jest uses sql.js with the same Drizzle migrations.
- ⚠️ Schema changes need a new Drizzle migration (`npx drizzle-kit generate --name <change>`);
  never edit a released migration.
- ⚠️ Totals of offline orders are estimates (no promotions yet); the server's numbers replace
  them after sync and price differences are kept in `orders.price_adjustments`.
- ⚠️ Background sync while the app is closed is out of scope (phase 7: `expo-background-task`).
