# 0021. Sale catalog filters: family, vehicle and what each family is narrowed by

- **Status**: Accepted
- **Date**: 2026-11-16
- **Related**: ADR 0012 (search the way customers ask; this is its "phase B"), API ADR 0045
  (product sale sheets).

## Context

Taking a sale meant typing in the search box. Customers ask by vehicle and by what the part is:
"pastillas delanteras para Spark 2015", "aceite 20W50 en galón", "filtro de aire para D-Max". The
server now reads from each product's texts what it is and which vehicles it fits (API ADR 0045)
and sends it with the product.

## Decision

### Data on the device

- `products` gains the sheet columns (`family`, `position`, `material`, `filter_type`,
  `viscosity`, `oil_type`, `presentation`, `reference`) and a new table `product_fitments`
  (`make`, `model`, `year_from`, `year_to`) holds the vehicles (drizzle `0011_sale_filters`).
- The pull stores both: the fitments of a product are replaced whenever the product arrives.
- `ProductEntity.saleSheet` carries them. Products downloaded before this version have an empty
  sheet until the server sends them again.

### Filtering (`SqliteCatalogRepository`)

- `findProducts` takes the family, its attributes, the brand, "only in stock" and the vehicle,
  together with the search text and its ranking.
- **Vehicle rule: what a fitment leaves open fits.** A fitment without model fits every model of
  the make; a fitment without years fits every year. Hiding a part that may fit costs a sale.
- **Liquids are not made for a vehicle.** With a vehicle chosen:
  - the oils, coolants, brake fluids and greases stay out of "Todo";
  - choosing one of those families shows all of it, whatever the vehicle.
- `findFacets` returns what each filter can still take, with counts. Each filter is counted
  without itself, so choosing "Delantera" narrows the brands but does not empty the positions.
- `findVehicleMakes` lists makes and models, most products first, for the whole catalog or one
  family.

### Screen (`presentation/features/orders`)

- **`CatalogFilters`**, under the search box:
  - first row: the vehicle, then the families that have products ("Pastillas (212)");
  - second row: what the chosen family is narrowed by, "Solo con stock" and "Limpiar filtros".
- Per family (`sale-filters.ts`): pads → position, material, brand; shoes and discs → position,
  brand; filters → type, brand; oils → viscosity, type, presentation, brand; other liquids →
  presentation, brand.
- A filter is offered only when it has more than one value to choose.
- **`VehicleFilterSheet`**: make → model → year, one tap each; "Cualquier modelo" and
  "Cualquier año" skip a step.
- **The vehicle stays for the whole sale.** It lives in the order draft store
  (`vehicles[key]`, persisted, cleared with the draft): a mechanic asks for pads and a filter for
  the same car. The other filters live in the screen, so they survive going to the review and
  back, not closing the app.
- Each product row shows what it fits ("Spark 2008-2015 · Delantera"); with a vehicle chosen,
  the fitment that covers it.
- With a search or any filter the customer's history section gives way to the results, and the
  number of products found is shown.

## Consequences

- Filters are only as good as the sheets the server reads; products the server could not read
  stay in "Otros" or without vehicle until someone corrects them in the CRM.
- A year filter shows the products without years too. That is on purpose.
- The makes are a wrap of chips ordered by number of products, without a search box inside the
  sheet. Enough for the makes of today's catalog; a box can be added if the list grows.
- Not tried on a device yet: layout and gestures of the new sheets need a pass on a real phone.
