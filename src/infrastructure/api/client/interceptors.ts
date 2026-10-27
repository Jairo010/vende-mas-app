import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { secureStorageAdapter } from '@/infrastructure/storage/secure-storage.adapter';
import { API_BASE_URL, API_ENDPOINTS } from '@/shared/constants/api.constants';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';
import {
  DomainError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/core/errors/domain.error';
import { CompanySuspendedError } from '@/core/errors/auth.errors';
import type { RefreshTokenResponseDto } from '@/infrastructure/api/dto/auth.dto';
import { type SignOutReason, useAuthStore } from '@/stores/auth.store';
import { unwrapApiData } from './unwrap-response';

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
  message?: string;
  errors?: unknown;
}

/** Any other HTTP failure (5xx included), keeping the API error code when there is one. */
export class HttpError extends DomainError {
  public readonly code: string;

  constructor(message: string, statusCode: number, apiCode?: string) {
    super(message, statusCode);
    this.code = apiCode ?? `HTTP_${statusCode}`;
  }
}

/** Sent with every request once the user chose where they work. */
export const ACTIVE_BRANCH_HEADER = 'X-Branch-Id';

/** API errors after which the session cannot continue. */
const SESSION_ENDING_CODES: Readonly<Record<string, SignOutReason>> = {
  COMPANY_SUSPENDED: 'COMPANY_SUSPENDED',
  BRANCH_NOT_ASSIGNED: 'BRANCH_REMOVED',
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function setupInterceptors(instance: AxiosInstance): void {
  // Request Interceptor: Attach Access Token
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const token = await secureStorageAdapter.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // The branch the seller works in: their records are assigned to it (API ADR 0022).
        const branchId = useAuthStore.getState().activeBranchId;
        if (branchId && config.headers) {
          config.headers[ACTIVE_BRANCH_HEADER] = branchId;
        }
      } catch {
        // Continue request without token if secure storage fails
      }
      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  // Response Interceptor: Handle Token Refresh and Error Mapping
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorBody>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Check if network error
      if (!error.response) {
        return Promise.reject(new NetworkError(error.message || 'Error de conexión'));
      }

      const status = error.response.status;

      // Handle 401 Unauthorized with token refresh
      if (status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await secureStorageAdapter.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            throw new UnauthorizedError('No hay token de refresco disponible');
          }

          const refreshResponse = await axios.post<unknown>(
            `${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`,
            { refreshToken },
          );
          // The API wraps it as { success, data }: reading the body as the tokens lost every
          // session when its access token expired.
          const tokenData = unwrapApiData<RefreshTokenResponseDto>(refreshResponse.data);

          const newAccessToken = tokenData.accessToken;
          const newRefreshToken = tokenData.refreshToken;

          if (!newAccessToken) {
            throw new UnauthorizedError('Token de acceso no devuelto por el servidor');
          }

          await secureStorageAdapter.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
          if (newRefreshToken) {
            await secureStorageAdapter.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }

          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return instance(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          await secureStorageAdapter.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
          await secureStorageAdapter.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
          useAuthStore.getState().clearSession('SESSION_EXPIRED');
          return Promise.reject(
            new UnauthorizedError('Sesión expirada. Por favor inicia sesión nuevamente.'),
          );
        } finally {
          isRefreshing = false;
        }
      }

      // Map other status codes to typed domain errors.
      // The API error envelope is { success: false, error: { code, message, details } }.
      const body = error.response.data;
      const errorMessage = body?.error?.message || body?.message || error.message;
      const details = body?.error?.details ?? body?.errors;

      // The company was suspended, or the branch the seller works in was taken from them, while
      // signed in: end the session (every request would fail) and say why on the login screen.
      const sessionEnd = SESSION_ENDING_CODES[body?.error?.code ?? ''];
      if (status === 403 && sessionEnd) {
        await secureStorageAdapter.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
        await secureStorageAdapter.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
        useAuthStore.getState().clearSession(sessionEnd);
        return Promise.reject(
          sessionEnd === 'COMPANY_SUSPENDED'
            ? new CompanySuspendedError()
            : new HttpError(errorMessage, status, body?.error?.code),
        );
      }

      if (status === 404) {
        return Promise.reject(new NotFoundError(errorMessage, details));
      }

      if (status === 422 || status === 400) {
        return Promise.reject(new ValidationError(errorMessage, details));
      }

      return Promise.reject(new HttpError(errorMessage, status, body?.error?.code));
    },
  );
}
