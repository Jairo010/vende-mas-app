# Prompt Template — Vende Más Mobile Incremental Module Development

Use this prompt for each new mobile module or feature implementation after the initial mobile architecture and project configuration have already been established.

---

## 1. Mandatory Project Context

Before doing anything, read and follow:

- `SKILL_VENDE_MAS_MOBILE_MODULE_DEVELOPMENT.md` — This file contains the complete architectural rules, layer boundaries, theming conventions, language policies, error handling patterns, state management guidelines, and testing standards. Treat it as the source of truth.
- The existing implementation of the target feature or neighboring features in the mobile app (`d:\Documents\job\projects\Codeteg\vende-mas-app`).
- The backend API contracts, Swagger DTOs, and controllers in `vende-mas-api` for the corresponding module (`src/modules/tasks/`).
- The project's existing `docs/` documentation.

Treat the project's existing mobile code, design system primitives, and conventions as the source of truth.

Do NOT rebuild or re-scaffold the mobile project.

Do NOT change the base architecture, directory layout, or global configuration files (`global.css`, `tailwind.config.js`, `metro.config.js`, `theme/colors.ts`, `app-providers.tsx`) unless explicitly required and justified.

---

## 2. Feature to Implement

### Module: Central Task Lifecycle Engine & Commercial Agenda (`Tasks`) + Sidebar / Drawer Navigation

Implement and overhaul the **Tasks & Commercial Agenda module** and the **Sidebar / Drawer Navigation Layout** for the Vende Más mobile application.

The mobile app is a field sales-force tool for commercial representatives and supervisors. **Tasks (`Task`)** serve as the central operational lifecycle engine in the field:
1. **`OPPORTUNITY` (Oportunidad Comercial)**: Prospect identified on the ground. Registered with title/name, optional photo (`photoUrl`), and real-time GPS coordinates (`latitude`, `longitude`). Linking a customer (`customerId`) is **optional** at creation because the prospect is not yet qualified.
2. **`VISIT` (Visita Agendada)**: Scheduled appointment or follow-up with a defined date & time (`dueDate`). Customer assignment can be linked or created.
3. **`SALE` (Venta Directa / Cerrada)**: Accepted proposal or direct field sale ready for commercial billing. **Strictly requires an existing customer (`customerId`)** for tax and invoicing compliance. Connects to the catalog products, cart, and linked order (`orderId`).
4. **`COLLECTION` (Cobranza)**: Payment follow-up for credit or deferred sales until reaching status **`COLLECTED`**. Customer is strictly required.
5. **`LOST` (Venta Perdida / No llegó a nada)**: If during a visit or opportunity the customer declines the offer, the task is marked as `LOST`.
6. **Field Verification & Audit Trail ("Poder ver logs de todo")**:
   - Every creation, status change, transition, or photo update records the seller's real-time GPS coordinates (`latitude`, `longitude`).
   - Every state change, transition, note, and photo is immutably recorded in `TaskHistory` (`task.history`) and visualized as a chronological timeline in the mobile detail view.

---

### Backend API Integration Contract (`vende-mas-api`)

The mobile tasks module interfaces directly with the backend NestJS Tasks API:

