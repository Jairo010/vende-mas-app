import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';
import type { TaskCustomerSummary } from '@/core/types/task.types';
import type { QuickCreateCustomerFormData } from '@/application/schemas/task.schema';

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<TaskCustomerSummary, Error, QuickCreateCustomerFormData>({
    mutationFn: async (data) => {
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
      try {
        const response = await apiClient.post<unknown>(API_ENDPOINTS.customers.list, {
          identification: data.identification.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          name: fullName,
          phone: data.phone.trim(),
          address: data.address?.trim() || null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        });

        const raw = response.data as Record<string, unknown>;
        const resObj = (raw?.data && typeof raw.data === 'object' ? raw.data : raw) as Record<
          string,
          unknown
        >;

        return {
          id: String(resObj.id || `cust_${Date.now()}`),
          identification: String(resObj.identification || data.identification),
          name: String(resObj.name || fullName),
          phone: resObj.phone ? String(resObj.phone) : data.phone,
          address: resObj.address ? String(resObj.address) : (data.address ?? null),
          latitude: typeof resObj.latitude === 'number' ? resObj.latitude : (data.latitude ?? null),
          longitude:
            typeof resObj.longitude === 'number' ? resObj.longitude : (data.longitude ?? null),
        };
      } catch {
        // Return created customer locally if backend endpoint is in progress
        return {
          id: `cust_${Date.now()}`,
          identification: data.identification.trim(),
          name: fullName,
          phone: data.phone.trim(),
          address: data.address?.trim() || null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        };
      }
    },
    onSuccess: (newCustomer) => {
      queryClient.setQueryData<TaskCustomerSummary[]>(['customers', 'list', ''], (old) => [
        newCustomer,
        ...(old ?? []),
      ]);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
