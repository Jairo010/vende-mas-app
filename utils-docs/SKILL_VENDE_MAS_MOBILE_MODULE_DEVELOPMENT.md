# SKILL — Vende Más Mobile Incremental Module Development

## Purpose

This file is the permanent development context and authoritative guide for building and extending the **Vende Más Mobile Application** module-by-module after the foundational architecture and configuration have already been established.

The mobile frontend is built with **React Native, Expo (SDK 57), TypeScript, NativeWind v4, TanStack Query, Zustand, React Hook Form, Zod, and Hexagonal Architecture (Ports & Adapters)**. It communicates with the `vende-mas-api` NestJS backend.

The primary goal of this skill is to ensure that every new feature, screen, or module is implemented cleanly and incrementally without breaking the established architecture, theming tokens, global reusable components, navigation guards, typing rules, or production quality standards.

---

## 1. Existing Project Is the Source of Truth

The mobile project architecture and foundational setup have already been established.

When implementing any new module or feature:

- **Treat the current repository structure as the source of truth.**
- **Preserve existing architectural decisions.** Do NOT replace or restructure the architecture.
- **Do NOT recreate or overwrite global configuration files**:
  - `global.css`
  - `tailwind.config.js`
  - `metro.config.js`
  - `babel.config.js`
  - `tsconfig.json`
  - `eslint.config.mjs`
  - `.prettierrc`
  - `src/theme/palette.ts` (the only place with color values), `src/theme/typography.ts`, `src/theme/spacing.ts`
  - `src/shared/providers/app-providers.tsx`
  - `app/_layout.tsx` (unless adding a global route provider or guard update)
- **Reuse existing UI design system primitives** in `src/presentation/components/ui/` (`Button`, `Input`, `Card`, `Badge`, `BottomSheet`, `Toast`, `LoadingSpinner`, `EmptyState`, `ErrorBoundary`, etc.).
- **Reuse existing layout wrappers** in `src/presentation/layouts/` (`SafeAreaLayout`, `AuthLayout`).
- **Reuse existing storage adapters** in `src/infrastructure/storage/` (`mmkvStorageAdapter`, `secureStorageAdapter`).
- **Reuse existing API client** in `src/infrastructure/api/client/` (`apiClient`).
- **Reuse existing Zustand stores** in `src/stores/` (`useAuthStore`, `useThemeStore`, `useAppStore`).
- **Reuse existing shared utilities and hooks** in `src/shared/` (`useDebounce`, `useNetworkStatus`, `useRefresh`, `formatDate`, `formatCurrency`).
- **Follow conventions already established by existing modules.**

Before coding, inspect neighboring modules or foundational components to ensure consistency.

---

## 2. Core Architecture — Hexagonal / Ports & Adapters for React Native

The mobile application strictly enforces **Hexagonal Architecture** adapted for a React Native client.

### Dependency Direction (Strictly Inward)

```text
Screens / Routes (app/)  [Driving Adapters / Presentation Entrypoints]
        ↓
Feature Components (src/presentation/features/<feature>/)  [Presentation UI]
        ↓
Custom Hooks / Use Cases (src/application/hooks/<feature>/)  [Application Orchestration]
        ↓
Repository & Service Ports (src/core/ports/)  [Domain Contracts / Interfaces]
        ↓
Infrastructure Adapters (src/infrastructure/api/services/, storage/)  [Driven Adapters]
        ↓
Backend REST API / SecureStore / MMKV / Device APIs  [External Systems]
```

### Layer Responsibilities & Strict Boundaries

#### 1. Presentation Layer (`app/` and `src/presentation/`)
- **`app/` (Expo Router Screens)**:
  - Thin routing entrypoints only.
  - Read route parameters (`useLocalSearchParams`).
  - Render layout wrappers and feature components.
  - Connect to application custom hooks for actions.
  - **PROHIBITED**: Direct API calls, axios imports, storage calls, or complex business logic inside screen files.
- **`src/presentation/features/<feature>/` (Feature-Scoped Components)**:
  - Focused UI components belonging to the feature (e.g. `login-form.tsx`, `customer-card.tsx`, `order-summary.tsx`).
  - Composed using design system primitives from `src/presentation/components/ui/`.
  - Receive data and callbacks via explicit typed props.