| HTTP Method | Route | Description | Query / Request Payload | Response Data |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/tasks` | Create operational task (`OPPORTUNITY`, `VISIT`, etc.) with GPS & photo | Body: `{ type: TaskType, title: string, description?: string \| null, dueDate?: string \| null, customerId?: string \| null, estimatedValue?: number \| null, photoUrl?: string \| null, latitude?: number \| null, longitude?: number \| null, orderId?: string \| null, userId?: string }` | 201 Created: `TaskResponseDto` |
| `POST` | `/api/v1/tasks/:id/transition` | Transition task type (`OPPORTUNITY` ➔ `VISIT` ➔ `SALE` ➔ `COLLECTION`) | Param: `id` (UUID), Body: `{ targetType: TaskType, targetStatus?: TaskStatusType, customerId?: string \| null, dueDate?: string \| null, orderId?: string \| null, photoUrl?: string \| null, latitude?: number \| null, longitude?: number \| null, notes?: string \| null }` | 200 OK: `TaskResponseDto` |
| `PATCH` | `/api/v1/tasks/:id/status` | Update task status (`LOST`, `COMPLETED`, `COLLECTED`, etc.) with GPS | Param: `id` (UUID), Body: `{ status: TaskStatusType, latitude?: number \| null, longitude?: number \| null, photoUrl?: string \| null, notes?: string \| null }` | 200 OK: `TaskResponseDto` |
| `POST` | `/api/v1/tasks/upload-photo` | Upload task photo (multipart/form-data) | FormData: `file` (image JPEG/PNG/WebP, max 10MB) | 201 Created: `{ photoUrl: string, originalName: string, size: number, mimeType: string }` |
| `GET` | `/api/v1/tasks` | List and filter commercial tasks for agenda | Query: `FindTasksQueryDto` (`type`, `status`, `startDate`, `endDate`, `search`, `userId`, `customerId`, `page`, `limit`, `sortBy`, `sortDirection`) | 200 OK: `PaginatedTasksResponseDto` (`{ data: TaskResponseDto[], meta: PaginationMeta }`) |
| `GET` | `/api/v1/tasks/:id` | Get task details by UUID with full audit timeline | Param: `id` (UUID) | 200 OK: `TaskResponseDto` (includes `customer`, `user`, and `history: TaskHistoryResponseDto[]`) |
| `PATCH` | `/api/v1/tasks/:id` | Update task details, location, or photo | Param: `id` (UUID), Body: `{ title?: string, description?: string \| null, dueDate?: string \| null, customerId?: string \| null, estimatedValue?: number \| null, photoUrl?: string \| null, latitude?: number \| null, longitude?: number \| null, orderId?: string \| null, userId?: string }` | 200 OK: `TaskResponseDto` |
| `DELETE` | `/api/v1/tasks/:id` | Remove task from agenda | Param: `id` (UUID) | 204 No Content |

#### Backend Data Types & Enums
- **`TaskType`**: `'OPPORTUNITY' | 'VISIT' | 'SALE' | 'COLLECTION'`
- **`TaskStatusType`**: `'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LOST' | 'COLLECTED' | 'CANCELLED'`
- **`TaskCustomerSummaryDto`**: `{ id: string, identification: string, name: string, phone?: string | null, address?: string | null, latitude?: number | null, longitude?: number | null }`
- **`TaskUserSummaryDto`**: `{ id: string, name: string, email: string }`
- **`TaskHistoryResponseDto`**:
  ```typescript
  export interface TaskHistoryResponseDto {
    readonly id: string;
    readonly taskId: string;
    readonly fromType: string | null;
    readonly toType: string;
    readonly fromStatus: string | null;
    readonly toStatus: string;
    readonly userId: string;
    readonly latitude: number | null;
    readonly longitude: number | null;
    readonly photoUrl: string | null;
    readonly notes: string | null;
    readonly createdAt: string;
    readonly user?: {
      readonly id: string;
      readonly name: string;
      readonly email: string;
    } | null;
  }
  ```
- **`TaskResponseDto`**:
  ```typescript
  export interface TaskResponseDto {
    readonly id: string;
    readonly type: TaskType;
    readonly category: string; // Alias mapped to type for backwards compatibility
    readonly title: string;
    readonly description: string | null;
    readonly status: TaskStatusType;
    readonly dueDate: string | null;
    readonly photoUrl: string | null;
    readonly latitude: number | null;
    readonly longitude: number | null;
    readonly estimatedValue: number | null;
    readonly orderId: string | null;
    readonly previousTaskId: string | null;
    readonly userId: string;
    readonly customerId: string | null;
    readonly user: TaskUserSummaryDto | null;
    readonly customer: TaskCustomerSummaryDto | null;
    readonly history?: readonly TaskHistoryResponseDto[];
    readonly createdAt: string;
    readonly updatedAt: string;
  }
  ```

#### Backend Business & Authorization Rules
1. **Sellers (`SELLER` role)**: Automatically assigned to tasks they create; can only view, update, transition, and delete their own tasks.
2. **Administrators (`ADMIN` role)**: Can view all tasks across sellers, filter tasks by `userId`, and assign/reassign tasks to any active user.
3. **Mandatory Customer Rule**:
   - `OPPORTUNITY`: `customerId` is optional (`null`).
   - `VISIT`: `customerId` is optional (`null`).
   - `SALE`: `customerId` is **strictly required**. Submitting or transitioning to `SALE` without `customerId` returns `400 Bad Request` (`TASK_CUSTOMER_REQUIRED`).
   - `COLLECTION`: `customerId` is **strictly required**.
4. **Audit Trail**: Every update to status, transition, or photo appends an immutable event to `TaskHistory`.

---

### Critical Architecture Requirement — Per-User Task Ownership & Isolation ("Tareas por Usuario")

> [!IMPORTANT]
> **Strict User Isolation & Agenda Scoping**:
> 1. **Individual Agendas**: Every seller has their own private commercial agenda. Each user sees only their own tasks when navigating the calendar and agenda.
> 2. **Backend Enforcement**: When `useTasks` calls `GET /api/v1/tasks`, the backend's JWT auth guard identifies `currentUser.id`. For `SELLER` roles, the backend strictly filters records where `userId = currentUser.id`. No seller can access or view another user's agenda.
> 3. **Automatic Assignment on Creation**: When a seller creates a task via `useCreateTask`, the task is automatically assigned to their `userId`. For `ADMIN` users, an optional user selector allows assigning the task to any active seller.
> 4. **Mutation Protection**: Only the task owner (`task.userId === currentUser.id`) or an `ADMIN` can update, transition, or delete a task.
> 5. **Cache Isolation on Multi-User Device**: TanStack Query keys are scoped by the active `userId` (`queryKeys.tasks.list({ userId: currentUser.id, ...filters })`), and `queryClient.clear()` is strictly called on `useLogout` to prevent data leakage between different users logging into the same mobile device.

---

### Step-by-Step Functional & UX Requirements

#### 1. Task Creation Flow — Two-Step Type Selection ("¿Qué tipo de tarea deseas crear?")

> [!CAUTION]
> **Do NOT use a single generic modal with all inputs.**
> When the user presses the Floating Action Button (FAB) or header "+" button, the application MUST present a clear two-step workflow:

##### Step 1: Type Selector Bottom Sheet (`src/presentation/features/tasks/task-type-selector-sheet.tsx`)
Opens a sleek bottom sheet (`@gorhom/bottom-sheet`) titled *"¿Qué tipo de tarea deseas crear?"* displaying 4 interactive cards styled with dedicated theme colors and icons from `lucide-react-native`:

1. **Oportunidad Comercial (`OPPORTUNITY`)**:
   - Accent color: Violet / Purple (`#8B5CF6` / `bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400`).
   - Icon: `TrendingUp` or `Lightbulb`.
   - Title: *"Oportunidad Comercial"*.
   - Subtitle: *"Prospecto nuevo en campo. Registro rápido con GPS y foto (cliente opcional)."*
