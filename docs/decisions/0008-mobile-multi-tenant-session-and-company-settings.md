# 0008. Mobile multi-tenant session and company settings

- **Status**: Accepted
- **Date**: 2026-10-26
- **Related**: API ADR 0022 (multi-tenancy, branch assignment), ADR 0024 (company
  administration), ADR 0025 (integration hub); app ADR 0001 (session), ADR 0003 (offline-first).

---

## Context

Vende Más became a SaaS: every seller belongs to one company, which has its own time zone,
currency, VAT, contracted modules and brand. The app had all of them hardcoded (Ecuador, USD,
15 %, every feature, red palette) and kept the device database without knowing whose data it
was.

## Decision

- **Session**: after `POST /auth/login` the app loads `GET /auth/me` (company, branches,
  modules, brand) and stores it with the user. Platform accounts (`SUPER_ADMIN`, no company)
  are refused with "ingresa desde la web": they manage the SaaS from the CRM.
- **Company settings at runtime** (`shared/config/business-config.ts`): plain module state
  read by the date and money utilities, set from the session and refreshed by **every sync
  pull** (`company` of `/sync/pull`), so a change in the CRM reaches the phones on their next
  sync. Defaults are the former constants (Ecuador), used until a company is known. An unknown
  time zone is ignored (it would break every date).
- **Device data ownership**: the database records its owner (`userId:companyId`). Signing in
  as someone else (or into another company) wipes it first; the same seller keeps it, so
  changes not synced yet survive an expired session. A database from before this version has
  no owner and is kept.
- **Sign-out by the server**: an expired session or `COMPANY_SUSPENDED` (403) clears the
  session and the login screen says why.
- **Modules**: features of a module the company did not contract are hidden — orders tab and
  actions (`ORDERS`), collections (`COLLECTIONS`), the optimal route (`ROUTES`), promotions
  (`PROMOTIONS`) and the visit types that need them. The API rejects them anyway; hiding avoids
  dead ends. With no company known yet (old session), nothing is hidden until the first sync.
- **Brand**: the company color replaces `primary` / `ring` in light and dark (lifted on dark
  backgrounds), with a readable foreground; `palette.ts` stays the single source for the rest.
- **Working branch**: a user of several branches chooses where they work right after signing in
  (`/branch`) and can switch later from Más; a single branch is chosen automatically. The choice
  is kept with the session and sent as `X-Branch-Id`, so the records they create go to that
  branch (API ADR 0022). Switching is refused while changes wait to be sent (they would land in
  the new branch). A branch where they work with **another account** cannot be listed: that
  option warns that the session will close and signs out so they log in with the other account.
  If the API answers `BRANCH_NOT_ASSIGNED` (the branch was taken from them) the session ends and
  the login screen says why.

## Consequences

- Companies in other countries get correct business days, money and VAT on the device.
- A disabled module never shows screens that would fail.
- Switching sellers on a shared phone cannot mix their data.
- Token refresh now reads the wrapped `{ success, data }` response of the API (it used to log
  the user out every time the access token expired).
