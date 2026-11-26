# 0020. Screens read the device database less often

- **Status**: Accepted
- **Date**: 2026-11-16
- **Related**: ADR 0003 (offline-first SQLite and outbox), ADR 0012 (order taking).

## Context

Sellers felt the app slow when moving between screens. Every query reads SQLite through the
synchronous driver, on the JavaScript thread: a read that happens while a screen is opening
competes with its transition. The code made those reads far more often than needed:

- queries went stale after 30 seconds, so a screen opened again read everything again;
- every sync run (on start, on returning to the app, every 5 minutes, after each local change)
  invalidated all local queries, also when the server had nothing new;
- returning from the camera or the maps app counted as "back to the foreground" and started a
  sync;
- in the sale catalog, changing one quantity rendered every row again and looked for the
  promotion of each one.

These were measured by reading the code, not with a profiler. The app was only tried in
development mode (Expo Go), which is much slower than a release build.

## Decision

- **A sync run says whether it changed anything** (`SyncRunSummary.changed`):
  - an operation was accepted or rejected, or
  - the pull brought rows (visits, customers, orders, catalog, collections), or
  - a list that always comes in full (promotions, zones, route, rules, company) differs from the
    previous pull. The engine keeps the last one in memory (`pull-footprint.ts`), so the first
    pull after opening the app always counts as a change.
- **`SyncCoordinator` invalidates the local queries only when the run changed something.** The
  sync screen's own queries are always refreshed. A run that broke without a summary refreshes
  everything.
- **Local data stays fresh for 5 minutes** (`LOCAL_DATA_STALE_TIME_MS`) instead of 30 seconds.
  Local writes (`useOfflineMutation`) and syncs with changes already invalidate what they touch;
  the 5 minutes only bound what depends on the clock, such as the promotions in force.
- **Returning to the foreground syncs only if the last run started more than 60 seconds ago**
  (`FOREGROUND_SYNC_MIN_GAP_MS`).
- **Tabs that are not on screen are frozen** (`freezeOnBlur`).
- **Long lists use FlashList** (sale catalog, customers, sales), which reuses row views.
- **A catalog row is memoized** (`CatalogProductRow`): changing a quantity renders that row, and
  the promotion of a row is computed again only when its product or quantity changes.

## Consequences

- Opening a screen seen in the last minutes shows it from memory, with no database read.
- A change made on the server reaches the screen with the next sync that brings it, as before.
- Something that changes only with time shows up to 5 minutes late (a promotion that starts or
  ends). The server prices the sale again when it receives it, so totals stay right.
- Pulling to refresh with nothing new no longer redraws the lists.
- Not done here: holding back the heavy part of a screen until its transition ends. It should be
  decided with a release build in hand, on the screens that are still slow.