- **`src/presentation/components/ui/` (Design System Primitives)**:
  - Reusable, headless/shadcn-style UI primitives (`button.tsx`, `input.tsx`, `card.tsx`, etc.).
  - Styled with NativeWind semantic design tokens.
- **`src/presentation/layouts/` (Layout Wrappers)**:
  - Reusable container wrappers (`safe-area-layout.tsx`, `auth-layout.tsx`).

#### 2. Application Layer (`src/application/`)
- **`src/application/hooks/<feature>/` (Use Case Hooks)**:
  - Custom hooks orchestrating application use cases.
  - Wrap TanStack Query (`useQuery`, `useMutation`) for server state.
  - Manage form states (`react-hook-form` + `zod`).
  - Coordinate client stores (`useAuthStore`).
  - Map DTOs to Domain Entities using mappers.
- **`src/application/schemas/` (Validation Schemas)**:
  - Zod schemas defining form and data validation rules with user-facing Spanish error messages.
  - Infer TypeScript types via `z.infer<typeof schema>`.
- **`src/application/mappers/` (Data Mappers)**:
  - Pure transformation functions converting raw backend API DTOs into Domain Entities and vice versa.

#### 3. Core / Domain Layer (`src/core/`)
- **`src/core/entities/` (Domain Entities)**:
  - Pure TypeScript domain models with business rules.
  - **PROHIBITED**: React, React Native, Expo, AsyncStorage, MMKV, or HTTP imports.
- **`src/core/value-objects/` (Value Objects)**:
  - Immutable domain value objects (e.g. `Money`, `Email`).
- **`src/core/errors/` (Domain Errors)**:
  - Typed error classes inheriting from `DomainError`.
- **`src/core/ports/` (Contracts / Interfaces)**:
  - Abstract repository and service interfaces (e.g. `IAuthRepositoryPort`, `ICustomerRepositoryPort`).
- **`src/core/types/` (Domain Types & Enums)**:
  - Shared domain types, enums (`UserRole`, `OrderStatus`), and API envelope types.

#### 4. Infrastructure Layer (`src/infrastructure/`)
- **`src/infrastructure/api/client/` (HTTP Client & Interceptors)**:
  - Axios or fetch client configured with base URL, timeouts, and auth header injection.
  - 401 response interceptor for automatic token refresh queue.
- **`src/infrastructure/api/services/` (API Repository Implementations)**:
  - Concrete classes implementing domain repository ports (e.g. `AuthApiService` implementing `IAuthRepositoryPort`).
- **`src/infrastructure/api/dto/` (API Data Transfer Objects)**:
  - Raw TypeScript interfaces matching backend NestJS Swagger DTO contracts.
- **`src/infrastructure/storage/` (Storage Adapters)**:
  - Implementations of storage ports (`mmkvStorageAdapter`, `secureStorageAdapter`).

---

## 3. Standard Feature Directory Structure

When creating a new feature module (e.g. `auth`, `customers`, `orders`, `tasks`, `visits`, `notifications`), follow this canonical organization:

```text
src/
├── core/
│   ├── entities/<feature>.entity.ts
│   ├── errors/<feature>.errors.ts
│   ├── ports/<feature>.repository.port.ts
│   └── types/<feature>.types.ts
│
├── application/
│   ├── hooks/<feature>/
│   │   ├── use-<operation>.ts
│   │   └── index.ts
│   ├── schemas/<feature>.schema.ts
│   └── mappers/<feature>.mapper.ts
│
├── infrastructure/
│   ├── api/
│   │   ├── dto/<feature>.dto.ts
│   │   └── services/<feature>-api.service.ts
│
└── presentation/
    └── features/<feature>/
        ├── <feature>-<component>.tsx
        └── index.ts

app/
└── (<group>)/<route>.tsx
```

> **Rule**: Create only files and directories needed for the specific feature. Avoid empty folders or speculative abstractions.

---

## 4. Theming System & Styling Rules (NativeWind v4)

### 4.1 Semantic Design Tokens Only
All styles MUST use NativeWind utility classes referencing the semantic design tokens whose values live only in `src/theme/palette.ts` (applied at runtime by `ThemeProvider`). For icons and native props use `useThemeColors()`:

