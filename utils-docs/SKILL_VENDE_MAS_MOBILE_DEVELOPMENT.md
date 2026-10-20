# SKILL — Vende Más Mobile App Development

## Purpose

This file is the permanent development context for building and extending the **Vende Más Mobile Application** using **React Native, Expo (SDK 57), TypeScript, and Hexagonal Architecture (Ports & Adapters)**.

The mobile application is the primary client for the `vende-mas-api` NestJS backend. It is a sales-force mobile tool used by sales representatives and administrators in the field.

The primary goal of this skill is to ensure that every feature or screen is implemented incrementally, maintaining a clean architecture, strict typing, consistent theming, comprehensive error handling, offline resilience, and production readiness.

---

## 1. Technology Stack — Authoritative

The following stack is the source of truth. Do NOT substitute libraries without explicit instruction and justification.

### Core

| Category | Library | Purpose |
| :--- | :--- | :--- |
| Framework | `expo` (SDK 57) | Managed workflow, native APIs |
| Language | TypeScript (strict mode) | Zero `any`, full type safety |
| Runtime | React Native 0.86+ / React 19 | UI engine |

### Navigation

| Library | Purpose |
| :--- | :--- |
| `expo-router` (v5+) | File-system based navigation, route guards, deep linking |

### UI & Styling

| Library | Purpose |
| :--- | :--- |
| `nativewind` (v4 stable) | Tailwind CSS utility classes for React Native |
| `react-native-reusables` | Accessible, headless UI primitives (shadcn/ui-style) |
| `lucide-react-native` | Consistent, modern icon set |

### Animations & Gestures

| Library | Purpose |
| :--- | :--- |
| `react-native-reanimated` | High-performance, declarative animations |
| `react-native-gesture-handler` | Native gesture system |
| `@gorhom/bottom-sheet` | Performant bottom sheets with gesture support |

### Media & Effects

| Library | Purpose |
| :--- | :--- |
| `expo-image` | Optimized, cached image rendering |
| `expo-haptics` | Tactile feedback for user interactions |
| `expo-blur` | Blur effects for overlays and backgrounds |

### Lists & Performance

| Library | Purpose |
| :--- | :--- |
| `@shopify/flash-list` | Performant, recycling list component |

### Server State & Client State

| Library | Purpose |
| :--- | :--- |
| `@tanstack/react-query` (v5+) | Server state, caching, background sync, mutations |
| `zustand` (v5+) | Lightweight client-side state management |

### Forms & Validation

| Library | Purpose |
| :--- | :--- |
| `react-hook-form` | Performant form state management |
| `zod` | Schema-based validation, shared with DTOs |

### Storage & Security

| Library | Purpose |
| :--- | :--- |
| `react-native-mmkv` | Synchronous, high-performance key-value storage (JSI) |
| `expo-secure-store` | Encrypted storage for sensitive data (tokens, secrets) |

### Developer Tooling

| Tool | Purpose |
| :--- | :--- |
| `eslint` + `typescript-eslint` | Static analysis, code quality |
| `prettier` | Code formatting consistency |
| `vitest` or `jest` | Unit and integration testing |
| `@testing-library/react-native` | Component testing |

---

## 2. Core Architecture — Hexagonal / Ports & Adapters

The mobile app MUST follow **Hexagonal Architecture** adapted for a React Native client application.

### Dependency Direction

```text
Screens / UI Components  (Presentation / Driving Adapters)
        ↓
    Custom Hooks  (Application Layer — Use Cases / Orchestration)
        ↓
    Ports / Contracts  (Interfaces — Repository, Service, Gateway)
        ↓
Infrastructure Adapters  (Driven Adapters — API Client, Storage, Device APIs)
```

### Core Rule

> Inner layers (domain, application) must NEVER depend on concrete infrastructure implementations.

### Prohibited Dependencies

```text
Screen Component → Axios/Fetch directly
Screen Component → MMKV/SecureStore directly
Screen Component → Platform-specific APIs directly
Custom Hook → Concrete API client import
Domain Entity → React Native / Expo imports
Domain Entity → Storage library imports
```

### Preferred Flow

