import { useQuery } from '@tanstack/react-query';
import type { VisitEntity } from '@/core/entities/visit.entity';
import type { IVisitRepositoryPort } from '@/core/ports/visit.repository.port';
import { sqliteVisitRepository } from '@/infrastructure/database/repositories/sqlite-visit.repository';
import { visitsKeys } from './visits.keys';

const HISTORY_LIMIT = 30;

/** Visit history of a customer, most recent first. */
export function useCustomerVisits(
  customerId: string | undefined,
  repository: IVisitRepositoryPort = sqliteVisitRepository,
) {
  const query = useQuery<VisitEntity[], Error>({
    queryKey: visitsKeys.byCustomer(customerId ?? ''),
    queryFn: () => repository.findByCustomer(customerId as string, HISTORY_LIMIT),
    enabled: Boolean(customerId),
  });

  return { visits: query.data ?? [], isLoading: query.isLoading };
}