2. **Visita Agendada (`VISIT`)**:
   - Accent color: Sky / Blue (`#0EA5E9` / `bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400`).
   - Icon: `MapPin` or `CalendarCheck`.
   - Title: *"Visita Agendada"*.
   - Subtitle: *"Reunión o cita de seguimiento programada con fecha y hora."*
3. **Venta Directa (`SALE`)**:
   - Accent color: Emerald / Green (`#10B981` / `bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400`).
   - Icon: `ShoppingCart` or `BadgeDollarSign`.
   - Title: *"Venta Directa"*.
   - Subtitle: *"Cierre de venta y pedido con productos (cliente obligatorio)."*
4. **Cobranza (`COLLECTION`)**:
   - Accent color: Amber / Orange (`#F59E0B` / `bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400`).
   - Icon: `HandCoins` or `Receipt`.
   - Title: *"Cobranza"*.
   - Subtitle: *"Gestión y cobro de factura pendiente (cliente obligatorio)."*

##### Step 2: Type-Specific Creation Modals
Tapping any card in the selector dismisses the selector and opens the form specifically tailored to that type:

- **`OpportunityFormSheet` (`src/presentation/features/tasks/forms/opportunity-form-sheet.tsx`)**:
  - Title input (required, 2-200 characters, e.g. *"Negociación de insumos con Don Carlos"*).
  - Photo picker: Button to take photo (`expo-image-picker` camera) or choose from gallery. Displays a thumbnail preview with a delete ("X") icon. Uploads photo via `useUploadTaskPhoto` (`POST /api/v1/tasks/upload-photo`).
  - GPS Coordinate Badge: Automatically requests GPS location via `expo-location` upon opening the sheet. Displays green badge with location icon: *"Ubicación GPS capturada (-0.1806, -78.4678)"* or a retry button if GPS failed.
  - Estimated Deal Value ($): Numeric input (optional, e.g. `250.00`).
  - Linked Customer: Optional! Button *"Asociar Cliente (Opcional)"* that opens `CustomerPickerModal`.
  - Notes / Description: Multiline text area.
  - Submit button: *"Crear Oportunidad"*.
- **`VisitFormSheet` (`src/presentation/features/tasks/forms/visit-form-sheet.tsx`)**:
  - Title / Purpose of visit (required).
  - Scheduled Date & Time (`dueDate`): Interactive date/time picker (defaults to selected agenda date).
  - Customer: Button *"Seleccionar Cliente"* opening `CustomerPickerModal` (with "+ Registrar Nuevo Cliente" option).
  - GPS Location: Auto-captured via `expo-location`.
  - Instructions / Description: Text area.
  - Submit button: *"Agendar Visita"*.
- **`SaleFormSheet` (`src/presentation/features/tasks/forms/sale-form-sheet.tsx`)**:
  - Title of sale (required, e.g. *"Pedido de abarrotes semanal"*).
  - **Customer: MANDATORY!** Shows a prominent warning if empty: *"Cliente obligatorio para facturación"*. Tapping opens `CustomerPickerModal` (with "+ Registrar Nuevo Cliente" option). Form cannot be submitted without a customer.
  - **Products & Cart**: Button *"Seleccionar Productos del Catálogo"* opening `SaleProductCartSheet` to pick items, quantities, and see calculated total.
  - GPS Location: Auto-captured via `expo-location`.
  - Submit button: *"Registrar Venta"*.
- **`CollectionFormSheet` (`src/presentation/features/tasks/forms/collection-form-sheet.tsx`)**:
  - Title (required).
  - **Customer: MANDATORY!**
  - Scheduled Date & Time (`dueDate`).
  - Amount to Collect ($): Numeric input (required).
  - Notes: Invoice number or debt details.
  - GPS Location: Auto-captured.
  - Submit button: *"Crear Cobranza"*.

---

#### 2. Task Card in Agenda & Distinct Type Styling

In the main agenda screen (`app/(drawer)/tasks/index.tsx`):
- **Horizontal Calendar Date Strip (`TasksCalendarStrip`)**:
  - Weekly view with Day abbreviations (`LUN`, `MAR`, `MIÉ`), Day numbers (`16`, `17`), and "Hoy" (Today) dot.
  - Month/Year label with quick button to open month picker.
- **Type Filter Pills (`TasksFilterBar`)**:
  - `Todas`, `Oportunidades` (`OPPORTUNITY`), `Visitas` (`VISIT`), `Ventas` (`SALE`), `Cobranzas` (`COLLECTION`).