```text
User Interaction
    ↓
Screen Component (Presentation)
    ↓
Custom Hook (Application — orchestrates use case)
    ↓
Port / Repository Interface (Contract)
    ↓
Infrastructure Adapter (API client, local storage, device service)
    ↓
External System (REST API, MMKV, SecureStore, Camera, GPS)
```

---

## 3. Project Structure — Canonical

```text
vende-mas-app/
├── app/                              # Expo Router — File-system navigation
│   ├── (auth)/                       # Auth group (login, register, forgot-password)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                       # Main tab navigation (authenticated)
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Home / Dashboard
│   │   ├── customers/
│   │   ├── tasks/
│   │   ├── sales/
│   │   └── profile/
│   ├── _layout.tsx                   # Root layout (providers, theme, auth guard)
│   └── +not-found.tsx                # 404 fallback
│
├── src/
│   ├── core/                         # 🔷 DOMAIN LAYER — Zero framework dependencies
│   │   ├── entities/                 # Pure TypeScript business objects
│   │   │   ├── user.entity.ts
│   │   │   ├── customer.entity.ts
│   │   │   ├── order.entity.ts
│   │   │   └── index.ts
│   │   ├── value-objects/            # Immutable domain primitives
│   │   │   ├── email.vo.ts
│   │   │   ├── money.vo.ts
│   │   │   └── index.ts
│   │   ├── errors/                   # Typed domain error classes
│   │   │   ├── domain.error.ts       # Abstract base error
│   │   │   ├── auth.errors.ts
│   │   │   ├── validation.errors.ts
│   │   │   └── index.ts
│   │   ├── ports/                    # Repository & service interfaces (contracts)
│   │   │   ├── auth.repository.port.ts
│   │   │   ├── customer.repository.port.ts
│   │   │   ├── order.repository.port.ts
│   │   │   ├── storage.port.ts
│   │   │   ├── secure-storage.port.ts
│   │   │   └── index.ts
│   │   └── types/                    # Shared domain types, enums, constants
│   │       ├── api.types.ts          # API response envelope, pagination
│   │       ├── auth.types.ts
│   │       ├── role.enum.ts
│   │       └── index.ts
│   │
│   ├── application/                  # 🔷 APPLICATION LAYER — Use case orchestration
│   │   ├── hooks/                    # Feature-specific custom hooks (use cases)
│   │   │   ├── auth/
│   │   │   │   ├── use-login.ts
│   │   │   │   ├── use-logout.ts
│   │   │   │   ├── use-auth-session.ts
│   │   │   │   └── index.ts
│   │   │   ├── customers/
│   │   │   │   ├── use-customers.ts
│   │   │   │   ├── use-customer-detail.ts
│   │   │   │   └── index.ts
│   │   │   ├── sales/
│   │   │   ├── tasks/
│   │   │   ├── notifications/
│   │   │   └── index.ts
│   │   ├── schemas/                  # Zod validation schemas (form & API)
│   │   │   ├── auth.schema.ts
│   │   │   ├── customer.schema.ts
│   │   │   ├── order.schema.ts
│   │   │   └── index.ts
│   │   └── mappers/                  # API DTO ↔ Domain entity mappers
│   │       ├── customer.mapper.ts
│   │       ├── order.mapper.ts
│   │       └── index.ts
│   │
│   ├── infrastructure/               # 🔷 INFRASTRUCTURE LAYER — Driven adapters
│   │   ├── api/                      # HTTP client & API service implementations
│   │   │   ├── client/
│   │   │   │   ├── api-client.ts     # Configured Axios/Fetch instance
│   │   │   │   ├── interceptors.ts   # Auth token injection, refresh logic
│   │   │   │   └── index.ts
│   │   │   ├── services/             # Concrete repository implementations
│   │   │   │   ├── auth-api.service.ts
│   │   │   │   ├── customer-api.service.ts
│   │   │   │   ├── order-api.service.ts
│   │   │   │   └── index.ts
│   │   │   └── dto/                  # Raw API request/response DTOs
│   │   │       ├── auth.dto.ts
│   │   │       ├── customer.dto.ts
│   │   │       ├── pagination.dto.ts
│   │   │       └── index.ts
│   │   ├── storage/                  # Local storage adapter implementations
│   │   │   ├── mmkv-storage.adapter.ts
│   │   │   ├── secure-storage.adapter.ts
│   │   │   └── index.ts
│   │   ├── device/                   # Device capability adapters
│   │   │   ├── haptics.adapter.ts
│   │   │   ├── camera.adapter.ts
│   │   │   └── index.ts
│   │   └── providers/                # DI-like provider registration
│   │       ├── api-provider.tsx
│   │       └── index.ts
│   │
│   ├── presentation/                 # 🔷 PRESENTATION LAYER — UI components
│   │   ├── components/               # Shared, reusable UI components
│   │   │   ├── ui/                   # Design system primitives (Button, Input, Card, etc.)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── bottom-sheet.tsx
│   │   │   │   ├── loading-spinner.tsx
│   │   │   │   ├── empty-state.tsx
│   │   │   │   ├── error-boundary.tsx
│   │   │   │   └── index.ts
│   │   │   ├── common/               # Composed, cross-feature components
│   │   │   │   ├── page-header.tsx
│   │   │   │   ├── search-bar.tsx
│   │   │   │   ├── paginated-list.tsx
│   │   │   │   ├── confirmation-dialog.tsx
│   │   │   │   └── index.ts
│   │   │   └── feedback/             # User feedback components
│   │   │       ├── toast.tsx
│   │   │       ├── skeleton.tsx
│   │   │       └── index.ts
│   │   ├── features/                 # Feature-scoped screen fragments & components
│   │   │   ├── auth/
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── index.ts
│   │   │   ├── customers/
│   │   │   │   ├── customer-list-item.tsx
│   │   │   │   ├── customer-detail-card.tsx
│   │   │   │   └── index.ts
│   │   │   ├── sales/
│   │   │   ├── tasks/
│   │   │   └── notifications/
│   │   └── layouts/                  # Layout wrappers
│   │       ├── safe-area-layout.tsx
│   │       ├── auth-layout.tsx
│   │       └── index.ts
│   │
│   ├── shared/                       # 🔷 CROSS-CUTTING CONCERNS
│   │   ├── constants/                # App-wide constants
│   │   │   ├── api.constants.ts      # API base URL, endpoints, timeouts
│   │   │   ├── storage-keys.constants.ts
│   │   │   ├── query-keys.constants.ts
│   │   │   └── index.ts
│   │   ├── config/                   # Environment & app configuration
│   │   │   ├── env.config.ts
│   │   │   └── index.ts
│   │   ├── hooks/                    # Shared utility hooks
│   │   │   ├── use-debounce.ts
│   │   │   ├── use-refresh.ts
│   │   │   ├── use-network-status.ts
│   │   │   └── index.ts
│   │   ├── utils/                    # Pure utility functions
│   │   │   ├── format-date.ts
│   │   │   ├── format-currency.ts
│   │   │   ├── string.utils.ts
│   │   │   └── index.ts
│   │   ├── i18n/                     # Internationalization (Spanish user-facing strings)
│   │   │   ├── es.ts                 # Spanish translations dictionary
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── providers/                # Global providers composition
│   │       ├── app-providers.tsx      # Composes all providers in correct order
│   │       ├── query-provider.tsx
│   │       ├── theme-provider.tsx
│   │       └── index.ts
│   │
│   ├── stores/                       # 🔷 ZUSTAND STORES — Client state
│   │   ├── auth.store.ts             # Auth session, tokens, user profile
│   │   ├── theme.store.ts            # Theme preference (light/dark/system)
│   │   ├── app.store.ts              # General app state (onboarding, etc.)
│   │   └── index.ts
│   │
│   └── theme/                        # 🔷 THEMING SYSTEM
│       ├── palette.ts                # THE single source of color values (light & dark tokens)
│       ├── typography.ts             # Font families, sizes, weights
│       ├── spacing.ts                # Spacing scale
│       ├── shadows.ts                # Shadow definitions per platform
│       └── index.ts
│
├── assets/                           # Static assets
│   ├── fonts/
│   ├── images/
│   └── icons/
│
├── docs/                             # Project documentation
│   ├── architecture.md
│   ├── theming.md
│   ├── api-integration.md
│   └── decisions/                    # ADRs
│
├── __tests__/                        # Test files (mirrors src/ structure)
│   ├── core/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│
├── global.css                        # NativeWind global styles & CSS variables
├── tailwind.config.js                # Tailwind / NativeWind configuration
├── metro.config.js                   # Metro bundler with NativeWind integration
├── nativewind-env.d.ts               # TypeScript className prop declaration
├── app.json                          # Expo configuration
├── tsconfig.json                     # Strict TypeScript configuration
├── eslint.config.mjs                 # ESLint flat config (mirrors backend style)
├── .prettierrc                       # Prettier configuration (matches backend)
├── .env                              # Environment variables (git-ignored)
├── .env.example                      # Environment template
├── .gitignore
├── package.json
└── README.md
```

