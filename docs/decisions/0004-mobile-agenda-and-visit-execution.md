# 0004. Mobile agenda and visit execution flow

- **Status**: Accepted — supersedes the agenda/task screens of both ADR 0002 documents.
- **Date**: 2026-10-13
- **Related**: ADR 0003 (offline-first SQLite + outbox), API ADR 0016 (Visit as the unit of
  work), `vende-mas-api/docs/sync-protocol.md`.

---

## Context

Every task of a seller is a visit (OPPORTUNITY | ORDER | COLLECTION) with a check-in and a
check-out. The whole visit must work offline, GPS is recorded but never blocks, and the
store photo is mandatory on the first opportunity visit. Supervisors schedule visits for their
sellers and follow them up.

## Decision

### 1. Agenda (`app/(app)/(tabs)/agenda.tsx`)

- `ExpandableCalendar` (week strip, expands to month, Monday first, Spanish names from
  `es.calendar`) themed from the palette and remounted on theme change (the library caches
  its styles).
- One SQLite query per visible month (full weeks) feeds the calendar dots (one per visit
  type, cancelled visits excluded), the day summary (scheduled / in progress / completed) and
  the day timeline.
- "Iniciar" on a card (own visit, scheduled today or overdue) runs the check-in in place.
- A fixed banner shows the visit in progress with the elapsed minutes.

### 2. Visit screen (`app/(app)/visit/[id].tsx`): check-in → work → check-out

- **Check-in / check-out** = `ILocationPort.getCurrentPosition()` (15 s timeout, falls back
  to a fix of the last 2 minutes) followed by the local mutation. A failed reading is a value,
  not an error: the visit is recorded without GPS and the seller sees why.
- **Work by type**: OPPORTUNITY → store photo (required when the customer has none), outcome,
  and "close sale" (requires billing data: the prospect is promoted in
  `customer/[id]/billing`, then the order can be taken); ORDER → linked orders + "Armar
  pedido"; COLLECTION → notes (payments arrive with the collections phase).
- **Draft**: outcome, notes and photo URI are persisted per visit in MMKV
  (`visit-draft.store.ts`) so a call or the OS killing the app does not lose them. Photos are
  copied out of the camera cache immediately. Logout clears drafts.
- Only the assigned seller checks in/out; supervisors and admins can reschedule or cancel.
- Closed visits offer "Agendar próxima visita" (`parentVisitId`; after SALE_CLOSED the
  follow-up defaults to an ORDER visit).

### 3. New visit wizard (`app/(app)/visit/new.tsx`)

A modal screen (instead of a bottom sheet: the customer search needs the keyboard and room)
with three steps: type → customer (search, or a quick prospect with only a reference and the
current location) → date, time, seller (supervisors; team from `GET /users`, cached in MMKV
for offline use) and notes. The prospect and the visit are written locally and queued in
order (CUSTOMER CREATE, then VISIT SCHEDULE).

### 4. Same rules as the API, checked before queuing

`SqliteVisitRepository` mirrors the server so offline actions are not rejected later: one
visit in progress per seller, ORDER/COLLECTION only for ACTIVE customers, SALE_CLOSED only for
an ACTIVE customer, store photo on the first opportunity visit, the first check-in at a store
without coordinates pins its location. Ecuadorian identification rules
(`core/value-objects/ecuador-identification.ts`) match the API's `TaxIdentification`.

## Consequences

- Sellers can run a full day in airplane mode; everything syncs in order on reconnection.
- The order screen (`order/new`, receives `visitId` and `customerId`) is completed in phase 6.
- The supervisor's team list needs one online load before it is available offline.