- **Status Filter Pills**:
  - `Todos`, `Pendientes` (`PENDING`), `En Progreso` (`IN_PROGRESS`), `Completadas` (`COMPLETED`), `Perdidas` (`LOST`), `Cobradas` (`COLLECTED`).
- **Task Card Presentation (`TaskCard`)**:
  - On the agenda list, cards MUST show a **concise, clean summary** so the user can easily scan their day:
    - Left colored vertical accent border and background tint matching the type:
      - `OPPORTUNITY`: Violet (`border-l-purple-500 bg-purple-500/5 dark:bg-purple-500/10`)
      - `VISIT`: Sky (`border-l-sky-500 bg-sky-500/5 dark:bg-sky-500/10`)
      - `SALE`: Emerald (`border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10`)
      - `COLLECTION`: Amber (`border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10`)
    - Type pill badge: With icon and label (*"Oportunidad"*, *"Visita"*, *"Venta"*, *"Cobranza"*).
    - Status pill badge:
      - `PENDING`: Slate/Gray
      - `IN_PROGRESS`: Blue
      - `COMPLETED`: Emerald
      - `LOST`: Rose/Red (*"Venta Perdida"*)
      - `COLLECTED`: Teal (*"Cobrada"*)
      - `CANCELLED`: Slate
    - Task Title: Bold, 1-2 lines with ellipsis.
    - Time badge: e.g. `10:30 AM` or `Sin hora`.
    - Customer summary (if assigned): Store/User icon with customer name.
    - Quick action: Checkbox or one-tap button to toggle `COMPLETED` directly.
  - **Tapping anywhere on the card opens the full `TaskDetailSheet`.**

---

#### 3. Task Detail Sheet (`src/presentation/features/tasks/task-detail-sheet.tsx`)

When the user taps any task card, open a comprehensive bottom sheet displaying:
1. **Header**:
   - Large Type badge, Status pill, Task Title, Due Date and formatted time.
2. **Field Verification Badges**:
   - **GPS Coordinates**: Displays latitude/longitude with an *"Abrir en Google Maps"* button (`Linking.openURL`).
   - **Attached Photo**: If `task.photoUrl` exists, displays an image preview thumbnail. Tapping it opens a full-screen image viewer modal.
3. **Customer Card (if assigned)**:
   - Customer full name and identification (DNI/RUC).
   - Phone number with direct *"Llamar"* button (`Linking.openURL('tel:...')`).
   - Address with direct *"Ver Ruta"* button (`Linking.openURL('https://maps.google.com/?q=...')`).
4. **Contextual Stage Transition Button ("Transicionar Etapa")**:
   - Primary action button: *"Transicionar a [Siguiente Etapa]"* (e.g. Oportunidad ➔ Visita, Visita ➔ Venta, Venta ➔ Cobranza).
   - Tapping it opens `TaskTransitionSheet`.
5. **Status Action Button ("Actualizar Estado")**:
   - Secondary button: *"Actualizar Estado"* opening `TaskStatusActionSheet`:
     - *"Marcar como Venta Perdida / No llegó a nada"* (`LOST`).
     - *"Marcar como Cobrada"* (`COLLECTED`).
     - *"Marcar como En Progreso"* (`IN_PROGRESS`).
     - *"Completar Tarea"* (`COMPLETED`).
     - *"Cancelar Tarea"* (`CANCELLED`).
6. **Audit Timeline Section ("Historial de Actividades / Logs")**:
   - Chronological vertical timeline list consuming `task.history` (`TaskHistoryResponseDto[]`).
   - Each event card displays:
     - Event icon and description (e.g. *"Transición: Oportunidad ➔ Visita"* or *"Cambio de Estado: Pendiente ➔ Venta Perdida"*).
     - Author user name and exact timestamp formatted.
     - Location coordinates badge (if captured).
     - Reason / Observation notes.
     - Photo thumbnail (if a photo was uploaded during that step).

---

#### 4. Stage Transition Sheet (`src/presentation/features/tasks/task-transition-sheet.tsx`)

Triggered from `TaskDetailSheet` to transition a task to its next operational stage:

1. **Target Type Selector**:
   - Shows allowed next stages (e.g. `OPPORTUNITY` ➔ `VISIT` or `SALE`; `VISIT` ➔ `SALE`; `SALE` ➔ `COLLECTION`).
2. **Prerequisite Validation**:
   - **Transition to `VISIT`**:
     - Prompts for scheduled date & time (`dueDate`, required).
     - Prompts for notes / visit purpose.
     - Captures current GPS coordinates via `expo-location`.
   - **Transition to `SALE`**:
     - **Customer Check**: If the task does NOT have a customer assigned yet (`task.customerId === null`), display a warning banner: *"Para registrar una venta es obligatorio asignar un cliente"*.
     - Provide two clear options:
       1. *"Seleccionar Cliente Existente"* (opens `CustomerPickerModal`).
       2. *"+ Registrar Nuevo Cliente"* (opens `QuickCreateCustomerSheet`).
     - **Products & Cart Sub-flow**: Button *"Armar Pedido / Seleccionar Productos"* opening `SaleProductCartSheet`.
     - Captures current GPS coordinates via `expo-location`.
     - Transition notes (e.g. *"Cliente aceptó cotización en visita"*).
   - **Transition to `COLLECTION`**:
     - Verifies customer.
     - Prompts for collection due date and amount (`estimatedValue`).