> **Important**: Do NOT create every directory upfront. Create only directories and files that are needed for the current feature. Empty directories and speculative abstractions are prohibited.

---

## 4. Theming System — Global Colors & Dark/Light Mode

### 4.1 Color Architecture

All color VALUES live in ONE file: `src/theme/palette.ts` (HSL triplets for `light` and `dark`). Changing a color there updates the whole app. `global.css` holds no colors and `tailwind.config.js` only lists token names (`hsl(var(--token) / <alpha-value>)`).

Colors are organized as **semantic design tokens**, NOT raw hex values scattered across components.

```text
palette.ts → ThemeProvider (NativeWind vars() on the root view) → CSS variables → NativeWind classes
           → useThemeColors() (resolved values for icons, StatusBar, navigation, sheets)
```

A test (`__tests__/theme/palette.test.ts`) checks both schemes define the same tokens and that `tailwind.config.js` references exactly the palette tokens. See `docs/theming.md`.

### 4.2 Color Palette — Elegant & Professional

The app uses a refined, professional palette. Colors must look excellent in BOTH light and dark themes.

**Color categories:**

- `primary` — Main brand action color (deep blue / navy tones)
- `secondary` — Complementary accent (warm amber / gold tones)
- `background` — Page and surface backgrounds
- `foreground` — Text and icon colors
- `muted` — Subdued backgrounds for cards and sections
- `destructive` — Error and danger states
- `success` — Confirmation and positive states
- `warning` — Caution states
- `border` — Subtle dividers and outlines
- `ring` — Focus ring indicator
- `card` — Card surface color
- `popover` — Overlay surface color
- `input` — Input field background

