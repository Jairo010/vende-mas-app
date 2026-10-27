# 0009. Agenda grouped by type and optional visit time

- **Status**: Accepted
- **Date**: 2026-10-27
- **Related**: ADR 0004 (agenda and visit execution); API ADR 0026 (optional visit time).

---

## Context

The home listed the day's visits as one timeline ordered by scheduled time. Sellers work by kind
of task (opportunities, orders, collections) and rarely agree on a time with the customer; what
matters is when the visit really started and ended (check-in / check-out).

## Decision

- **Grouped agenda**: under the day summary, the visits are grouped by type (`groupVisitsByType`
  in `presentation/features/agenda/agenda-groups.ts`) in `VISIT_TYPES` order; empty types are not
  shown. Each group is a collapsible parent (`AgendaTypeGroup`) with its color, icon, total and
  "x de y hechas". Groups start collapsed; tapping the parent shows its visits. Inside a group:
  in progress → scheduled (agreed times first, by time; then day-only visits by customer) →
  completed / cancelled (by real start).
- **Optional time**: new and rescheduled visits have no time by default (`OptionalTimeField`:
  "Agregar hora" / "Quitar hora"). Without a time the visit is stored at the local midnight of its
  day with `hasScheduledTime = false` (local column `visits.has_scheduled_time`, migration
  `0002_visit_optional_time`; sent in the `VISIT SCHEDULE` / `RESCHEDULE` payloads). A day-only
  visit can be scheduled for today; a timed one must still be in the future.
- **Real times**: the visit card shows the agreed time only when there is one, and the real
  "Inicio hh:mm · Fin hh:mm (n min)" once the visit started. Headers and history show only the
  date for day-only visits (`formatVisitSchedule`).

## Consequences

- Visits pulled from a server that predates the change are treated as timed (`?? true`).
- The optimal route is unaffected (it already ignored scheduled hours).