3. **Submission**:
   - Calls `POST /api/v1/tasks/:id/transition`.
   - On success, invalidates TanStack Query cache (`tasks.all`, `tasks.detail(id)`), shows a success toast, and refreshes the detail view with the new history entry.

---

#### 5. Status Update Sheet (`src/presentation/features/tasks/task-status-action-sheet.tsx`)

Allows quick, reliable status updates with GPS verification and notes:
1. **Options**:
   - `LOST` (*"Venta Perdida / No llegó a nada"*): Prompts for reason notes (e.g. *"Cliente no tiene presupuesto actualmente"*, *"Compró a la competencia"*). Auto-captures GPS.
   - `COLLECTED` (*"Cobranza Realizada"*): For collection tasks, confirms payment received with GPS and optional receipt photo.
   - `COMPLETED`: Standard completion with optional photo and GPS.
   - `IN_PROGRESS` / `CANCELLED`.
2. **Submission**:
   - Calls `PATCH /api/v1/tasks/:id/status` with `{ status, latitude, longitude, notes, photoUrl }`.

---

#### 6. Inter-Module Reusable Sub-Flows

To keep the codebase modular, separate, and easy to maintain without coupling all logic into a giant file:

##### A. Searchable Customer Picker (`src/presentation/features/customers/customer-picker-modal.tsx`)
- Search input querying `useCustomers({ search: query })` with 300ms debounce.
- Displays customer cards with Name, Identification (DNI/RUC), and Address.
- **Header Action Button**: **"+ Registrar Nuevo Cliente"**.
  - Tapping it opens `QuickCreateCustomerSheet`.

##### B. Quick Create Customer Sheet (`src/presentation/features/customers/quick-create-customer-sheet.tsx`)
- Allows sellers to register a new customer on the spot without losing their task creation/transition form:
  - Identification (DNI/RUC, required, min 10 chars).
  - First Name & Last Name (required).
  - Phone (required).
  - Address (optional).
  - Location: auto-captures current GPS coordinates.
- On successful submission (`useCreateCustomer`), it automatically selects the newly created customer, closes the quick-create sheet, and returns focus to the task modal!

##### C. Products & Cart Sub-Sheet for Sales (`src/presentation/features/sales/sale-product-cart-sheet.tsx`)
- Search bar for products from `useProducts()`.
- Product list with thumbnail, product code, name, unit price, and stock indicator.
- Quantity increment / decrement buttons (`-` / `+`).
- Sticky cart footer:
  - Item count, Subtotal, Tax, Total ($).
  - Button *"Confirmar Pedido"* generating the order or returning the items to the task sale form.

---

#### 7. Form Layout Standards & Input Alignment Fixes

> [!IMPORTANT]
> **Form Layout & Input Alignment Fixes**:
> Some existing forms had misaligned inputs, jagged labels, or unequal paddings. In the tasks module forms (`OpportunityFormSheet`, `VisitFormSheet`, `SaleFormSheet`, `CollectionFormSheet`, and `TaskTransitionSheet`), strictly apply the following standards:

1. **Unified Input Heights**:
   - Every text input, dropdown button, customer picker trigger, and date selector MUST use a unified height: `h-12` (48px).
   - Tailwind/NativeWind classes: `h-12 px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground`.
2. **Vertically Centered Prefix Icons**:
   - For inputs with icons (like search, calendar, dollar sign, location):
     ```tsx
     <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
       <Calendar className="w-5 h-5 text-muted-foreground mr-2.5" />
       <TextInput className="flex-1 text-foreground text-base py-0" ... />
     </View>
     ```
3. **Unified Labels**:
   - Standard label placed directly above the input:
     ```tsx
     <Text className="text-sm font-medium text-foreground mb-1.5">Título de la tarea</Text>
     ```
4. **Standard Vertical Spacing Between Fields**:
   - Group fields inside a container with `gap-y-4` or `space-y-4`. Never add ad-hoc individual margins.
5. **Aligned Error Messages**:
   - Place validation error text directly below the input container with consistent indentation:
     ```tsx
     <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">{error.message}</Text>
     ```
6. **Bottom-Pinned Action Buttons**:
   - Ensure the submit buttons are enclosed in a bottom container with `pt-4 pb-6 gap-y-2.5` respecting safe area bottom insets.

---

#### 8. Left Sidebar / Drawer Navigation Layout (`app/(drawer)/_layout.tsx` & `src/presentation/components/common/app-drawer.tsx`)

Preserve and polish the modern collapsible left drawer:
- **Drawer Header (`DrawerHeader`)**: User avatar, active user full name, email, and role pill badge (*Vendedor* / *Administrador*).
- **Commercial Section**:
  - **Tareas & Agenda**: Icon `CalendarDays` $\rightarrow$ `/(drawer)/tasks` (default home).
  - **Clientes**: Icon `Users` $\rightarrow$ `/(drawer)/customers`.
  - **Visitas**: Icon `MapPin` $\rightarrow$ `/(drawer)/visits`.
  - **Oportunidades**: Icon `TrendingUp` $\rightarrow$ `/(drawer)/opportunities`.
  - **Catálogo de Productos**: Icon `Package` $\rightarrow$ `/(drawer)/catalog`.
  - **Ventas & Pedidos**: Icon `ShoppingCart` $\rightarrow$ `/(drawer)/sales`.