### 4.3 Theme Toggle

The app supports three modes: `light`, `dark`, and `system`.

- The theme store keeps only the preference and applies it with NativeWind `colorScheme.set()`.
- Read the effective scheme reactively with `useAppColorScheme()`; NEVER with `Appearance.getColorScheme()` (it does not re-render).
- Persist user preference in MMKV via the Zustand theme store.
- Prevent theme flicker on app launch by hydrating the store before initial render.
- Prefer semantic classes over `dark:` variants: the variables already change per scheme.

### 4.4 Rules

- NEVER hardcode hex/rgb/hsl values in `app/` or `src/presentation/` (ESLint `no-restricted-syntax` fails the build).
- ALWAYS use NativeWind utility classes referencing semantic tokens (e.g., `bg-background`, `text-foreground`, `border-border`, `bg-primary/10`).
- If a color is needed in JavaScript (icons, Reanimated, native props), use `useThemeColors()` / `useThemeColorWithAlpha()` from `@/theme`.
- Both light and dark palettes must be visually harmonious and pass accessibility contrast standards (WCAG AA minimum).

---

## 5. Language Policy — Code in English, UI in Spanish

### All Technical Implementation — English Only

This applies to:

- Source code (variables, functions, classes, interfaces, types, enums)
- File and folder names
- Constants, hooks, stores, schemas
- Comments and JSDoc
- Test names and test descriptions
- Documentation (Markdown, ADRs)
- Error codes and internal log messages
- Git commit messages

### All User-Facing Content — Spanish Only

