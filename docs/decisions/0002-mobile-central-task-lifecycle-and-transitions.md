# 0002. Mobile Central Task Lifecycle Engine, Stage Transitions, and Commercial Agenda

Date: 2026-09-16
Status: Accepted

## Context

In field sales-force operations, commercial activities are not static reminders; they represent a progressive operational sales pipeline:
1. **`OPPORTUNITY` (Oportunidad Comercial)**: Unqualified prospect identified in the field. Must be recorded rapidly with real-time GPS coordinates and storefront photos. Customer linking is optional at this stage.
2. **`VISIT` (Visita Agendada)**: Scheduled appointment with specific date, time, and optional/linked customer.
3. **`SALE` (Venta Directa)**: Accepted proposal or direct field sale. **Strictly requires an existing customer** for tax and billing compliance, plus linked catalog products.
4. **`COLLECTION` (Cobranza)**: Payment follow-up for credit sales until reaching status **`COLLECTED`**. Customer assignment is strictly required.
5. **`LOST` (Venta Perdida / No llegó a nada)**: Failure status recording field reasons when opportunities or visits do not culminate in a sale.
6. **Field Verification & Audit Trail ("Poder ver logs de todo")**: Every transition, status update, GPS reading, and photo upload must be immutably preserved in `task.history` and rendered chronologically.

## Decision

We have overhauled the mobile Tasks module into the **Central Task Lifecycle Engine**:

1. **Domain Model & Invariants**:
   - `TaskType`: `'OPPORTUNITY' | 'VISIT' | 'SALE' | 'COLLECTION'`.
   - `TaskStatusType`: `'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LOST' | 'COLLECTED' | 'CANCELLED'`.
   - `TaskEntity` enforces that `type === 'SALE'` or `type === 'COLLECTION'` requires a non-null `customerId`, raising a `TaskValidationError` otherwise.
   - `TaskEntity.transitionType()` records stage progressions in `task.history`.

2. **Two-Step Creation Flow**:
   - Rather than an overloaded generic form, tapping "+ Nueva Tarea" or the FAB opens `TaskTypeSelectorSheet` displaying 4 interactive cards with dedicated color palettes:
     - `OPPORTUNITY`: Violet (`#8B5CF6`, `TrendingUp`)
     - `VISIT`: Sky (`#0EA5E9`, `MapPin`)
     - `SALE`: Emerald (`#10B981`, `ShoppingCart`)
     - `COLLECTION`: Amber (`#F59E0B`, `HandCoins`)
   - Tapping any card opens a tailored form sheet (`OpportunityFormSheet`, `VisitFormSheet`, `SaleFormSheet`, `CollectionFormSheet`).

3. **Inter-Module Sub-Flows**:
   - `CustomerPickerModal`: Debounced customer search with "+ Registrar Nuevo Cliente" button.
   - `QuickCreateCustomerSheet`: On-the-spot customer registration with GPS auto-capture that immediately links the new customer without dropping form state.
   - `SaleProductCartSheet`: Product catalog browser with quantity steppers and subtotal, 15% IVA tax, and total calculation.

4. **Hardware Verification & Audit Trail**:
   - Silent, automatic GPS capture via `expo-location` on creations, transitions, and status updates.
   - Photo capture via `expo-image-picker` with multipart upload to `POST /api/v1/tasks/upload-photo`.
   - `TaskHistoryTimeline`: Chronological vertical timeline of all stage changes, GPS badges, notes, and photos.

5. **Stage Transition & Status Update Sheets**:
   - `TaskTransitionSheet`: Prompts for required inputs of target stage (enforces customer before `SALE`).
   - `TaskStatusActionSheet`: Dedicated sheet for marking tasks as `LOST` (requiring explanation notes), `COLLECTED`, `COMPLETED`, `IN_PROGRESS`, or `CANCELLED`.

## Consequences

- **Strict Tax & Billing Compliance**: No sales order or transition to `SALE` can be completed without a registered customer.
- **Enhanced Supervisor Auditability**: Sellers' fieldwork is verifiable through GPS coordinates and photos captured during every lifecycle event.
- **Superior UX**: Reps enjoy focused, single-purpose screens rather than a cluttered form with conditional fields.
- **Offline & Flexible Backend Resilience**: Customer pickers and product catalogs provide default seed fallbacks if network connectivity is interrupted.