- **System Section**:
  - **Sincronización Offline**: Icon `RefreshCw` $\rightarrow$ `/(drawer)/sync`.
  - **Notificaciones**: Icon `Bell` $\rightarrow$ `/(drawer)/notifications`.
  - **Mi Perfil**: Icon `User` $\rightarrow$ `/(drawer)/profile`.
- **Footer**:
  - Theme toggle (Light / Dark mode).
  - Logout button with confirmation modal calling `useLogout`.

---

### Hexagonal Architecture Breakdown

```text
Screen (app/(drawer)/tasks/index.tsx)
    ↓
Feature Components (src/presentation/features/tasks/)
    ├── TasksCalendarStrip (Horizontal weekly date strip)
    ├── TasksFilterBar (Type & Status chips + Search)
    ├── TasksAgendaList (Optimized list of TaskCards)
    ├── TaskCard (Single card with type color bar, status badge, concise summary)
    ├── TaskTypeSelectorSheet (Step 1: Type selection cards)
    ├── forms/
    │   ├── opportunity-form-sheet.tsx (Step 2: Opportunity form with GPS & photo)
    │   ├── visit-form-sheet.tsx (Step 2: Visit form with dueDate & customer)
    │   ├── sale-form-sheet.tsx (Step 2: Sale form with mandatory customer & cart)
    │   └── collection-form-sheet.tsx (Step 2: Collection form with amount & customer)
    ├── task-detail-sheet.tsx (Full details, customer actions, GPS, photo, and audit timeline)
    ├── task-transition-sheet.tsx (Transition stage modal with prerequisite checks)
    ├── task-status-action-sheet.tsx (Status update sheet: LOST, COLLECTED, COMPLETED)
    └── task-history-timeline.tsx (Chronological event timeline component)
    ↓
Application Hooks (src/application/hooks/tasks/)
    ├── use-tasks.ts (TanStack Query for filtered agenda list)
    ├── use-task-detail.ts (Query for single task with history)
    ├── use-create-task.ts (Mutation for creating task of any type)
    ├── use-transition-task.ts (Mutation for stage transition)
    ├── use-update-task-status.ts (Mutation for status updates with GPS)
    ├── use-update-task.ts (Mutation for updating details)
    ├── use-upload-task-photo.ts (Mutation for uploading photos)
    └── use-delete-task.ts (Mutation for deleting task)
    ↓
Port Interface (src/core/ports/task.repository.port.ts)
    ↓
Infrastructure Service (src/infrastructure/api/services/task-api.service.ts)
    ↓
API Client & Backend (src/infrastructure/api/client/api-client.ts ➔ /api/v1/tasks)
```

---

### Internationalization Dictionary (`src/shared/i18n/es.ts`)

Centralize all user-facing strings in Spanish under `tasks` and `drawer` namespaces:

