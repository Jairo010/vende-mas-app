# 0007. Mobile optimal route of the day

- **Status**: Accepted
- **Date**: 2026-10-15
- **Related**: API ADR 0021 (optimal daily route and cost guard), ADR 0004 (agenda and visit
  flow), ADR 0003 (offline-first).

---

## Context

Sellers want to see on a map the best order to visit today's pending stores, starting where
they are, and have it follow them as they work. The company must not pay for maps, the app
works offline, and sellers must not see location-tracking details (admins review history on
the server).

## Decision

- **Entry**: "Ver ruta óptima" in the agenda when the selected day is today and the user has
  own pending visits. Screen `app/(app)/route.tsx`.
- **Stops**: today's SCHEDULED / IN_PROGRESS visits assigned to the user whose store has
  coordinates. Stores without coordinates are listed apart (they are pinned by their first
  check-in). The scheduled time is ignored: only travel is minimised (user decision).
- **Computation** (`RouteApiService`): `POST /routes/optimize` with the current GPS position
  (fallback: store of the visit in progress → where the last visit ended → first stop; no GPS
  message is shown). Offline, a server without the endpoint, or a server error → the same
  open-route heuristic as the API runs on the device (`core/value-objects/open-route-heuristic`)
  and the plan is labelled "Ruta estimada".
- **Keeping it current without extra calls** (`reconcilePlan`): the plan is saved per user and
  day (`useRoutePlanStore`, MMKV). When the first stops of the plan are done (the suggested
  order was followed) the plan is trimmed locally — the rest of an optimal open route stays
  optimal — including the drawn polyline. Adding, cancelling or completing a visit out of
  order, or a store getting a new location, recomputes from the current position. "Recalcular"
  forces it.
- **Map**: `react-native-maps` (Google Maps SDK on Android — free, unlimited; Apple Maps on
  iPhone — no key). Numbered markers colored by visit type, the Google polyline (dashed straight
  lines when estimated), dark theme from the palette (`theme/map-style.ts`, hex derived from
  `palette.ts`).
- **Navigation**: Google Maps URLs (no key, free): "Ir a la siguiente" starts turn-by-turn to
  the next stop; "Ruta en Google Maps" opens the next 10 stops in order (URL limit: 9
  waypoints + destination).
- **Android key**: `GOOGLE_MAPS_ANDROID_API_KEY` is injected by `app.config.ts` into the
  `react-native-maps` plugin at build time. Without it the plugin leaves the key out of the
  manifest (the map would crash), so `ENV.MAPS_AVAILABLE` hides the map on such builds; the list
  and the Google Maps shortcuts keep working. Expo Go ships its own key.

## Consequences

- Changing the Android key requires a new native build (`npx expo prebuild --clean` /
  `npx expo run:android`), not just a JS reload.
- Estimated routes ignore one-way streets and traffic; Google Maps still navigates real streets.
- The route screen shows the seller's own position (normal for navigation) but no GPS accuracy,
  distances to the store or tracking details.
