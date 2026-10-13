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
Infrastructure Adapters  (Driven Adapters — SQLite repositories, MMKV, SecureStore, Axios)
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
- **Database (`database/`)**: Drizzle schema, versioned migrations and the `Sqlite*Repository`
  adapters that implement the core ports. This is what screens read (offline-first, ADR 0003).
- **API Client**: Configured Axios client with automatic Bearer token injection and 401 refresh interceptors.
- **DTOs**: Raw API request/response structures matching NestJS backend.
- **Device (`device/`)**: `expoLocationAdapter` (GPS, never throws: a failed reading is a
  value) and `imagePickerCameraAdapter` (store photos), behind `ILocationPort` / `ICameraPort`.
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
| **Local database** | `expo-sqlite` + `drizzle-orm` | Offline-first store with migrations (ADR 0003) |
| **Connectivity** | `@react-native-community/netinfo` | Sync triggers and offline banner |
| **Sheets / toasts** | `@gorhom/bottom-sheet`, `sonner-native` | Themed `BottomSheet` and global toasts |
| **Calendar** | `react-native-calendars` | Agenda calendar (phase 5) |

---

## 4. State Management Strategy

- **Business data**: lives in the device database (SQLite). Hooks expose it through
  `@tanstack/react-query`, whose queries read the repositories; the sync engine invalidates
  them after applying server changes. Nothing business-related is copied into Zustand.
- **Client State**: Lightweight stores in `src/stores/`:
  - `useAuthStore`: Authenticated user, session state, and hydration flags.
  - `useThemeStore`: Mode preference (`light`, `dark`, `system`) with MMKV persistence and native scheme sync.
  - `useAppStore`: General app flags (e.g. onboarding).
  - `useSyncStore`: UI state of the sync (phase, online, pending / rejected counts, last sync).

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

### 6.3 Route Guards & Navigation

The root layout (`app/_layout.tsx`) observes `isAuthenticated` and `isHydrated`:

1. **Hydration**: renders nothing until auth and theme stores are restored from MMKV.
2. **Unauthenticated**: any route outside `(auth)` is replaced with `/(auth)/login`.
3. **Authenticated**: `(auth)` routes are replaced with `/(app)/(tabs)/agenda`.

```text
app/
├── (auth)/login, forgot-password
└── (app)/_layout.tsx            Stack + useSyncRunner (keeps the device in sync)
    ├── (tabs)/_layout.tsx       Bottom tabs: Agenda · Clientes · Pedidos · Más
    ├── visit/[id], visit/new    (visit flow — phase 5)
    ├── customer/[id]
    └── order/new                (offline order — phase 6)
```

Bottom tabs replaced the drawer: faster one-handed use in the field.

---

## 7. Offline-first data flow (ADR 0003)

```text
Screen ──► hook (React Query)
             ├─ read  ──► I*RepositoryPort ──► Sqlite*Repository ──► SQLite
             └─ write ──► useOfflineMutation ──► repository: local row + outbox (1 transaction)
                                                   └─► SyncCoordinator.scheduleSync (debounced)

SyncEngine (single-flight)
  1. pending photos ──► POST /files/photos (client photoId)
  2. outbox (in order, ≤100) ──► POST /sync/push ──► APPLIED/DUPLICATE: remove
                                                   REJECTED: keep + show reason
                                                   RETRY/SKIPPED: keep, stop
  3. GET /sync/pull?cursor ──► SqliteSyncStoreRepository.applyPull (skips rows with pending changes)
  4. invalidate React Query ──► screens re-read SQLite
```

Triggers: app start, reconnection, foreground, every 5 minutes, after local changes and
pull-to-refresh. State for the UI: `useSyncStatus()` (`SyncStatusPill`, `OfflineBanner`,
Más → Sincronización).

Dates: `src/shared/utils/date` works in `America/Guayaquil`; the database stores UTC and
payloads carry the local offset.

## 8. Agenda and visit flow (ADR 0004)

```text
Agenda ──► useVisits(visible month) ──► calendar dots + day list + summary
   └─ "Iniciar" ──► useCheckInVisit = GPS (ILocationPort) + useStartVisit
visit/[id] ──► check-in ──► work by type (photo, outcome, order, notes; draft in MMKV)
           └─► check-out = GPS + useCompleteVisit ──► "Agendar próxima visita" (visit/new)
visit/new ──► type → customer (search | quick prospect) → date/time/seller/notes
```

The SQLite visit repository mirrors the API rules (one visit in progress per seller, ORDER /
COLLECTION only for ACTIVE customers, SALE_CLOSED needs an ACTIVE customer, store photo on the
first opportunity visit, first check-in pins the store location).

## 9. Customers and offline orders (ADR 0005)

```text
order/new ──► (ACTIVE customer) ──► catalog + cart draft (MMKV) ──► review ──► useCreateOrder
                 priceOrder() = same promotion/VAT rules as the API (catalog, footer, repository)
order/[id] ──► official number / pending badge, price adjustments, WhatsApp receipt
customers ──► search · detail (photo, shortcuts, history) · billing form · lookup by RUC (online)
sync ──► state, rejected (retry = requeue, discard), pending queue in push order
```

## 10. Collections (ADR 0006)

```text
order review ──► payment plan (once / weekly) ──► local receivable (id = order id) + installments
visit COLLECTION / customer ──► CollectionPanel ──► payment/new ──► useRegisterPayment
   SqliteCollectionRepository: oldest installment first, never above the balance, PAYMENT CREATE
pull ──► receivables, payments, settings (credit rule) ──► order screen blocks overdue customers
```
