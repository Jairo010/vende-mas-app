# 0002. Mobile Tasks & Commercial Agenda, Drawer Navigation, and High-Performance List Rendering

- **Status**: Accepted
- **Date**: 2026-09-16
- **Authors**: Vende Más Mobile Core Architecture Team

---

## Context

The **Vende Más Mobile Application** is a specialized commercial enablement and sales-force automation tool for field sales representatives and commercial administrators. Following successful authentication, users land on their daily operational hub: the **Tasks & Commercial Agenda module (`Tasks`)**.

Key requirements for this module:
1. **Commercial Activities Tracking**: Track daily activities categorized into Sales (`SALE`), Collections (`COLLECTION`), Prospecting / New Customers (`NEW_CUSTOMER`), Sales Opportunities (`OPPORTUNITY`), and General activities (`GENERAL`).
2. **Left Sidebar / Drawer Navigation (`AppDrawer`)**: Replace cramped bottom tabs with an expandable drawer navigation menu hosting rich multi-module operational and system routes (Tasks, Customers, Sales, Visits, Opportunities, Catalog, Profile, Sync, Notifications).
3. **Daily Agenda & Calendar Navigation**: Quick horizontal 7-day strip with week shifting, today indicator, and date-based task count badges.
4. **Snappy Touch Interactions**: One-tap interactive checkbox on task cards with immediate optimistic UI update and haptic feedback.
5. **Role-Based Task Scoping**: Sales representatives (`SELLER`) are strictly scoped to their own assigned activities; administrators (`ADMIN`) can view all tasks or filter across representatives.
6. **High-Performance 60fps Scrolling**: Smooth scrolling with large agenda lists via `@shopify/flash-list`.

---

## Decision

We designed and implemented the Tasks & Commercial Agenda module and Drawer navigation following strict Hexagonal Architecture and mobile-first performance principles:

### 1. Architectural Layer Separation
- **Core Domain Layer (`src/core/`)**:
  - `TaskEntity`: Encapsulates business invariants, status transitions (`isCompleted`, `isPending`, `isInProgress`, `isCancelled`), overdue detection (`isOverdue()`), and role-based permissions (`canBeModifiedBy`, `canBeDeletedBy`).
  - `ITaskRepositoryPort`: Core repository port defining contracts for `findAll`, `findById`, `create`, `update`, `delete`, and `toggleStatus`.
  - Typed Domain Errors: `TaskNotFoundError`, `TaskValidationError`, `TaskUnauthorizedError`, `TaskInvalidStatusTransitionError`.
- **Infrastructure Layer (`src/infrastructure/`)**:
  - `TaskApiService`: Concrete Axios adapter implementing `ITaskRepositoryPort`, supporting flexible backend payload unwrapping, query parameter serialization, and typed error mapping.
  - DTOs: `CreateTaskRequestDto`, `UpdateTaskRequestDto`, `FindTasksQueryDto`, `TaskResponseDto`, `PaginatedTasksResponseDto`.
- **Application Layer (`src/application/`)**:
  - `TaskMapper`: Bidirectional transformations between external DTOs and internal domain entities.
  - Zod Schemas: `createTaskSchema` and `updateTaskSchema` validating field length and enumerations.
  - Query & Mutation Hooks: `useTasks` (enforcing seller vs admin scoping), `useTaskDetail`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`, and `useTaskStatusToggle` (with query cache optimistic updates and rollback).
- **Presentation Layer (`src/presentation/` & `app/`)**:
  - `AppDrawer`: Modern custom drawer with user avatar, name, corporate email, role badge (`Asesor Comercial` / `Administrador`), commercial & system route navigation, active route highlights, theme toggle, and secure logout confirmation.
  - `ScreenHeader`: Reusable header with hamburger drawer toggle and titles.
  - `TasksCalendarStrip`: Horizontal 7-day week strip with week switching, today badge, and date-filtered count dots.
  - `TasksFilterBar`: Search input with clear button, category pills with distinct secondary accent colors, and status chips.
  - `TaskCard`: Category colored accent indicator, due time display, customer phone/address shortcuts, and optimistic one-tap status checkbox.
  - `TasksAgendaList`: Accelerated list using `@shopify/flash-list` with pull-to-refresh and floating action button (+ Nueva Tarea).
  - `TaskDetailSheet` & `TaskFormSheet`: Modal sheets for detailed inspection, customer dialing/maps, and React Hook Form + Zod task creation/editing.

### 2. High Aesthetics & Color Palette
- Strict adherence to the centralized color palette:
  - Primary: Carmine Red (`hsl(0, 84%, 50%)`).
  - Dark/Light backgrounds and cards with semantic foreground contrast.
  - Harmonic secondary category tokens: Sales (Carmine Red), Collection (Emerald), New Customer (Blue), Opportunity (Purple), General (Slate).
- Tactile feedback using `expo-haptics` on card selections, checkbox toggles, date taps, and modal submits.

---

## Consequences

### Positive
- **Optimal Field Productivity**: Sales reps can review their day's itinerary in seconds, toggle tasks with one tap, and initiate customer calls or navigation directly from the agenda.
- **Strict Role Security**: Sellers can never accidentally query or manipulate other representatives' tasks because scoping is enforced at both domain and application hook boundaries.
- **Smooth 60fps Experience**: Native cell recycling via FlashList and lightweight modal sheets prevent memory leaks and frame drops.
- **Maintainable & Scalable**: Decoupled repository ports make it straightforward to add offline caching or SQLite synchronization in future iterations without altering UI features.

### Trade-offs
- FlashList v2 manages layout measurements automatically and removes `estimatedItemSize`, requiring responsive padding to be configured via `contentContainerStyle`.