This applies to:

- Screen titles, labels, descriptions, placeholders
- Button text, menu items, tab labels
- Error messages shown to users
- Toast notifications, alerts, confirmations
- Empty state messages, loading messages
- Onboarding text, help text

### Implementation

All user-facing strings MUST live in `src/shared/i18n/es.ts` as a typed, centralized dictionary.

Components must NEVER contain inline Spanish strings. Always reference the translations dictionary.

```typescript
// ✅ CORRECT
<Text>{t('customers.emptyState')}</Text>

// ❌ WRONG
<Text>No hay clientes</Text>
```

---

## 6. TypeScript — Zero `any`

`any` is strictly forbidden across the entire codebase.

This applies to:

- Component props
- Hook parameters and return types
- Store state and actions
- API response handling
- Error handling (`unknown` with narrowing)
- Zod schemas and inferred types
- Event handlers
- Navigation parameters
- Utility functions
- Test code

Prefer:

- Explicit types and interfaces
- Generics
- Zod inference (`z.infer<typeof schema>`)
- Discriminated unions
- `unknown` with type guards
- `satisfies` operator for type-safe literal objects
- Mapped and conditional types when appropriate

---

## 7. State Management Strategy

### Server State — TanStack Query

Use `@tanstack/react-query` for ALL server-origin data:

- API data fetching, caching, background refresh
- Optimistic updates for mutations
- Pagination and infinite scrolling
- Error and loading state management
- Prefetching for anticipated navigations

**Rules:**
- Define query keys in `src/shared/constants/query-keys.constants.ts`.
- Use query key factories for parameterized queries.
- Configure stale time, cache time, and retry strategies per-query type.
- Use `useMutation` with proper `onSuccess`, `onError`, and cache invalidation.

### Client State — Zustand

Use `zustand` for local, synchronous, non-server state:

- Authentication session (token, user profile, login state)
- Theme preference (light / dark / system)
- UI state (selected filters, active tab, bottom sheet state)
- Onboarding / first-launch flags

**Rules:**
- One store per bounded context (auth, theme, app).
- Persist appropriate slices using `zustand/middleware` with the MMKV storage adapter.
- Handle hydration properly to prevent initial state flicker.
- NEVER store API-fetched data in Zustand — that belongs in TanStack Query.

---

## 8. Error Handling — Centralized & Typed

### Domain Errors

Define a base `DomainError` abstract class in `src/core/errors/domain.error.ts` mirroring the backend pattern:

```typescript
export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

### API Error Handling

- The API client interceptor must catch HTTP errors and map them to typed domain errors.
- The global error boundary (`ErrorBoundary` component) must catch unhandled rendering errors.
- TanStack Query `onError` callbacks handle query/mutation failures with user-facing toasts.
- NEVER swallow errors silently. Always log + notify.

### Error Codes

Use stable string error codes matching the backend convention:

```text
AUTH_TOKEN_EXPIRED
AUTH_INVALID_CREDENTIALS
NETWORK_UNAVAILABLE
CUSTOMER_NOT_FOUND
ORDER_CREATION_FAILED
VALIDATION_ERROR
UNKNOWN_ERROR
```

### Unknown Errors

All catch blocks must type errors as `unknown` and narrow before accessing properties:

```typescript
// ✅ CORRECT
catch (error: unknown) {
  if (error instanceof DomainError) {
    showToast(error.message);
  } else {
    logger.error('Unexpected error', { error });
    showToast(t('errors.unexpected'));
  }
}

// ❌ FORBIDDEN
catch (error: any) { ... }
```

---

## 9. API Integration

### API Client

- Use a single, pre-configured HTTP client instance (Axios or fetch wrapper) in `src/infrastructure/api/client/`.
- Attach the JWT access token via request interceptor.
- Implement automatic token refresh on 401 responses.
- Handle network errors gracefully with user-facing Spanish messages.
- Set reasonable timeouts (default: 15 seconds).
- Log API calls in development mode only.

### DTOs

- Raw API DTOs live in `src/infrastructure/api/dto/`.
- DTOs MUST match the backend API contract exactly.
- Use mappers in `src/application/mappers/` to transform DTOs into domain entities.
- NEVER expose raw DTOs directly to UI components.

### Request/Response Flow

```text
Component → Hook → Port(Interface) → API Adapter → HTTP Client → Backend API
                                                         ↓
