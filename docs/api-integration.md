# API Integration Guide — Vende Más Mobile

This document details the backend REST API integration contracts for the **Vende Más Mobile Application** connecting to `vende-mas-api` (NestJS).

---

## 1. Authentication Module (`/api/v1/auth`)

### 1.1 Endpoints Overview

| HTTP Method | Endpoint | Description | Auth Required | Request Payload | Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user credentials | No | `LoginRequestDto` | `LoginResponseDto` |
| `POST` | `/api/v1/auth/refresh` | Renew access token with token rotation | No (body token) | `RefreshTokenRequestDto` | `RefreshTokenResponseDto` |
| `POST` | `/api/v1/auth/logout` | Invalidate active server session | Yes (`Bearer`) | `{ refreshToken?: string }` | `LogoutResponseDto` |
| `GET` | `/api/v1/auth/me` | Retrieve authenticated user profile | Yes (`Bearer`) | None | `CurrentUserResponseDto` |

---

### 1.2 Request & Response Payloads

#### `POST /api/v1/auth/login`
Authenticates a field sales representative or administrator.

**Request Payload:**
```json
{
  "email": "vendedor@vendemas.com",
  "password": "SecretPassword123"
}
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Inicio de sesión exitoso",
  "data": {
    "userId": "usr_9a8b7c6d-5e4f",
    "email": "vendedor@vendemas.com",
    "name": "Carlos Mendoza",
    "role": "SELLER",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "expiresAt": "2026-09-16T21:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid email or password (`AUTH_INVALID_CREDENTIALS`).
- `403 Forbidden`: Account is inactive or suspended (`AUTH_ACCOUNT_INACTIVE`).
- `422 Unprocessable Entity`: Validation failure on email or password.

---

#### `POST /api/v1/auth/refresh`
Renews an expired access token using the rotated refresh token stored in hardware-backed secure storage.

**Request Payload:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Token renovado exitosamente",
  "data": {
    "userId": "usr_9a8b7c6d-5e4f",
    "email": "vendedor@vendemas.com",
    "name": "Carlos Mendoza",
    "role": "SELLER",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_access...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_refresh...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "expiresAt": "2026-09-16T22:00:00.000Z"
  }
}
```

---

#### `POST /api/v1/auth/logout`
Invalidates the active session and revokes server-side refresh tokens.

**Headers:**
`Authorization: Bearer <accessToken>`

**Request Payload (Optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Sesión cerrada exitosamente"
}
```

---

#### `GET /api/v1/auth/me`
Fetches the current user profile.

**Headers:**
`Authorization: Bearer <accessToken>`

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Perfil de usuario obtenido",
  "data": {
    "id": "usr_9a8b7c6d-5e4f",
    "email": "vendedor@vendemas.com",
    "name": "Carlos Mendoza",
    "role": "SELLER",
    "isActive": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-09-16T18:00:00.000Z"
  }
}
```

---

## 2. Token Refresh Queue & Interceptor Lifecycle

The mobile Axios client (`src/infrastructure/api/client/interceptors.ts`) handles automatic token lifecycle management:

1. **Request Phase**:
   - `secureStorageAdapter.getItem('access_token')` is read from `expo-secure-store`.
   - Injected into headers as `Authorization: Bearer <accessToken>`.

2. **401 Response Phase (Transparent Refresh)**:
   - When any authenticated request receives `HTTP 401 Unauthorized`:
     - If another refresh is already in flight (`isRefreshing === true`), the request is queued in `failedQueue`.
     - Otherwise, the interceptor marks `isRefreshing = true`, reads `refresh_token` from SecureStore, and calls `POST /api/v1/auth/refresh`.
     - On successful renewal:
       - Both rotated `accessToken` and `refreshToken` are updated in SecureStore.
       - All queued requests in `failedQueue` are resolved with the new token and re-executed.
     - On refresh failure (e.g. revoked or expired refresh token):
       - All queued requests are rejected.
       - Tokens are wiped from SecureStore.
       - `useAuthStore.getState().clearSession()` clears the client state.
       - The user is seamlessly transitioned to `/(auth)/login`.

---

## 3. Offline Sync (`/api/v1/sync`, `/api/v1/files`)

Business data (visits, customers, orders, catalog, promotions) is **not** read or written
with per-module REST calls. The app works on its local database and exchanges changes only
through the sync protocol (contract: `vende-mas-api/docs/sync-protocol.md`, app side:
`docs/decisions/0003-mobile-offline-first-sqlite-outbox.md`).

| Method | Endpoint | Used by | Request | Response (`data`) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sync/push` | `SyncApiService.push` | `{ operations: SyncPushOperationDto[] }` (1–100, in order) | `{ results[], summary }` |
| `GET` | `/api/v1/sync/pull?cursor=` | `SyncApiService.pull` | optional `cursor` | `SyncPullResponseDto` (visits, customers, orders, products, categories, promotions, `cursor`, `hasMore`) |
| `POST` | `/api/v1/files/photos` | `SyncApiService.uploadPhoto` | multipart `photo` + client `photoId` | `{ url, filename, mimeType, sizeBytes, alreadyExisted }` |
| `GET` | `/api/v1/files/photos/:filename` | `usePhotoSource` (images) | Bearer header | image stream |

Push operations supported: `CUSTOMER` CREATE / UPDATE / PROMOTE, `VISIT` SCHEDULE / START /
COMPLETE / RESCHEDULE / CANCEL, `ORDER` CREATE. Each `payload` is exactly the body of the
matching REST endpoint; the DTOs mirrored by the app live in `src/infrastructure/api/dto/`.

### Error envelope

Failed requests return `{ success: false, error: { code, message, details } }`. The Axios
interceptor maps them to typed domain errors (`NotFoundError`, `ValidationError`,
`HttpError` keeping the API `code`), and network failures to `NetworkError`, which the sync
engine treats as "offline, retry later".
