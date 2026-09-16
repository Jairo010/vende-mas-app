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
import type { ApiResponse } from '@/core/types/api.types';
import type { AuthTokens } from '@/core/types/auth.types';

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
    async (error: AxiosError<{ message?: string; statusCode?: number; errors?: unknown }>) => {
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

          const refreshResponse = await axios.post<ApiResponse<AuthTokens>>(
            `${API_BASE_URL}${API_ENDPOINTS.auth.refreshToken}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            },
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            refreshResponse.data.data;

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
          return Promise.reject(
            new UnauthorizedError('Sesión expirada. Por favor inicia sesión nuevamente.'),
          );
        } finally {
          isRefreshing = false;
        }
      }

      // Map other status codes to typed domain errors
      const errorMessage = error.response.data?.message || error.message;

      if (status === 404) {
        return Promise.reject(new NotFoundError(errorMessage));
      }

      if (status === 422 || status === 400) {
        return Promise.reject(new ValidationError(errorMessage, error.response.data?.errors));
      }

      return Promise.reject(
        new (class HttpError extends DomainError {
          public readonly code = `HTTP_${status}`;
        })(errorMessage, status, error.response.data),
      );
    },
  );
}
