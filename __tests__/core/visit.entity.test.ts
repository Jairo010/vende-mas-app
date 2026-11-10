import { isPostponedOn } from '@/application/route/route-plan';
import { VisitEntity, type VisitProps } from '@/core/entities/visit.entity';
import {
  VisitInvalidTransitionError,
  VisitNotesRequiredError,
  VisitOutcomeNotAllowedError,
} from '@/core/errors/visit.errors';
import { calculateOrderLine, calculateOrderTotals, roundMoney } from '@/core/value-objects/money';
import { distanceInMeters } from '@/core/value-objects/geo-distance';

function visit(overrides: Partial<VisitProps> = {}): VisitEntity {
  return VisitEntity.create({
    id: 'visit-1',
    type: 'OPPORTUNITY',
    status: 'SCHEDULED',
    outcome: null,
    scheduledAt: '2026-10-14T14:30:00.000Z',
    hasScheduledTime: true,
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

describe('VisitEntity come back later', () => {
  it('needs a check-in and notes', () => {
    const inProgress = visit({ status: 'IN_PROGRESS' });
    expect(inProgress.canPostpone()).toBe(true);
    expect(visit().canPostpone()).toBe(false);
    expect(() => visit().assertCanPostpone('Está ocupado')).toThrow(VisitInvalidTransitionError);
    expect(() => inProgress.assertCanPostpone('no')).toThrow(VisitNotesRequiredError);
    expect(() => inProgress.assertCanPostpone('Está ocupado')).not.toThrow();
  });

  it('counts only on the local day it was asked, and only while it is open', () => {
    // 23:30 in Ecuador on the 14th, already the 15th in UTC.
    const postponed = { postponedAt: '2026-10-15T04:30:00.000Z' };
    expect(isPostponedOn(visit(postponed), '2026-10-14')).toBe(true);
    expect(isPostponedOn(visit(postponed), '2026-10-15')).toBe(false);
    expect(isPostponedOn(visit(), '2026-10-14')).toBe(false);
    expect(isPostponedOn(visit({ ...postponed, status: 'COMPLETED' }), '2026-10-14')).toBe(false);
  });
});

describe('VisitEntity state machine', () => {
  it('allows SCHEDULED → IN_PROGRESS → COMPLETED', () => {
    expect(visit().canStart()).toBe(true);
    expect(visit({ status: 'IN_PROGRESS' }).canComplete()).toBe(true);
    expect(visit({ status: 'COMPLETED' }).isClosed()).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(() => visit({ status: 'COMPLETED' }).assertCanStart()).toThrow(
      VisitInvalidTransitionError,
    );
    expect(() => visit().assertCanComplete('INTERESTED')).toThrow(VisitInvalidTransitionError);
    expect(() => visit({ status: 'CANCELLED' }).assertCanCancel()).toThrow(
      VisitInvalidTransitionError,
    );
    expect(() => visit({ status: 'IN_PROGRESS' }).assertCanReschedule()).toThrow(
      VisitInvalidTransitionError,
    );
  });

  it('only accepts outcomes of its type', () => {
    const inProgress = visit({ status: 'IN_PROGRESS' });
    expect(() => inProgress.assertCanComplete('SALE_CLOSED')).not.toThrow();
    expect(() => inProgress.assertCanComplete('ORDER_TAKEN')).toThrow(VisitOutcomeNotAllowedError);
  });

  it('measures elapsed minutes since check-in', () => {
    const started = visit({
      status: 'IN_PROGRESS',
      start: { at: '2026-10-14T14:30:00.000Z', location: null },
    });
    expect(started.elapsedMinutes(new Date('2026-10-14T14:42:00.000Z'))).toBe(12);
    expect(visit().elapsedMinutes()).toBeNull();
  });
});

describe('money and distance value objects', () => {
  it('rounds to cents and computes IVA per line', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(calculateOrderLine(3, 3.25, 0.15)).toEqual({ totalPrice: 9.75, taxAmount: 1.46 });
    expect(
      calculateOrderTotals([
        { quantity: 12, unitPrice: 7.8, discount: 0, taxAmount: 14.04 },
        { quantity: 3, unitPrice: 3.25, discount: 0, taxAmount: 1.46 },
      ]),
    ).toEqual({ subtotal: 103.35, discountTotal: 0, taxTotal: 15.5, total: 118.85 });
  });

  it('computes haversine distances in meters', () => {
    const store = { latitude: -0.2799, longitude: -78.5446 };
    expect(distanceInMeters(store, store)).toBe(0);
    // ~0.001° of latitude ≈ 111 m
    expect(distanceInMeters(store, { latitude: -0.2809, longitude: -78.5446 })).toBeCloseTo(
      111,
      -1,
    );
  });
});
