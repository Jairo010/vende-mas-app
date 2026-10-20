# 0001. Mobile Authentication, Secure Token Storage, and Transparent Session Refresh

- **Status**: Accepted
- **Date**: 2026-09-16
- **Authors**: Vende Más Mobile Core Architecture Team

---

## Context

The **Vende Más Mobile Application** serves field sales representatives and commercial administrators operating in dynamic, often unstable network environments. Key operational requirements include:

1. **Uninterrupted User Experience**: Sales reps creating orders or registering customer visits must not be arbitrarily logged out or interrupted with login modals during daily field operations when access tokens expire.
2. **Strict Security Compliance**: Access and refresh tokens are high-value credentials that must be protected against device theft, extraction, and unauthorized inspection.
3. **Instant App Launch**: Session restoration upon app boot must be instant without visual flicker or jarring navigation redirects.
4. **Offline Capability & Role Enforcement**: Role-based access (e.g. `ADMIN` vs `SELLER`) and cached profile state must remain accessible even during intermittent network disconnections.

---

## Decision

We have adopted a multi-tier session management architecture combining hardware-backed encrypted storage, synchronous memory-mapped client state, and an Axios response interceptor token refresh queue:

### 1. Separation of Token Storage and Session State
- **Encrypted Storage (`ISecureStoragePort` -> `expo-secure-store`)**:
  - `accessToken` and `refreshToken` are stored exclusively in `expo-secure-store` (backed by iOS Keychain and Android KeyStore).
  - Tokens are never exposed in logs, unencrypted MMKV, or AsyncStorage.
- **Client Session State (`useAuthStore` -> Zustand + MMKV)**:
  - User identity (`id`, `email`, `name`, `role`, `isActive`) and flags (`isAuthenticated`, `isHydrated`) reside in a Zustand store.
  - Persisted synchronously to `react-native-mmkv` via `zustandMmkvStorage`, guaranteeing zero hydration flicker on app launch.

### 2. Automatic 401 Token Refresh Interceptor Queue
- Configured in `src/infrastructure/api/client/interceptors.ts`:
  - **Request Interceptor**: Injects `Authorization: Bearer <accessToken>` retrieved from SecureStore into every outgoing request.
  - **Response Interceptor**:
    - Intercepts `401 Unauthorized` responses.
    - If a refresh request is already pending, queues concurrent failed requests in a promise queue (`failedQueue`).
    - Executes `POST /api/v1/auth/refresh` with the stored `refreshToken`.
    - On success: updates both rotated tokens in SecureStore, resolves the `failedQueue`, and replays the original requests transparently.
    - On failure (revoked/expired refresh token): rejects queued requests, deletes secure tokens, calls `useAuthStore.getState().clearSession()`, and redirects to `/(auth)/login`.

### 3. Hexagonal Layer Isolation
- **Domain Layer (`src/core/`)**: Entity `AuthUserEntity`, domain types (`AuthTokens`, `AuthUser`, `AuthSession`, `LoginCredentials`), domain errors (`InvalidCredentialsError`, `AccountInactiveError`, `TokenExpiredError`), and port `IAuthRepositoryPort`. Pure TypeScript, zero React/Expo imports.
- **Infrastructure Layer (`src/infrastructure/`)**: `AuthApiService` implementing `IAuthRepositoryPort`, Axios interceptors, and DTO contracts.
- **Application Layer (`src/application/`)**: `AuthMapper`, Zod `loginSchema`, and use case hooks (`useLogin`, `useLogout`, `useAuthSession`).
- **Presentation Layer (`src/presentation/` & `app/`)**: Reusable UI primitives (`Button`, `Input`, `Card`, `LoadingSpinner`), feedback components (`AlertBanner`, `Toast`), layout wrappers (`AuthLayout`), and screen route (`app/(auth)/login.tsx`).

---

## Consequences

### Positive
- **Enterprise-Grade Security**: Native hardware keystores protect sensitive JWT tokens from filesystem inspection.
- **Zero UI Flicker**: MMKV provides instantaneous synchronous cache access on cold start, eliminating blank screens or layout jumps.
- **Transparent Field Reliability**: Sales representatives in the field experience uninterrupted workflow as short-lived access tokens rotate seamlessly in the background.
- **Testability & Maintainability**: Every layer is independently mockable and unit-testable at port boundaries without coupling to network or UI details.
- **Centralized Theming**: NativeWind v4 semantic tokens guarantee effortless support for Light and Dark modes.

### Negative / Trade-offs
- `expo-secure-store` calls are asynchronous, requiring asynchronous reads during interceptor request execution. However, local Keychain/KeyStore access latency (~5-15ms) is negligible relative to network requests.

---

## Alternatives Considered

1. **AsyncStorage for All State & Tokens**:
   - *Rejected*: Insecure. AsyncStorage stores data unencrypted in plain text on device storage. It also suffers from asynchronous serialization bottlenecks.
2. **Cookie-Based Sessions**:
   - *Rejected*: Not suitable for React Native cross-platform mobile apps interacting with REST APIs. Native cookie jar handling across iOS and Android introduces synchronization inconsistencies.
3. **Manual Re-authentication on 401**:
   - *Rejected*: Severely degrades user experience for sales reps in the field who would need to re-type passwords whenever short-lived JWT access tokens expire.
