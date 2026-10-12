import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';
import type { TaskCustomerSummary } from '@/core/types/task.types';

export interface UseCustomersFilters {
  search?: string;
}

const DEFAULT_CUSTOMERS: TaskCustomerSummary[] = [
  {
    id: 'cust_01',
    identification: '1723456789',
    name: 'Don Carlos Abarrotes',
    phone: '+593 99 123 4567',
    address: 'Av. 10 de Agosto y Colón, Quito',
    latitude: -0.180653,
    longitude: -78.467834,
  },
  {
    id: 'cust_02',
    identification: '1798765432001',
    name: 'Distribuidora Farmacéutica San José',
    phone: '+593 98 765 4321',
    address: 'Calle Guayaquil 456, Centro Histórico',
    latitude: -0.220164,
    longitude: -78.512327,
  },
  {
    id: 'cust_03',
    identification: '0912345678',
    name: 'Bodega Central El Porvenir',
    phone: '+593 97 555 9900',
    address: 'Av. de la Prensa N45-12, Norte',
    latitude: -0.145129,
    longitude: -78.489112,
  },
];

export function useCustomers(filters?: UseCustomersFilters) {
  const search = filters?.search?.trim().toLowerCase();

  return useQuery<TaskCustomerSummary[]>({
    queryKey: ['customers', 'list', search ?? ''],
    queryFn: async () => {
      try {
        const response = await apiClient.get<unknown>(API_ENDPOINTS.customers.list, {
          params: search ? { search } : undefined,
        });

        const raw = response.data as Record<string, unknown>;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? (raw.data as unknown[])
            : null;

        if (list && list.length > 0) {
          return list.map((item) => {
            const row = item as Record<string, unknown>;
            return {
              id: String(row.id || ''),
              identification: row.identification ? String(row.identification) : undefined,
              name: String(row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim()),
              phone: row.phone ? String(row.phone) : null,
              address: row.address ? String(row.address) : null,
              latitude: typeof row.latitude === 'number' ? row.latitude : null,
              longitude: typeof row.longitude === 'number' ? row.longitude : null,
            };
          });
        }
      } catch {
        // Fall back to offline seeded customers
      }

      if (!search) return DEFAULT_CUSTOMERS;
      return DEFAULT_CUSTOMERS.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.identification && c.identification.includes(search)),
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}
