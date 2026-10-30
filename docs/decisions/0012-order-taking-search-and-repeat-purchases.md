# 0012. Order taking: search the way customers ask, repeat what they buy

- **Status**: Accepted
- **Date**: 2026-10-30
- **Related**: ADR 0005 (customers and offline orders); API ADR 0031 (purchase history).

---

## Context

Customers ask for parts by vehicle or by brand and grade: "pastillas para Spark", "aceite Total
20W50", "filtro de aire para D-Max". Two things got in the seller's way:

- the catalog offered the accounting system's categories as chips (e.g. "PASTILLAS DE FRENO
  CARBON CERAMICA"), which mean nothing to them;
- the search needed the words in the order of the product name.

The vehicles, grades and references are written inside the product names and notes, in many
forms (`D/MAX`, `D-MAX`, `DMAX`; `15W-40`; `GLN`; `R/D`). Most orders repeat what the customer
bought before.

## Decision

### Search (`core/value-objects/product-search.ts`, pure, unit tested)

- **`normalizeSearchText`** makes the text comparable:
  - lower case, no accents, punctuation as spaces;
  - one form per variant:
    - viscosities (`15W-40` → `15w40`);
    - models (`d max`/`d-max` → `dmax`, `cx 5` → `cx5`, `bt 50`, `rav 4`, `cr v`, `x trail`);
    - brands (`chev` → chevrolet, `tyt` → toyota, `vw` → volkswagen);
    - positions (`r/d`, `rd`, `delantero` → delantera; `r/t`, `post`, `trasero` → posterior);
    - presentations (`gln` → galon, `ltr` → litro);
  - singular words (`pastillas` → pastilla).
- **`buildProductSearchText`** adds what the text does not say:
  - a product with a viscosity or in an oils or liquids category is an "aceite";
  - the brake pads category adds "pastilla freno";
  - the filters category adds "filtro".

  It is stored in `products.search_text` (migration `0004_order_taking`) when each product is
  saved from the pull. Products stored before the column existed are indexed once, on the first
  search.

- **Query:**
  - each word the seller types must start a word of the search text, in any order;
  - filler words such as "para" or "de" are ignored.
- **`rankProducts` orders the matches:**
  1. the exact code or reference (`D1321`);
  2. products in stock;
  3. words found in the product's own name or notes over those found only in its category;
  4. by name.

The accounting system's category chips are removed. The filters of each product family (vehicle,
viscosity, position, filter type) come in phase B.

### What the customer buys

- The pull's `customerProducts` stream (API ADR 0031) is stored in `customer_products`.
  Inactive rows delete the local one.
- With an empty search, the catalog starts with **"Lo que compra \<cliente\>"**:
  - its products, most bought first, each with "Llevó 4 la última vez · hace 12 días";
  - the button **"Repetir última compra"** puts every product of its latest purchase in the cart,
    with the same quantities;
  - below, "Todo el catálogo".
- The same hint and suggested quantity show on any search result the customer bought before.

### Cart

- Tapping a product adds its suggested quantity: the last purchase's, or 1. Tapping it again (or a
  long press) opens **`QuantitySheet`**: 1, 2, 4, 6, 10, 12, the last purchase's quantity, any
  number typed, or remove.
- The add button shows the suggested quantity ("Agregar 4").

## Consequences

- With the real catalog (860 products):
  - "pastillas spark" → 6 matches, the one in stock first;
  - "aceite total 20w50" → its two presentations;
  - "filtro aire dmax" → 6;
  - "d1321" → the parts with that reference.
- No category browsing until phase B: the search and the customer's history replace it.
- A search ranks up to 2,000 matches on the device, which covers the whole catalog of a
  distributor.