Component ← Hook ← Mapper(DTO→Entity) ← API Adapter ← Response
```

---

## 10. Forms & Validation

### Zod Schemas

- Define validation schemas in `src/application/schemas/`.
- Derive TypeScript types from schemas using `z.infer<>`.
- Share validation logic between form validation and API request construction.

### React Hook Form

- Use `react-hook-form` with `@hookform/resolvers/zod` for all forms.
- Keep form logic in custom hooks, NOT in screen components.
- Validation error messages MUST be in Spanish (user-facing).

---

## 11. Storage & Security

### Sensitive Data — `expo-secure-store`

Store ONLY in SecureStore:
- JWT access tokens
- JWT refresh tokens
- User credentials (if remember-me)
- API keys

### Non-Sensitive Data — `react-native-mmkv`

Store in MMKV:
- Theme preference
- Onboarding completion flag
- Cached filter selections
- Non-sensitive user preferences
- Zustand persisted state

### Rules

- NEVER store tokens in MMKV.
- NEVER store tokens in AsyncStorage.
- NEVER log tokens, passwords, or secrets.
- Always clear sensitive storage on logout.

---

## 12. Navigation — Expo Router

### Route Organization

- `app/` directory is the navigation tree (file-system routing).
- Use route groups `(auth)`, `(tabs)` to separate authenticated and unauthenticated flows.
- Implement authentication guards in the root `_layout.tsx`.
- Use typed route parameters with `expo-router`'s type-safe APIs.
- Define route constants in `src/shared/constants/` for programmatic navigation.

### Rules

- Screens must be thin — delegate business logic to hooks.
- Screens must NOT directly call API services.
- Deep linking paths should be predictable and RESTful.

---

## 13. Components & Design System

### Component Principles

- **Atomic Design**: Build from smallest (Button, Input) → composed (CustomerCard, OrderSummary).
- **Props-driven**: Components receive data and callbacks via props. No internal data fetching in UI primitives.
- **Accessible**: All interactive elements must have accessibility labels in Spanish.
- **Typed**: Every component must have explicit TypeScript prop interfaces.

### NativeWind Usage

- Use utility-first classes for styling.
- Extract repeated class patterns using Tailwind `@apply` in `global.css` or via component composition.
- Use `cva` (class-variance-authority) or NativeWind variants for component variants (size, color, state).
- NEVER use inline `style` objects when NativeWind can express the styling.
- Exception: dynamic/animated styles from Reanimated.

### react-native-reusables

- Install and configure components through the CLI: `npx @react-native-reusables/cli@latest`.
- Components are copied into your project under `src/presentation/components/ui/`.
- Customize them to match the app's design tokens.

---

## 14. Lists & Performance

- Use `@shopify/flash-list` for ALL scrollable lists.
- Provide accurate `estimatedItemSize` for optimal recycling.
- Avoid anonymous inline functions in `renderItem` — extract as named components.
- Implement pull-to-refresh via TanStack Query's refetch.
- Use `onEndReached` with TanStack Query's infinite queries for pagination.
- Memoize list items with `React.memo` when appropriate.

---

## 15. Animations

- Use `react-native-reanimated` for all animations.
- Prefer `useAnimatedStyle`, `withTiming`, `withSpring` for declarative animations.
- Implement entering/exiting animations for list items and screen transitions.
- Use `expo-haptics` to provide tactile feedback on important interactions (submit, delete, toggle).
- Keep animations subtle and purposeful — not decorative clutter.

---

## 16. ESLint & Prettier — Mandatory

### ESLint Configuration

Mirror the backend's approach with a flat config (`eslint.config.mjs`):

- `@typescript-eslint/no-explicit-any`: `error`
- `@typescript-eslint/no-unused-vars`: `error` (with `_` prefix ignore pattern)
- `prettier/prettier`: integrated as ESLint rule
- React Native specific rules via `eslint-plugin-react-native`
- Import ordering rules for clean imports

### Prettier Configuration

Match the backend's `.prettierrc`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "endOfLine": "auto"
}
```

