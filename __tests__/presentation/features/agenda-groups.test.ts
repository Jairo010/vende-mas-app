import { VisitEntity, type VisitProps } from '@/core/entities/visit.entity';
import { groupVisitsByType } from '@/presentation/features/agenda/agenda-groups';

function visit(overrides: Partial<VisitProps> & Pick<VisitProps, 'id'>): VisitEntity {
  return VisitEntity.create({
    type: 'ORDER',
    status: 'SCHEDULED',
    outcome: null,
    scheduledAt: '2026-10-14T05:00:00.000Z',
    hasScheduledTime: false,
    notes: null,
    start: null,
    end: null,
    distanceToCustomerMeters: null,
    durationMinutes: null,
    photoUrl: null,
    photoLocalUri: null,
    cancellationReason: null,
    sellerId: 'seller-1',
    sellerName: null,
    createdById: 'seller-1',
    customerId: 'customer-1',
    parentVisitId: null,
    customer: null,
    syncStatus: 'SYNCED',
    createdAt: '2026-10-14T12:00:00.000Z',
    updatedAt: '2026-10-14T12:00:00.000Z',
    ...overrides,
  });
}

const customer = (tradeName: string) => ({
  id: tradeName,
  tradeName,
  status: 'ACTIVE' as const,
  contactName: null,
  phone: null,
  address: null,
  latitude: null,
  longitude: null,
  storePhotoUrl: null,
});

describe('groupVisitsByType', () => {
  it('groups by type in a fixed order and leaves empty types out', () => {
    const groups = groupVisitsByType([
      visit({ id: 'c1', type: 'COLLECTION' }),
      visit({ id: 'o1', type: 'OPPORTUNITY' }),
      visit({ id: 'c2', type: 'COLLECTION', status: 'COMPLETED' }),
    ]);

    expect(groups.map((group) => group.type)).toEqual(['OPPORTUNITY', 'COLLECTION']);
    expect(groups[1]).toMatchObject({ done: 1 });
    expect(groups[1]?.visits).toHaveLength(2);
  });

  it('shows pending visits first: agreed times in order, then the day-only ones by customer', () => {
    const [group] = groupVisitsByType([
      visit({ id: 'done', status: 'COMPLETED' }),
      visit({ id: 'zeta', customer: customer('Zeta') }),
      visit({ id: 'late', hasScheduledTime: true, scheduledAt: '2026-10-14T20:00:00.000Z' }),
      visit({ id: 'alfa', customer: customer('Alfa') }),
      visit({ id: 'early', hasScheduledTime: true, scheduledAt: '2026-10-14T14:00:00.000Z' }),
      visit({ id: 'now', status: 'IN_PROGRESS' }),
    ]);

    expect(group?.visits.map((item) => item.id)).toEqual([
      'now',
      'early',
      'late',
      'alfa',
      'zeta',
      'done',
    ]);
  });
});