```typescript
export const es = {
  drawer: {
    commercialSection: 'Módulo Comercial',
    systemSection: 'Módulo de Sistema',
    tasks: 'Tareas & Agenda',
    customers: 'Clientes',
    visits: 'Visitas',
    opportunities: 'Oportunidades',
    catalog: 'Catálogo de Productos',
    sales: 'Ventas & Pedidos',
    sync: 'Sincronización Offline',
    notifications: 'Notificaciones',
    profile: 'Mi Perfil',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Oscuro',
    logout: 'Cerrar Sesión',
    logoutConfirmTitle: '¿Cerrar Sesión?',
    logoutConfirmMessage: '¿Estás seguro de que deseas salir de tu cuenta?',
    roleSeller: 'Vendedor',
    roleAdmin: 'Administrador',
  },
  tasks: {
    title: 'Agenda Comercial',
    subtitle: 'Tus actividades, visitas y ventas del día',
    today: 'Hoy',
    allTypes: 'Todas',
    allStatuses: 'Todos',
    searchPlaceholder: 'Buscar por título o cliente...',
    types: {
      OPPORTUNITY: 'Oportunidad',
      VISIT: 'Visita',
      SALE: 'Venta',
      COLLECTION: 'Cobranza',
    },
    statuses: {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completada',
      LOST: 'Venta Perdida',
      COLLECTED: 'Cobrada',
      CANCELLED: 'Cancelada',
    },
    selector: {
      title: '¿Qué tipo de tarea deseas crear?',
      opportunityTitle: 'Oportunidad Comercial',
      opportunityDesc: 'Prospecto nuevo en campo. Registro rápido con GPS y foto.',
      visitTitle: 'Visita Agendada',
      visitDesc: 'Cita de negocios programada con fecha y hora.',
      saleTitle: 'Venta Directa',
      saleDesc: 'Cierre de pedido con productos (cliente obligatorio).',
      collectionTitle: 'Cobranza',
      collectionDesc: 'Gestión y cobro de factura pendiente (cliente obligatorio).',
    },
    forms: {
      titleLabel: 'Título de la tarea',
      titlePlaceholder: 'Ej. Presentación de productos con Don Carlos',
      dueDateLabel: 'Fecha y hora programada',
      customerLabel: 'Cliente asociado',
      customerOptional: 'Cliente asociado (opcional)',
      customerRequired: 'Cliente asociado (obligatorio para venta)',
      customerPlaceholder: 'Buscar o seleccionar cliente...',
      estimatedValueLabel: 'Monto estimado ($)',
      estimatedValuePlaceholder: '0.00',
      descriptionLabel: 'Instrucciones / Observaciones',
      descriptionPlaceholder: 'Notas adicionales sobre la actividad...',
      photoLabel: 'Foto del lugar / comprobante',
      takePhoto: 'Tomar Foto',
      choosePhoto: 'Elegir de Galería',
      changePhoto: 'Cambiar Foto',
      gpsCaptured: 'Ubicación GPS capturada',
      gpsFailed: 'GPS no disponible (reintentar)',
      saveButton: 'Guardar Tarea',
      savingButton: 'Guardando...',
      updateButton: 'Actualizar Tarea',
    },
    detail: {
      title: 'Detalle de la Actividad',
      openMap: 'Ver en Google Maps',
      callCustomer: 'Llamar al Cliente',
      navigateRoute: 'Ver Ruta',
      transitionStageButton: 'Transicionar Etapa',
      updateStatusButton: 'Actualizar Estado',
      editTaskButton: 'Editar Tarea',
      deleteTaskButton: 'Eliminar Tarea',
      timelineTitle: 'Historial de Actividades (Logs)',
      noHistory: 'No hay eventos registrados en el historial.',
    },
    transitions: {
      modalTitle: 'Transicionar Etapa de la Tarea',
      selectTargetType: 'Selecciona la nueva etapa:',
      customerRequiredNotice: 'Para registrar o pasar a Venta es obligatorio asignar un cliente existente o registrar uno nuevo.',
      selectCustomerBtn: 'Seleccionar Cliente',
      quickCreateCustomerBtn: '+ Registrar Nuevo Cliente',
      openCartBtn: 'Armar Pedido con Catálogo',
      notesLabel: 'Motivo o notas de la transición',
      notesPlaceholder: 'Ej. Cliente aceptó propuesta comercial en la visita',
      confirmTransition: 'Confirmar Transición',
    },
    statusModal: {
      title: 'Actualizar Estado de la Tarea',
      markLost: 'Marcar como Venta Perdida / No se concretó',
      markCollected: 'Marcar como Cobrada',
      markCompleted: 'Marcar como Completada',
      markInProgress: 'Marcar En Progreso',
      markCancelled: 'Cancelar Tarea',
      reasonLabel: 'Motivo / Observación',
      reasonPlaceholder: 'Ej. Cliente indicó que no cuenta con presupuesto este mes...',
      confirmButton: 'Actualizar Estado',
    },
    customerPicker: {
      title: 'Seleccionar Cliente',
      searchPlaceholder: 'Buscar por nombre o cédula/RUC...',
      addNewCustomer: '+ Registrar Nuevo Cliente',
      noResults: 'No se encontraron clientes',
    },
    quickCustomer: {
      title: 'Registro Rápido de Cliente',
      identificationLabel: 'Cédula / RUC',
      firstNameLabel: 'Nombres',
      lastNameLabel: 'Apellidos',
      phoneLabel: 'Teléfono celular',
      addressLabel: 'Dirección comercial',
      saveButton: 'Guardar y Vincular Cliente',
    },
    cart: {
      title: 'Catálogo y Pedido de Venta',
      searchPlaceholder: 'Buscar productos...',
      itemsCount: 'Productos',
      subtotal: 'Subtotal',
      tax: 'IVA (15%)',
      total: 'Total',
      confirmOrder: 'Confirmar Pedido',
    },
    errors: {
      titleRequired: 'El título de la tarea es obligatorio',
      titleMinLength: 'El título debe tener al menos 2 caracteres',
      customerRequiredForSale: 'Para ventas y cobranzas es obligatorio asignar un cliente',
      dueDateRequiredForVisit: 'Para visitas es obligatorio definir una fecha programada',
      fetchFailed: 'No se pudieron cargar las tareas de la agenda',
      createFailed: 'Ocurrió un error al crear la tarea',
      transitionFailed: 'Ocurrió un error al transicionar la tarea',
      statusUpdateFailed: 'Ocurrió un error al actualizar el estado',
      deleteFailed: 'Ocurrió un error al eliminar la tarea',
    },
    toasts: {
      createdSuccess: 'Tarea creada correctamente',
      transitionSuccess: 'Etapa transicionada con éxito',
      statusUpdatedSuccess: 'Estado de la tarea actualizado',
      deletedSuccess: 'Tarea eliminada de la agenda',
      customerCreated: 'Cliente creado y vinculado con éxito',
    },
  },
};
```

---

### Automated Unit & Component Tests Required

Implement a complete test suite under `__tests__/` verifying every layer of the Tasks, Transitions & Drawer module:

