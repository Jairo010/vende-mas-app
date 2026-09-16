import { ENV } from '@/shared/config/env.config';

export const API_BASE_URL = ENV.API_BASE_URL;

export const API_TIMEOUT_MS = 15_000;

export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    refreshToken: '/api/v1/auth/refresh-token',
    profile: '/api/v1/auth/profile',
  },
  customers: {
    list: '/api/v1/customers',
    detail: (id: string) => `/api/v1/customers/${id}`,
  },
  tasks: {
    list: '/api/v1/tasks',
    detail: (id: string) => `/api/v1/tasks/${id}`,
  },
  sales: {
    orders: '/api/v1/orders',
    orderDetail: (id: string) => `/api/v1/orders/${id}`,
  },
  notifications: {
    inbox: '/api/v1/notifications/inbox',
    unreadCount: '/api/v1/notifications/unread-count',
  },
} as const;
