# 0005. Mobile customers and offline orders

- **Status**: Accepted
- **Date**: 2026-10-13
- **Related**: ADR 0003 (offline-first SQLite + outbox), ADR 0004 (visit flow), API ADR 0017
  (catalog, billing integration and orders), `vende-mas-api/docs/sync-protocol.md`.

---

## Context

Sellers take orders in stores without coverage. The API is the authority on prices,
promotions and VAT, and assigns the official order number. The app must still show the
seller (and the customer) a reliable total before the sync.

## Decision

### 1. Same pricing rules as the server

`core/value-objects/order-pricing.ts` mirrors the API pricing engine: per line, the valid
promotion (GLOBAL / CATEGORY / PRODUCT, minimum quantity) with the largest unit discount,
line discount = unit discount × quantity, VAT on the discounted line, cents rounding. The
catalog, the cart footer, the review and `SqliteOrderRepository.create` all use it, so the
stored estimate matches the official order unless the catalog changed. Server totals and
`priceAdjustments` replace the estimate on the next pull and are listed on the order screen.

### 2. Order flow (`app/(app)/order/new.tsx`)

(ACTIVE customer picker when not opened from a visit or customer) → catalog (search, category
chips, steppers, sticky cart footer) → review (editable lines, delivery date, default +7 days
on the server; notes; totals) → confirm. The cart is a persisted draft per visit or per
customer (`order-draft.store.ts`). Products that became inactive must be removed before
confirming. Confirming an order inside an ORDER visit preselects `ORDER_TAKEN` for its
check-out. `order/[id]` shows the number (or "Pendiente de envío"), lines, totals, adjusted
prices, and shares a plain-text receipt on WhatsApp (`wa.me`, Ecuadorian numbers normalized
to `593…`).

### 3. Customers

- List with debounced search and status filter; detail with store photo, shortcuts (new
  visit, new order, call, directions), billing data and history (visits and orders).
- Identifications are normalized like the API and unique on the device: creating or promoting
  a customer with an identification that another customer has is refused locally.
- **Lookup by RUC / cédula** (`GET /customers/lookup`, online only): offered when a search
  that looks like an identification has no local match (customers tab, visit wizard, order
  customer picker). The API imports the customer from the billing system if needed; the app
  saves it as a server row so visits and orders work offline afterwards. It is not used inside
  the promote form: the API would import a second customer with the same identification.

### 4. Sync screen (`app/(app)/sync.tsx`)

State, rejected operations with **Retry** (requeue with the same key and position: the API
re-evaluates rejected keys) or **Discard**, and the pending queue in push order.

## Consequences

- An order taken offline shows totals that normally match the invoice; differences are
  explicit (adjusted prices).
- Customer lookup in the billing system needs a connection; everything else works offline.
