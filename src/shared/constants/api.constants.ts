import { ENV } from '@/shared/config/env.config';

export const API_BASE_URL = ENV.API_BASE_URL;

export const API_TIMEOUT_MS = 15_000;

/**
 * Endpoints the app calls directly. Business data (visits, customers, orders, catalog)
 * travels only through the sync protocol (`sync.push` / `sync.pull`).
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
    me: '/api/v1/auth/me',
  },
  sync: {
    push: '/api/v1/sync/push',
    pull: '/api/v1/sync/pull',
    status: '/api/v1/sync/status',
  },
  files: {
    photos: '/api/v1/files/photos',
  },
  users: {
    list: '/api/v1/users',
  },
  customers: {
    lookup: '/api/v1/customers/lookup',
  },
} as const;
