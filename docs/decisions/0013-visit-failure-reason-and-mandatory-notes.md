# 0013. Visit failure reason and mandatory notes

- **Status**: Accepted
- **Date**: 2026-11-05
- **Related**: ADR 0004 (visit flow); API ADR 0036 (the rule and how results are measured).

---

## Context

Admins need to count why visits fail. The seller is the only one who knows, and may be offline
when closing the visit.

## Decision

- The fixed list of reasons and which ones fit each situation live in `core/types/visit.types.ts`,
  mirroring the API, so a closing is validated before it is queued. The API validates again.
- **Finishing a visit:** notes are always required (5 characters at least). Choosing "No
  interesado", "Sin pedido" or "No cobrado" shows the reasons of that outcome, and one is required.
  Changing the outcome drops a chosen reason that no longer applies.
- **Cancelling:** a reason and notes are always required. The notes travel as the existing `reason`.
- `visits.failure_reason` (drizzle migration `0005`) stores the reason locally and comes back in
  the sync pull. The draft keeps it per visit, like the notes and the photo.
- `ChoiceGroup` is the grid of radio buttons shared by the outcome and the reason.
- Notes written when scheduling do not count as closing notes, so the field starts empty.
