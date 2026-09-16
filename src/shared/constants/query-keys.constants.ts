export const QUERY_KEYS = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (params?: Record<string, unknown>) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (params?: Record<string, unknown>) => ['tasks', 'list', params] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  sales: {
    orders: ['sales', 'orders'] as const,
    orderDetail: (id: string) => ['sales', 'orders', id] as const,
  },
  notifications: {
    inbox: (params?: Record<string, unknown>) => ['notifications', 'inbox', params] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
} as const;