- **Domain Entity Tests (`__tests__/core/task.entity.test.ts`)**:
  - Tests `Task` entity creation with `type` (`OPPORTUNITY`, `VISIT`, `SALE`, `COLLECTION`).
  - Tests invariant that `type === 'SALE'` and `type === 'COLLECTION'` requires `customerId`.
  - Tests `transitionType()` validating stage rules and updating type/status/notes/location.
  - Tests `changeStatus()` validating updates to `LOST`, `COLLECTED`, `COMPLETED`.
  - Tests RBAC methods `canBeModifiedBy()` and `canBeDeletedBy()`.
- **Validation Schema Tests (`__tests__/application/schemas/task.schema.test.ts`)**:
  - Tests `createTaskSchema`, `transitionTaskSchema`, and `updateTaskStatusSchema` with Spanish error messages.
- **Mapper Tests (`__tests__/application/mappers/task.mapper.test.ts`)**:
  - Tests mapping backend `TaskResponseDto` and `TaskHistoryResponseDto` into domain models.
- **Application Hook Tests (`__tests__/application/hooks/tasks/`)**:
  - `use-tasks.test.ts`: Queries filtered tasks by date range and type.
  - `use-create-task.test.ts`: Mutation creating task with GPS and photo.
  - `use-transition-task.test.ts`: Mutation executing stage transitions.
  - `use-update-task-status.test.ts`: Mutation executing status updates.
- **Component Tests (`__tests__/presentation/features/tasks/`)**:
  - `task-type-selector-sheet.test.tsx`: Tests rendering the 4 cards and triggering type selection.
  - `task-card.test.tsx`: Tests concise card rendering with type color indicator and status badge.
  - `task-detail-sheet.test.tsx`: Tests rendering full details, photo preview, GPS badge, and audit timeline.
  - `task-transition-sheet.test.tsx`: Tests customer requirement enforcement when transitioning to SALE.
  - `app-drawer.test.tsx`: Tests drawer navigation menu, user profile, theme toggle, and logout.

---

### Mandatory Documentation in `docs/`

1. **System Architecture (`docs/architecture.md`)**:
   - Update architecture document with the Central Task Lifecycle Engine, Type Transitions (`OPPORTUNITY` ➔ `VISIT` ➔ `SALE` ➔ `COLLECTION`), GPS geo-location synchronization, photo upload flow, and Drawer navigation layout.
2. **API Integration Guide (`docs/api-integration.md`)**:
   - Document backend endpoints (`POST /tasks`, `POST /tasks/:id/transition`, `PATCH /tasks/:id/status`, `POST /tasks/upload-photo`, `GET /tasks`, `GET /tasks/:id`).
3. **Architectural Decision Record (`docs/decisions/0002-mobile-central-task-lifecycle-and-transitions.md`)**:
   - Create ADR detailing the transition engine, two-step type selector sheet, customer prerequisite enforcement, and audit trail timeline.

---

## 3. Language Requirement — Mandatory

The technical implementation MUST be written in English:
- Code, variables, functions, classes, interfaces, types, hooks, schemas, DTOs, file names, comments, JSDoc, test names, documentation, commit messages.

All user-facing UI content MUST be in Spanish:
- Screen titles, labels, placeholders, buttons, error messages, toast alerts, empty states, dialogs.

Do NOT mix languages.

---

## 4. Verification Commands

Format, lint, typecheck, and test all changed files using the project's tooling:
```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```

---

## 5. Final Review Checklist

Before declaring completion, confirm:
- [ ] Hexagonal architecture is strictly preserved.
- [ ] Clicking "Nueva Tarea" opens `TaskTypeSelectorSheet` asking for the task type first; never a single bloated form.
- [ ] Type-specific forms (`OpportunityFormSheet`, `VisitFormSheet`, `SaleFormSheet`, `CollectionFormSheet`) render fields tailored to each type.
- [ ] Form layout standards from Section 4.4 are strictly followed (unified `h-12` heights, centered prefix icons, consistent labels, `gap-y-4` spacing, zero misaligned inputs).
- [ ] Transitioning to `SALE` strictly checks for customer; if missing, prompts user to select or quick-create a customer.
- [ ] `CustomerPickerModal` and `QuickCreateCustomerSheet` allow on-the-fly customer creation without losing form state.
- [ ] Sales flow connects to `SaleProductCartSheet` for selecting catalog products and calculating totals.
- [ ] GPS coordinates via `expo-location` are automatically attached to creations, status changes, and transitions.
- [ ] Photos via `expo-image-picker` can be captured and uploaded via `POST /api/v1/tasks/upload-photo`.
- [ ] Tasks in the calendar list display colored border/tint by type (`OPPORTUNITY`, `VISIT`, `SALE`, `COLLECTION`).
- [ ] Task card shows a concise summary; tapping opens `TaskDetailSheet` with the full summary and **Audit Timeline (`TaskHistoryTimeline`)**.
- [ ] Left drawer / sidebar navigation (`AppDrawer`) is modern, smooth, and handles all module routes.
- [ ] Looks great in both Light and Dark mode using semantic tokens.
- [ ] All technical code is in English; all UI text is in Spanish.
- [ ] Zero `any` in TypeScript.
- [ ] Automated unit and component tests pass cleanly (`npm test`).
- [ ] Documentation in `docs/` is created/updated.