```tsx
// ✅ CORRECT — Semantic tokens adapting to Light and Dark modes
<View className="flex-1 bg-background p-4">
  <Card className="bg-card border-border">
    <Text className="text-foreground font-semibold text-lg">Título</Text>
    <Text className="text-muted-foreground text-sm">Descripción</Text>
    <Button className="bg-primary text-primary-foreground">Aceptar</Button>
  </Card>
</View>

// ❌ FORBIDDEN — Hardcoded hex or RGB colors
<View style={{ backgroundColor: '#FFFFFF', padding: 16 }}>
  <Text style={{ color: '#1E293B' }}>Título</Text>
</View>
```

### 4.2 Available Semantic Tokens
- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-popover` / `text-popover-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`
- `bg-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent-foreground`
- `bg-destructive` / `text-destructive-foreground`
- `bg-success` / `text-success-foreground`
- `bg-warning` / `text-warning-foreground`
- `border-border` / `border-input` / `ring-ring`

### 4.3 Styling Principles
- Never use inline `style={{ ... }}` unless applying dynamic values from `react-native-reanimated`.
- Ensure all screens look stunning in both **Light** and **Dark** modes.
- Use `lucide-react-native` icons consistently.

### 4.4 Form Layout & Input Alignment Design Standards ("Alineación y Estética de Formularios")
To prevent misaligned inputs, jagged labels, broken flex rows, or inconsistent paddings in form screens and sheets:
1. **Unified Input Heights**: All standard single-line text inputs, dropdown triggers, and date selectors MUST use a unified height: `h-12` (48px) with `px-3.5 py-2.5 rounded-xl border border-input bg-card`.
2. **Consistent Label Structure**: Labels must sit above the input container with unified vertical rhythm: `<Text className="text-sm font-medium text-foreground mb-1.5">`. Never place labels inside input rows unless designing an explicit horizontal key-value row.
3. **Prefix & Suffix Icon Alignment**: Input wrappers using icons MUST center them vertically: `<View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">`. Prefix icons receive `mr-2.5 text-muted-foreground`, and the `TextInput` component takes `flex-1 text-foreground text-base py-0`.
4. **Vertical Rhythm Between Fields**: Form groups must be separated by standard vertical rhythm: `<View className="space-y-4">` or `<View className="gap-y-4">`. Do not use arbitrary or conflicting top/bottom margins on individual fields.
5. **Error Message Alignment**: Zod validation error messages must sit immediately below the input with matching left padding: `<Text className="text-xs text-destructive mt-1 font-medium pl-0.5">`.
6. **Button Grouping & Safe Area**: Form action buttons must be placed in a bottom-pinned container with `pt-4 gap-y-2.5` or `flex-row gap-x-3` respecting bottom safe area insets.

---

## 5. Language Policy — Mandatory Rule

| Category | Language | Examples / Location |
| :--- | :--- | :--- |
| **All Technical Code** | **English Only** | Variables, functions, classes, interfaces, hooks, schemas, DTOs, file names, comments, test names, logs, Git commits. |
| **All User-Facing UI** | **Spanish Only** | Screen titles, input labels, placeholders, buttons, validation messages, toast notifications, empty states, dialogs. |

### Centralized Translations Dictionary (`src/shared/i18n/es.ts`)
- All user-facing strings MUST be defined in `src/shared/i18n/es.ts`.
- Components should consume translations from the centralized dictionary.
- Hardcoding Spanish text directly in JSX without a key is discouraged.

---

## 6. Type Safety — Zero `any` Policy

`any` is strictly prohibited in the entire mobile codebase.

- **No explicit `any`** (`data: any` is forbidden).
- **No implicit `any`**.
- **No broad unsafe type assertions** (`as any`).
- For unknown values (e.g. error catching, API error bodies), use `unknown` and narrow with type guards or `instanceof`.
- Use Zod schemas to validate external input and infer TypeScript types (`type LoginInput = z.infer<typeof loginSchema>`).
- Use discriminated unions for complex UI state machines.

---

## 7. State Management Guidelines