### Rules

- NEVER disable lint rules to suppress errors.
- NEVER use `// @ts-ignore` or `// @ts-expect-error` without an accompanying explanatory comment and a linked issue.
- Run formatting and linting as final validation, not after every single edit.

---

## 17. Testing Strategy

### Unit Tests

- Domain entities, value objects, utility functions.
- Mappers (DTO → Entity transformations).
- Zustand stores (state transitions, actions).
- Custom hooks (with `@testing-library/react-hooks` or `renderHook`).

### Integration Tests

- API service adapters (with MSW or mocked HTTP).
- Form submission flows.
- Navigation guard behavior.

### Component Tests

- Critical UI components with `@testing-library/react-native`.
- User interaction flows (press, type, scroll).
- Accessibility compliance.

### Rules

- Test names and descriptions in English.
- Arrange-Act-Assert pattern.
- Do NOT write tests solely to increase coverage numbers.
- Mock at the port/interface boundary, NOT at the library level.
- Use factories for test data generation.

---

## 18. Documentation

### Required Documentation

- `docs/architecture.md` — System architecture overview, dependency diagram, layer responsibilities.
- `docs/theming.md` — Color token catalog, theme toggle behavior, adding new tokens.
- `docs/api-integration.md` — API client setup, authentication flow, error mapping.
- `docs/decisions/` — ADRs for significant architectural decisions.

### When to Update

Update documentation when a feature introduces:

- A new module or feature area
- A new screen or navigation flow
- A new API integration pattern
- A new infrastructure adapter
- A non-obvious architectural decision

### Rules

- Keep documentation concise and developer-focused.
- Do NOT paste large code blocks into docs — reference file paths instead.
- All documentation written in English.

---

## 19. SOLID Principles

### Single Responsibility

- Each file, component, hook, and class should have ONE clear purpose.
- Screens orchestrate; hooks manage logic; components render UI.

### Open/Closed

- Extend via composition, not modification.
- New features add new files; existing files change minimally.

### Liskov Substitution

- Infrastructure adapters must be interchangeable through their port interface.
- A `MockAuthRepository` must work identically to `ApiAuthRepository` from the consumer's perspective.

### Interface Segregation

- Ports should be focused. Do NOT create a single massive `IRepository` with 30 methods.
- Split into `IAuthRepository`, `ICustomerRepository`, etc.

### Dependency Inversion

- Hooks depend on port interfaces, NOT concrete implementations.
- Infrastructure adapters are injected via React Context providers or factory functions.

---

## 20. Design Patterns — Use Purposefully

Apply design patterns ONLY when they solve a real problem:

| Pattern | When to Use |
| :--- | :--- |
| **Repository** | Abstracting data access (API, local DB, cache) behind a port interface |
| **Adapter** | Wrapping third-party libraries (MMKV, SecureStore, Axios) to isolate dependencies |
| **Mapper** | Transforming between layers (API DTO → Domain Entity → View Model) |
| **Factory** | Creating complex objects or test data consistently |
| **Observer** | Reacting to state changes (Zustand subscriptions, Query observers) |
| **Strategy** | Swappable behaviors (different API environments, different storage backends) |
| **Composition** | Building complex components from simpler primitives |
| **Provider** | Supplying dependencies via React Context at the composition root |

Do NOT introduce patterns for hypothetical future needs. Each pattern must solve a current, real problem.

---

## 21. Reuse & Shared Code

### What SHOULD Be Shared (`src/shared/`)

- Constants (API URLs, storage keys, query keys)
- Utility functions (date formatting, currency formatting, string helpers)
- Generic hooks (debounce, network status, refresh control)
- Provider composition
- i18n translations
- Configuration

### What Should NOT Be Shared

- Feature-specific components (keep in `src/presentation/features/<feature>/`)
- Feature-specific hooks (keep in `src/application/hooks/<feature>/`)
- Feature-specific schemas (keep in `src/application/schemas/`)

### Promotion Rule

