# 0015. The next visit is mandatory, on the customer's route days

- **Status**: Accepted
- **Date**: 2026-11-10
- **Related**: ADR 0013 (failure reasons), ADR 0014 (come back later), API ADR 0037 (route days),
  API ADR 0038 (next visit and lost customers).

---

## Context

- Sellers finished visits and left without scheduling the next one, so customers fell off the
  agenda.
- The calendar offered any day, and the API now refuses a seller's visit off the customer's route
  days: a seller should never meet that error.
- A customer who does not want to be sold to needs no next visit, and the admins must know.

## Decision

### Finishing a visit holds the seller

- After the check-out the app opens the next visit, straight on the date (type and customer come
  from the finished visit). `followUpType` stays: a closed sale is followed by an order.
- Until it is saved, the finished visit holds the seller: no back button in the header, the Android
  back button does nothing and iOS has no swipe back. The visit shows why.
- `pendingFollowUpId` in the persisted visit draft store survives closing the app: on the next
  launch `(app)/_layout` opens that visit again. Saving the next visit clears it and goes to the
  agenda. Signing out clears it with the drafts.
- The exception is the reason `NOT_INTERESTED` (`losesCustomer`, the API rule): a confirmation
  sheet says the customer will be shown as "Rechazó" or "Cortó relación" and leaves the routes, then
  the visit finishes without a next one. The server marks the customer and cancels its pending
  sales visits (API ADR 0038). A collection visit has no such reason.

### Picking the date

- `route-days.ts` holds the rules, pure and tested: `routeWeekdaysOf`, `isRouteDay`,
  `nextRouteDayFrom` and `quickVisitDates`.
- Step 3 offers **1 week**, **2 weeks** and **1 month**, each moved forward to the next route day
  and labelled with its date. The next visit starts on 1 week, and never on today.
- The calendar (`isDateEnabled`) disables the days off the route. Its own shortcuts (today,
  tomorrow, 3 days) are hidden then, because they would skip the rule.
- Until the seller picks a date, it follows the customer: a new visit from the agenda moves to the
  next route day. Submitting checks the route day again.
- Only a `SELLER` is held to the route days; a customer off every route, an admin or a supervisor
  picks any day, as in the API.
- The reschedule sheet keeps its list of the next four route dates (ADR 0014).

## Consequences

- A seller can still sign out to leave a finished visit, losing the drafts too. The visit then
  appears in the CRM without a next one.
- The lost mark is not shown on the phone yet: the server keeps it and the CRM shows it.