### 7.1 Server State (TanStack Query v5)
- Use TanStack Query for **all data fetched from the backend API**.
- Define standardized query keys in `src/shared/constants/query-keys.constants.ts`.
- Wrap queries and mutations in dedicated custom hooks inside `src/application/hooks/<feature>/`.
- Handle `onSuccess`, `onError`, and query invalidation (`queryClient.invalidateQueries`) cleanly.
- Never duplicate server data into Zustand stores.

### 7.2 Client State (Zustand v5)
- Use Zustand exclusively for **pure client-side synchronous state**:
  - `useAuthStore`: Authenticated session, user profile, `isAuthenticated`, `isHydrated`.
  - `useThemeStore`: Theme preference (`light`, `dark`, `system`).
  - `useAppStore`: UI state, active filters, draft state.
- Use `zustand/middleware` `persist` with `zustandMmkvStorage` for non-sensitive client state.
- Sensitive authentication tokens (`accessToken`, `refreshToken`) MUST be stored in `expo-secure-store` via `secureStorageAdapter`, NEVER in MMKV or AsyncStorage.

---

## 8. Forms, Workflows & Device Hardware Integration

### 8.1 Forms & Validation (React Hook Form + Zod)
- All user input forms MUST use `react-hook-form` with `@hookform/resolvers/zod`.
- Zod schemas live in `src/application/schemas/<feature>.schema.ts`.
- Validation error messages in Zod MUST be in user-facing Spanish.
- Form submission state (`isSubmitting`, `errors`, `isValid`) should drive UI states (disabling submit buttons, showing spinners).
- Provide tactile feedback on submission using `expo-haptics`.

### 8.2 Multi-Step Contextual Creation Flows (Type-Selector Bottom Sheet Pattern)
When an entity or task can be of multiple distinct operational types (e.g. `OPPORTUNITY`, `VISIT`, `SALE`, `COLLECTION`):
1. **Never use a single generic form** with overwhelming conditional inputs that clutter the user interface.
2. **Step 1 — Type Selector Bottom Sheet**: Present clear, beautiful cards with dedicated color palettes and icons:
   - `OPPORTUNITY`: Violet / Purple theme (`lucide: TrendingUp`).
   - `VISIT`: Sky / Blue theme (`lucide: MapPin` or `CalendarCheck`).
   - `SALE`: Emerald / Green theme (`lucide: ShoppingCart` or `BadgeDollarSign`).
   - `COLLECTION`: Amber / Orange theme (`lucide: HandCoins` or `Receipt`).
3. **Step 2 — Type-Specific Form Modal**: Upon selecting the type, immediately open the modal or bottom sheet tailored exclusively for that type with its mandatory and optional fields pre-configured.

### 8.3 Stage Transitions & Inter-Module Workflows ("Transición entre Etapas")
1. **Prerequisite Gathering Before Transition**:
   - Never perform a state transition without prompting for the required data of the target stage.
   - Example: Transitioning from `OPPORTUNITY` or `VISIT` to `SALE` strictly requires a linked customer. If `customerId` is missing, the transition flow MUST intercept and prompt the user to select or create a customer before submitting the transition.
2. **Embedded Quick-Create Sub-Sheets**:
   - Mobile users must not lose their in-progress form when they discover a related record (like a customer) doesn't exist yet.
   - Implement searchable picker sheets (e.g. `CustomerPickerModal`) that feature a prominent **"+ Registrar Nuevo Cliente"** button. Tapping it opens a `QuickCreateCustomerSheet`. When saved, the newly created customer is automatically selected and the user seamlessly returns to their task.
3. **Product Catalog & Cart Sub-Flow for Sales**:
   - During a sale creation or transition to `SALE`, provide a dedicated `SaleProductCartSheet` or navigate to an order creation modal allowing the seller to pick products from the catalog, specify quantities, review line items, and generate the order.

### 8.4 Device Hardware Integration (GPS Geo-Tracking & Photo Capture)
1. **GPS Coordinates Synchronization**:
   - Use `expo-location` to automatically obtain seller coordinates (`getCurrentPositionAsync({ accuracy: LocationAccuracy.Balanced })`).
   - Coordinates (`latitude`, `longitude`) are silently and smoothly attached to task creation, status changes, and stage transitions to verify field presence.
   - If permission is denied or GPS is unavailable, fall back gracefully to null without crashing.
