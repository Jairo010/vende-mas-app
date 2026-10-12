# Architecture Overview — Vende Más Mobile App

## 1. System Architecture

The **Vende Más Mobile Application** is built with **React Native, Expo (SDK 57), TypeScript**, and follows **Hexagonal Architecture (Ports & Adapters)** adapted for client mobile applications.

### Dependency Direction

```text
Screens / UI Components  (Presentation / Driving Adapters)
        ↓
    Custom Hooks  (Application Layer — Use Cases / Orchestration)
        ↓
    Ports / Contracts  (Core Interfaces — Repository, Storage, Service)
        ↓
Infrastructure Adapters  (Driven Adapters — MMKV, SecureStore, Axios API Client)
```

**Fundamental Rule:**
Inner layers (`core` domain and `application`) must **never** depend on concrete infrastructure implementations.

---

## 2. Layer Responsibilities

### 🔷 Core Domain Layer (`src/core/`)
- **Entities**: Pure business objects with no external framework dependencies.
- **Value Objects**: Immutable domain primitives.
- **Errors**: Base `DomainError` and typed subclasses (`UnauthorizedError`, `NotFoundError`, `ValidationError`, `NetworkError`).
- **Ports**: Interface contracts (`IStoragePort`, `ISecureStoragePort`, repository interfaces).
- **Types**: Shared types, pagination wrappers (`ApiResponse`, `PaginatedResponse`), domain enums (`UserRole`).

### 🔷 Application Layer (`src/application/`)
- **Hooks**: Feature-scoped use-case orchestrators (e.g. `useLogin`, `useCustomers`).
- **Schemas**: Zod validation schemas shared between forms and API payloads.
- **Mappers**: Pure functions mapping external API DTOs into internal Domain Entities.

### 🔷 Infrastructure Layer (`src/infrastructure/`)
- **API Client**: Configured Axios client with automatic Bearer token injection and 401 refresh interceptors.
- **DTOs**: Raw API request/response structures matching NestJS backend.
- **Storage Adapters**: 
  - `mmkvStorageAdapter`: High-performance synchronous key-value store for app state.
  - `secureStorageAdapter`: Keychain/Keystore encrypted storage for sensitive JWT tokens.

### 🔷 Presentation Layer (`src/presentation/`)
- **Layouts**: Layout wrappers (`SafeAreaLayout`) ensuring safe area insets and semantic background theming.
- **Components**:
  - `ui/`: Design system primitives (styled with NativeWind).
  - `common/`: Reusable cross-feature components.
  - `feedback/`: Loaders, toasts, skeletons.
- **Features**: Feature-scoped UI fragments.

### 🔷 Navigation Layer (`app/`)
- Expo Router file-system routing.
- Thin screen files orchestrating UI components and calling application hooks.
- Route guards (`AuthGuard`) protecting private tab routes from unauthenticated access.

---

## 3. Technology Stack

| Category | Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | `expo` (SDK 57) | Native managed workflow |
| **Runtime** | React Native 0.86 / React 19 | UI engine with New Architecture |
| **Language** | TypeScript (Strict mode) | Strict type safety, zero `any` |
| **Navigation** | `expo-router` | File-system routing with route guards |
| **Styling** | `nativewind` (v4) + `tailwindcss` | Semantic utility styling with CSS variables |
| **Animations** | `react-native-reanimated` | Declarative 60/120fps animations |
| **Gestures** | `react-native-gesture-handler` | Native touch system |
| **Lists** | `@shopify/flash-list` | High performance recycling lists |
| **Server State** | `@tanstack/react-query` (v5) | Cache, query deduplication, mutations |
| **Client State** | `zustand` (v5) | Local state stores with MMKV persistence |
| **Forms** | `react-hook-form` + `zod` | Declarative validation |
| **Secure Storage** | `expo-secure-store` | Hardware-backed encrypted token storage |
| **Fast Storage** | `react-native-mmkv` | JSI synchronous key-value storage |
| **Network** | `axios` | HTTP client with request/response interceptors |

---

## 4. State Management Strategy

- **Server State**: Managed strictly via `@tanstack/react-query`. No API response data is copied into Zustand stores.
- **Client State**: Lightweight stores in `src/stores/`:
  - `useAuthStore`: Authenticated user, session state, and hydration flags.
  - `useThemeStore`: Mode preference (`light`, `dark`, `system`) with MMKV persistence and native scheme sync.
  - `useAppStore`: General app flags (e.g. onboarding).

---

## 5. Security Principles

1. **Tokens**: JWT access and refresh tokens are stored **only** in `expo-secure-store`. Never in MMKV or AsyncStorage.
2. **Session Cleanup**: On logout or refresh token failure, all secure tokens are wiped and state is reset.
3. **No Secrets in Code**: Secrets and environment-dependent URLs are read from `EXPO_PUBLIC_*` environment variables.

---

## 6. Authentication & Session Management Lifecycle

### 6.1 Authentication Data Flow

```text
LoginScreen (app/(auth)/login.tsx)
    │
    ▼
LoginForm (src/presentation/features/auth/login-form.tsx)
    │  (react-hook-form + zod validation)
    ▼
useLogin (src/application/hooks/auth/use-login.ts)
    │
    ▼
IAuthRepositoryPort (src/core/ports/auth.repository.port.ts)
    │
    ▼
AuthApiService (src/infrastructure/api/services/auth-api.service.ts)
    │  (apiClient POST /api/v1/auth/login)
    ▼
Backend NestJS API (vende-mas-api)
    │
    ▼ returns { userId, email, name, role, accessToken, refreshToken }
AuthMapper (src/application/mappers/auth.mapper.ts)
    │
    ├─► secureStorageAdapter.setItem(STORAGE_KEYS.ACCESS_TOKEN)
    ├─► secureStorageAdapter.setItem(STORAGE_KEYS.REFRESH_TOKEN)
    ├─► mmkvStorageAdapter (persist remembered email if checked)
    └─► useAuthStore.setUser(session.user) ──► Persisted in MMKV
```