Only promote code to `shared/` when it is genuinely used by three or more features AND the abstraction is stable.

---

## 22. Avoid Overengineering

Do NOT introduce:

- Redux, MobX, or other state managers alongside Zustand
- GraphQL client if the API is REST
- Another offline database or sync library: the app already is offline-first with expo-sqlite + Drizzle + outbox (ADR 0003)
- Complex DI containers (the React Context + factory pattern is sufficient)
- Microservice-like architecture within the mobile app
- Generic abstractions with no current consumer

Build the simplest correct solution that remains extensible.

---

## 23. Dependency Management

### Before Adding Any Library

1. Check if the functionality already exists in Expo SDK or the current stack.
2. Verify compatibility with the current Expo SDK version.
3. Prefer Expo-managed packages when available.
4. Verify the package supports the New Architecture (Fabric/TurboModules).
5. Check maintenance status and community activity.

### Rules

- Do NOT install competing libraries for the same purpose.
- Do NOT upgrade unrelated packages during feature work.
- Do NOT install packages globally that should be project-local.
- Use `npx expo install` for Expo-compatible packages (ensures version compatibility).

---

## 24. Production Safety

Before declaring a feature complete, verify:

- No hardcoded API URLs (use environment configuration).
- No secrets or tokens in source code.
- No `console.log` in production code (use a logger with level control).
- No sensitive data in error messages shown to users.
- No unnecessary permissions requested.
- No memory leaks (subscription cleanup, event listener removal).
- Error boundaries catch and report rendering crashes.
- Network failures show user-friendly Spanish messages.
- Loading and empty states are handled for every data-driven screen.
- Keyboard avoidance works correctly on all forms.
- Safe area insets are respected on all screens.

---

## 25. Validation Commands

At the end of every feature implementation, run:

```bash
npx expo-doctor                  # Dependency compatibility check
npm run lint                     # ESLint validation
npm run lint:fix                 # Auto-fix lint issues
npx prettier --check "src/**/*" # Formatting check
npx tsc --noEmit                # TypeScript type checking
npm run test                    # Run test suite
npx expo start                  # Verify app launches without crash
```

Run only commands that exist in the project's `package.json` scripts.

---

## 26. Final Verification Checklist

Before declaring any feature complete:

- [ ] Hexagonal dependency direction preserved (no screen → API client, no hook → concrete adapter).
- [ ] Screens are thin — logic lives in hooks.
- [ ] All user-facing text is in Spanish and referenced from `i18n/es.ts`.
- [ ] All technical code is in English.
- [ ] No `any` exists in new or modified code.
- [ ] All colors use semantic tokens — no hardcoded values.
- [ ] Dark and light themes render correctly.
- [ ] Error states handled with user-friendly Spanish messages.
- [ ] Loading states and empty states implemented.
- [ ] Forms validated with Zod schemas.
- [ ] Tokens stored in SecureStore, not MMKV.
- [ ] ESLint passes.
- [ ] Prettier formatting passes.
- [ ] TypeScript type-check passes.
- [ ] Relevant tests pass.
- [ ] Documentation updated.
- [ ] No unnecessary dependencies added.
- [ ] No unrelated files changed.
- [ ] Pull-to-refresh works where applicable.
- [ ] Keyboard handling works on all forms.
- [ ] Safe area insets respected.
- [ ] Accessibility labels present on interactive elements.

---

## 27. Final Response Required

When a feature is complete, report:

1. **What was implemented** — Feature summary.
2. **Files created or modified** — File list.
3. **Screens added** — New navigation routes.
4. **API integrations** — Endpoints consumed.
5. **State management** — Stores or queries added/modified.
6. **Tests** — Tests added or updated.
7. **Documentation** — Docs updated.
8. **Validation** — Commands executed and results.
9. **Architectural notes** — Any important decisions.
10. **Follow-ups** — Genuinely out-of-scope items.

Do not claim success without running the applicable validation commands.

---

## 28. Permanent Quality Goal

Every new feature must leave the mobile app:

**cleaner to understand + easier to test + strongly typed + decoupled + visually polished + accessible + documented + production-ready + consistent with the existing architecture.**