2. **Photo Verification & Upload**:
   - Use `expo-image-picker` (`launchCameraAsync` / `launchImageLibraryAsync`) to capture storefronts, signed documents, or fieldwork proof.
   - Photos are uploaded as `multipart/form-data` to the backend storage endpoint (`/api/v1/tasks/upload-photo`) and the returned URL is stored with the task or history record.

---

## 9. API Integration, Error Handling & Audit Trail

### 9.1 API Request/Response Flow
```text
Screen UI ──► Hook (useFeature) ──► Port Interface (IFeaturePort) ──► Service Adapter (FeatureApiService)
                                                                             │
                                                                             ▼ (apiClient)
Screen UI ◄── Hook (Entity) ◄── Mapper (DTO ➔ Entity) ◄── Service Adapter ◄── Backend API (JSON)
```

### 9.2 Error Handling Pattern
- The API client interceptor intercepts HTTP failures.
- Map backend error codes (`AUTH_INVALID_CREDENTIALS`, `TASK_CUSTOMER_REQUIRED`, `TASK_NOT_FOUND`, etc.) to typed domain errors.
- In hooks and components, catch errors as `unknown` and handle gracefully:
  ```typescript
  try {
    await login(credentials);
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      showToast({ type: 'error', message: error.message });
    } else {
      showToast({ type: 'error', message: t('errors.unexpected') });
    }
  }
  ```
- Never let unhandled promise rejections crash the app.

### 9.3 Immutable Audit Trail & History Timelines ("Poder ver logs de todo")
1. **Chronological Event Timeline**:
   - In detail sheets, render an expandable or tabbed timeline component (`TaskHistoryTimeline`) consuming `task.history` (`TaskHistoryResponseDto[]`).
   - Visual nodes show the type transition (`OPPORTUNITY` ➔ `VISIT` ➔ `SALE`), status updates (`PENDING` ➔ `IN_PROGRESS` ➔ `COMPLETED` / `LOST` / `COLLECTED`), user responsible, timestamp, GPS location badge (with open-in-maps shortcut), attached photo preview, and reason notes.

---

## 10. Navigation & Auth Guards (Expo Router)

- Navigation routes live in `app/`.
- Unauthenticated screens live in `app/(auth)/` (`login.tsx`, `forgot-password.tsx`).
- Protected authenticated screens live in `app/(drawer)/` (or `app/(app)/`) utilizing a collapsible left drawer / sidebar navigation (`app/(drawer)/_layout.tsx`) for rich multi-module access without overloading bottom tabs.
- Root `app/_layout.tsx` enforces authentication guards:
  - If `!isHydrated`, render splash/loading screen.
  - If `!isAuthenticated` and user is in protected route, redirect to `/(auth)/login`.
  - If `isAuthenticated` and user is in `(auth)`, redirect to `/(drawer)/tasks` (the commercial agenda home screen).

---

## 11. Automated Testing Strategy — Mandatory

Every feature module MUST include thorough automated unit and component tests. A module is NOT complete without its test suite passing cleanly.

### 11.1 Test Scope & Boundary Placement

| Layer | What to Test | Tools / Location |
| :--- | :--- | :--- |
| **Domain Layer** | Entity rules, value objects, domain error instantiation | Vitest / Jest in `__tests__/core/` |
| **Application Layer** | Zod schemas (valid/invalid cases), DTO mappers, custom hooks (`useLogin`, `useCustomers`) | Vitest / Jest in `__tests__/application/` |
| **Infrastructure Layer** | API services implementing repository ports (mocked API client), storage adapters | Vitest / Jest in `__tests__/infrastructure/` |
| **Client Stores** | Zustand stores (actions, state transitions, hydration) | Vitest / Jest in `__tests__/stores/` |
| **Presentation Layer** | Feature components, form inputs, validation feedback, submit triggers, loading states | `@testing-library/react-native` in `__tests__/presentation/` |