### 6.2 Automatic Token Refresh Queue (401 Interceptor)

```text
Outgoing Request
    │
    ▼
Request Interceptor attaches Bearer <accessToken>
    │
    ▼
HTTP 401 Unauthorized Response?
    ├─► NO  ──► Return normal response or propagate domain error
    └─► YES ──► Is already refreshing?
                  ├─► YES ──► Add request resolver to failedQueue
                  └─► NO  ──► Set isRefreshing = true
                                │
                                ▼
                              Retrieve refreshToken from expo-secure-store
                                │
                                ▼
                              POST /api/v1/auth/refresh { refreshToken }
                                │
                                ├─► SUCCESS:
                                │     - Store rotated accessToken & refreshToken in SecureStore
                                │     - Process failedQueue with new accessToken
                                │     - Re-execute original request
                                │
                                └─► FAILURE (token expired or invalid):
                                      - Reject failedQueue
                                      - Clear SecureStore tokens
                                      - useAuthStore.clearSession()
                                      - Redirect user to /(auth)/login
```

### 6.3 Route Guards & Navigation Logic

The root `AuthGuard` in `app/_layout.tsx` observes `isAuthenticated` and `isHydrated` from `useAuthStore`:

1. **Hydration Phase (`!isHydrated`)**: Blocks navigation rendering to prevent UI flicker until MMKV session data is restored.
2. **Unauthenticated Redirect**: If `!isAuthenticated` and the user attempts to enter protected routes (`/(drawer)` or `/(tabs)`), immediately replaces route with `/(auth)/login`.
3. **Authenticated Redirect**: If `isAuthenticated` and the user lands on `(auth)` screens, automatically redirects to `/(drawer)/tasks`.

---

## 7. Tasks & Commercial Agenda Module (`src/presentation/features/tasks/`)

### 7.1 Central Task Lifecycle Engine & Data Flow

```text
TasksScreen (app/(drawer)/tasks/index.tsx)
    │
    ├─► TasksCalendarStrip (horizontal 7-day strip, date picker, today indicator)
    ├─► TasksFilterBar (search input, type pills: OPPORTUNITY/VISIT/SALE/COLLECTION, status chips)
    ├─► TasksAgendaList (accelerated FlashList, pull-to-refresh, Floating Action Button)
    ├─► TaskCard (type color border, status badge, GPS/photo badges, customer shortcut)
    │
    ├─► Step 1: TaskTypeSelectorSheet (4 interactive cards: OPPORTUNITY, VISIT, SALE, COLLECTION)
    │       │
    │       ▼
    ├─► Step 2: Specialized Forms (src/presentation/features/tasks/forms/)
    │       ├─► OpportunityFormSheet (GPS auto-capture, photo picker, deal value)
    │       ├─► VisitFormSheet (scheduled dueDate, date/time pickers, customer)
    │       ├─► SaleFormSheet (mandatory customer validation, product cart picker)
    │       └─► CollectionFormSheet (mandatory customer, amount to collect)
    │
    ├─► TaskDetailSheet (full details, customer dialing/maps, GPS with Google Maps, photo modal)
    │       ├─► TaskTransitionSheet (stage transition: OPPORTUNITY ➔ VISIT ➔ SALE ➔ COLLECTION)
    │       ├─► TaskStatusActionSheet (status update: LOST with reasons, COLLECTED, COMPLETED)
    │       └─► TaskHistoryTimeline (chronological audit logs with GPS and user author)
    │
    └─► Reusable Sub-Flows:
            ├─► CustomerPickerModal (debounced search + "+ Registrar Nuevo Cliente")
            ├─► QuickCreateCustomerSheet (on-the-spot customer creation with GPS)
            └─► SaleProductCartSheet (product catalog browser + quantity stepper + 15% IVA total)
            │
            ▼
    Application Hooks (useTasks, useCreateTask, useTransitionTask, useUpdateTaskStatus, useUploadTaskPhoto)
            │
            ▼
    ITaskRepositoryPort (src/core/ports/task.repository.port.ts)
            │
            ▼
    TaskApiService (src/infrastructure/api/services/task-api.service.ts)
            │
            ▼
    Backend API (/api/v1/tasks)
```

### 7.2 Drawer Navigation (`AppDrawer`)

The application layout uses `expo-router/drawer` with a custom drawer component (`src/presentation/components/common/app-drawer.tsx`):
- **User Profile Header**: Displays user initials avatar, full name, email, and role badge (`Asesor Comercial` / `Administrador`).
- **Commercial Operations Section**:
  - Agenda y Tareas (`/(drawer)/tasks`)
  - Clientes (`/(drawer)/customers`)
  - Ventas y Pedidos (`/(drawer)/sales`)
  - Rutas de Visita (`/(drawer)/visits`)
  - Oportunidades (`/(drawer)/opportunities`)
  - Catálogo (`/(drawer)/catalog`)
- **System Section**:
  - Mi Perfil (`/(drawer)/profile`)
  - Sincronización (`/(drawer)/sync`)
  - Notificaciones (`/(drawer)/notifications`)
- **Footer Controls**:
  - Dark/Light Theme Switcher (`useThemeStore`)
  - Logout with user confirmation dialog (`useLogout`)

