import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';

export interface CatalogProduct {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  stock: number;
  category?: string;
  photoUrl?: string | null;
}

const DEFAULT_PRODUCTS: CatalogProduct[] = [
  {
    id: 'prod_01',
    code: 'AB-101',
    name: 'Aceite Vegetal Palma Real 1L',
    unitPrice: 2.25,
    stock: 140,
    category: 'Abarrotes',
  },
  {
    id: 'prod_02',
    code: 'AB-102',
    name: 'Arroz Extra Flor 5Kg',
    unitPrice: 4.8,
    stock: 95,
    category: 'Granos',
  },
  {
    id: 'prod_03',
    code: 'AB-103',
    name: 'Azúcar Blanca Refinada 2Kg',
    unitPrice: 1.9,
    stock: 210,
    category: 'Abarrotes',
  },
  {
    id: 'prod_04',
    code: 'LA-201',
    name: 'Leche Entera UHT 1L (Pack 6)',
    unitPrice: 5.4,
    stock: 60,
    category: 'Lácteos',
  },
  {
    id: 'prod_05',
    code: 'BE-301',
    name: 'Bebida Energizante Max 500ml',
    unitPrice: 1.5,
    stock: 80,
    category: 'Bebidas',
  },
];

export function useProducts(search?: string) {
  const query = search?.trim().toLowerCase();

  return useQuery<CatalogProduct[]>({
    queryKey: ['products', 'list', query ?? ''],
    queryFn: async () => {
      try {
        const response = await apiClient.get<unknown>(API_ENDPOINTS.products.list, {
          params: query ? { search: query } : undefined,
        });

        const raw = response.data as Record<string, unknown>;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? (raw.data as unknown[])
            : null;

        if (list && list.length > 0) {
          return list.map((item) => {
            const p = item as Record<string, unknown>;
            return {
              id: String(p.id || ''),
              code: String(p.code || p.sku || 'PROD'),
              name: String(p.name || ''),
              unitPrice: Number(p.unitPrice ?? p.price ?? 0),
              stock: Number(p.stock ?? 0),
              category: p.category ? String(p.category) : undefined,
              photoUrl: p.photoUrl ? String(p.photoUrl) : null,
            };
          });
        }
      } catch {
        // Fall back to default catalog items
      }

      if (!query) return DEFAULT_PRODUCTS;
      return DEFAULT_PRODUCTS.filter(
        (p) => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query),
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}