### 11.2 Testing Rules
- **English-Only**: Test suite names, `describe` blocks, and `it` / `test` descriptions MUST be written in English.
- **Pattern**: Follow the standard **Arrange-Act-Assert (AAA)** pattern.
- **Port/Service Mocking**: Mock at the repository port or service boundary (`IAuthRepositoryPort`, `ICustomerRepositoryPort`), NOT by hacking internal Axios or fetch details.
- **Meaningful Assertions**: Test actual business behavior, edge cases, error states, and user interactions, not just superficial line coverage.
- **Test File Placement**: Place test files under `__tests__/` mirroring the `src/` directory structure.

---

## 12. Documentation in `docs/` — Mandatory

Every completed feature module MUST update or create the relevant Markdown documentation under the `docs/` folder:

### 12.1 Required Documentation Updates

1. **System Architecture (`docs/architecture.md`)**:
   - Update the architecture document to reflect the newly implemented module, screen navigation tree, data flow, and interaction with backend services.
2. **API Integration Guide (`docs/api-integration.md`)**:
   - Document backend endpoints consumed, request/response contracts, token handling, and error mapping for the module.
3. **Architectural Decision Records (`docs/decisions/`)**:
   - For every major feature or module, create a dedicated ADR following the standard template:
     - `docs/decisions/0001-mobile-authentication-and-session-management.md`
     - `docs/decisions/0002-customers-module-offline-lookup-and-forms.md`
     - etc.
   - Each ADR must document: **Title**, **Status** (`Accepted`), **Context**, **Decision**, **Consequences**, and **Alternatives Considered**.

### 12.2 Documentation Rules
- Documentation MUST be written in English.
- Keep documentation concise, accurate, and actionable.
- Do NOT copy-paste raw source code blocks into documentation when a clear explanation or diagram suffices.

---

## 13. Validation Tooling & Commands

Before declaring any feature complete, run the project's standard verification commands:

```bash
# Type check TypeScript in strict mode (zero errors)
npm run typecheck

# Run ESLint validation
npm run lint

# Check Prettier formatting
npm run format:check

# Run unit and component test suite
npm test
```

---

## 14. Quality & Validation Checklist for Every Feature

Before declaring any feature complete, verify:

- [ ] **Hexagonal Architecture Preserved**: Screens in `app/` are thin; business logic resides in `src/application/hooks/`; domain entities in `src/core/` are pure TypeScript.
- [ ] **Global Reusability**: UI uses existing design system primitives in `src/presentation/components/ui/` and layouts in `src/presentation/layouts/`.
- [ ] **Theming & Design Tokens**: NativeWind classes use semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `border-border`); zero hardcoded hex colors.
- [ ] **Theme Adaptability**: Looks and functions flawlessly in both Light and Dark themes.
- [ ] **Language Compliance**: All code, types, functions, variables, comments, tests, and documentation are in **English**. All UI labels, placeholders, errors, toasts, and dialogs are in **Spanish** centralized in `src/shared/i18n/es.ts`.
- [ ] **Type Safety**: Strict TypeScript with **zero `any`**.
- [ ] **Security**: Sensitive tokens stored exclusively in `expo-secure-store` via `secureStorageAdapter`.
- [ ] **Validation & Errors**: Zod schemas validate all inputs with Spanish error messages; error handling catches `unknown` and notifies the user with toasts.
- [ ] **Form Layout & Alignment**: All form inputs adhere to Section 4.4 standards (unified `h-12` height, centered prefix/suffix icons, consistent label spacing, no misaligned inputs).
- [ ] **Contextual Multi-Step Workflows**: Multi-type entities use the Type Selector Sheet pattern before opening specific forms; transitions validate prerequisites (customer linking, cart/order generation).
- [ ] **Hardware Sensors & Audit Trail**: Real-time GPS location via `expo-location` and photos via `expo-image-picker` are cleanly captured; audit timelines display event history.
- [ ] **Automated Tests**: Unit tests for entities, schemas, mappers, hooks, stores, and component tests for UI features pass cleanly.
- [ ] **Documentation in `docs/`**: `docs/architecture.md`, `docs/api-integration.md`, and a new ADR under `docs/decisions/` are created or updated.
- [ ] **Tooling Passes**: `npm run typecheck`, `npm run lint`, and `npm test` execute with zero errors.

