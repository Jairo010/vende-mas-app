# 0014. Come back later, and a route that costs fewer calls

- **Status**: Accepted
- **Date**: 2026-11-06
- **Related**: ADR 0007 (optimal route), API ADR 0037 (postponing visits), API ADR 0021 (cost guard).

---

## Context

A customer tells the seller to come back this afternoon. Rescheduling to the same day does not
help: the route ignores times, so "Recalcular" puts the visit back where it was. And each visit
done out of order asked Google for a new route, when the company must not pay for maps.

## Decision

### Come back later

- A visit in progress offers "Cliente ocupado: volver más tarde" (`PostponeVisitSheet`): required
  notes and an optional time, which is only a reminder. It goes back to `SCHEDULED` and queues
  `VISIT POSTPONE`. The seller's draft stays for when they return.
- A visit is postponed only on the local day of `postponedAt` (`isPostponedOn`). The next day it is
  an overdue visit like any other. Rescheduling clears it.
- The check-in does not clear it either: a visit being worked on the second time stays out of the
  regular stops, so coming back does not look like a new stop to the plan.
- A visit can now start twice, so `START` is no longer a one-shot action: each one gets its own
  idempotency key. The key is stored with the queued operation, so retries still deduplicate.

### The route

- `dayRouteStops` separates the regular stops from the postponed ones. Only the regular ones are
  sent to optimize or saved in the plan, so "Recalcular" cannot move a postponed visit.
- `withPostponedStops` appends the postponed ones to the plan the seller sees, first asked first,
  with legs estimated on the device. On the map they are straight dashes after the provider's drive.
- If only postponed visits remain, the route is built on the device, without any call.

### Fewer calls

`reconcilePlan` no longer recomputes when a stop in the middle disappears (done out of order,
cancelled, postponed): the `patched` result keeps the order and estimates the legs around the gap.
The plan then shows as "Ruta estimada", because part of it is no longer what the provider computed,
and "Recalcular" stays available. The API is only called for the first route of the day, a new
stop, a store that moved, or "Recalcular".

### Rescheduling on route days

- The sync pull brings the seller's weekly route (`routeDays`, a full list stored in `route_days`),
  so the rule works offline. The API enforces it too (API ADR 0037).
- For a seller and a customer on their route, `RescheduleVisitSheet` offers the next 4 valid dates
  (`nextRouteDates`) instead of the free calendar. The visit's current date is not offered. A
  customer off the route, or an admin or supervisor, keeps the calendar.
- A plan changed while offline makes the server reject the operation, shown with the other
  rejected ones. A route visit already on the target day is merged by the server and disappears
  from the phone on the next sync.

### Collection visits can also sell

A route visit is a collection whenever the customer owes (API ADR 0030), and that customer may also
want to buy. A collection visit shows the order card as well, so the seller makes one stop for both
jobs. An order alone makes the visit a success in the results, whatever outcome is closed with.

## Consequences

- An order slightly less optimal after a change of plans, in exchange for not paying for it.
- The time the customer mentioned is not guaranteed: the route does not plan around it.
