# 0011. Customer zones and weekly zone routes

- **Status**: Accepted
- **Date**: 2026-10-28
- **Related**: ADR 0004 (agenda and visit execution), ADR 0007 (optimal route); API ADR 0030.

---

## Context

Admins put each customer in a zone and plan each seller's week by zone in the CRM ("Monday:
Ambato Centro"). The server turns that plan into visits of the next 7 days (API ADR 0030). The
seller must be able to place a new prospect in a zone from the phone, offline.

## Decision

- **Local data:** a `zones` table (`id`, `name`) and `customers.zone_id` (Drizzle migration
  `0003_customer_zones`). Every pull brings the full list of active zones and replaces the local
  one, like promotions. A server that predates zones sends none, and the local list is kept.
- **New prospect:** the form of the new-visit wizard (`QuickProspectForm`) shows the zones as
  optional chips. The chosen zone travels in the `CUSTOMER CREATE` operation (`zoneId`).
- **Customer card:** shows the customer's zone.
- **Route visits:** they arrive through the normal pull as day-only visits with the note
  "Ruta: \<zone\>", so the agenda and the optimal route use them unchanged. Cancelled route
  visits ("La ruta cambió") arrive like any other cancellation.

## Consequences

- No new screens. The route is planned in the CRM; the phone only receives its visits.
- A seller cannot change the zone of an existing customer from the phone: that is a planning
  decision made in the CRM.
