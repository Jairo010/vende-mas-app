import { dayRouteStops, reconcilePlan, withPostponedStops } from '@/application/route/route-plan';
import { VisitEntity, type VisitProps } from '@/core/entities/visit.entity';
import type { RoutePlan, RouteStop } from '@/core/types/route.types';

const DAY = '2026-10-14';
const point = (n: number) => ({ latitude: -0.2 - n / 100, longitude: -78.5 });
const stop = (n: number): RouteStop => ({ id: `v${n}`, point: point(n) });

const googlePlan = (...stops: number[]): RoutePlan => ({
  provider: 'GOOGLE',
  origin: point(0),
  legs: stops.map((n) => ({
    stopId: `v${n}`,
    point: point(n),
    distanceMeters: 1000,
    durationSeconds: 100,
  })),
  totalDistanceMeters: 1000 * stops.length,
  totalDurationSeconds: 100 * stops.length,
  encodedPolyline: null,
  computedAt: '2026-10-14T13:00:00.000Z',
});

const visit = (n: number, overrides: Partial<VisitProps> = {}): VisitEntity =>
  VisitEntity.create({
    id: `v${n}`,
    type: 'ORDER',
    status: 'SCHEDULED',
    outcome: null,
    scheduledAt: '2026-10-14T15:00:00.000Z',
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
    customerId: `c${n}`,
    parentVisitId: null,
    customer: {
      id: `c${n}`,
      tradeName: `Cliente ${n}`,
      status: 'ACTIVE',
      contactName: null,
      phone: null,
      address: null,
      ...point(n),
      storePhotoUrl: null,
    },
    syncStatus: 'SYNCED',
    createdAt: '2026-10-14T12:00:00.000Z',
    updatedAt: '2026-10-14T12:00:00.000Z',
    ...overrides,
  });

describe('dayRouteStops', () => {
  it('keeps the visits left for later today apart, the first asked first', () => {
    const { stops, postponed } = dayRouteStops(
      [
        visit(1),
        visit(2, { postponedAt: '2026-10-14T17:00:00.000Z' }),
        visit(3, { postponedAt: '2026-10-14T15:00:00.000Z' }),
      ],
      'seller-1',
      DAY,
    );

    expect(stops.map((item) => item.id)).toEqual(['v1']);
    expect(postponed.map((item) => item.id)).toEqual(['v3', 'v2']);
  });

  it('keeps a postponed visit last while it is being worked on', () => {
    const { stops, postponed } = dayRouteStops(
      [visit(2, { status: 'IN_PROGRESS', postponedAt: '2026-10-14T15:00:00.000Z' })],
      'seller-1',
      DAY,
    );

    expect(stops).toEqual([]);
    expect(postponed.map((item) => item.id)).toEqual(['v2']);
  });

  it('treats a visit postponed on another day as a regular stop', () => {
    const { stops, postponed } = dayRouteStops(
      [visit(2, { postponedAt: '2026-10-13T15:00:00.000Z' })],
      'seller-1',
      DAY,
    );

    expect(stops.map((item) => item.id)).toEqual(['v2']);
    expect(postponed).toEqual([]);
  });
});

describe('reconcilePlan', () => {
  it('trims the first stop when it leaves, without touching the rest', () => {
    const result = reconcilePlan(googlePlan(1, 2, 3), [stop(2), stop(3)]);

    expect(result.kind).toBe('trimmed');
    if (result.kind !== 'trimmed') return;
    expect(result.plan.legs.map((leg) => leg.stopId)).toEqual(['v2', 'v3']);
    expect(result.plan.provider).toBe('GOOGLE');
    expect(result.plan.origin).toEqual(point(1));
  });

  it('patches a gap on the device instead of asking the API again', () => {
    const result = reconcilePlan(googlePlan(1, 2, 3, 4), [stop(1), stop(3), stop(4)]);

    expect(result.kind).toBe('patched');
    if (result.kind !== 'patched') return;
    expect(result.plan.legs.map((leg) => leg.stopId)).toEqual(['v1', 'v3', 'v4']);
    expect(result.plan.provider).toBe('ESTIMATE');
    expect(result.plan.encodedPolyline).toBeNull();
    // Legs next to the gap are estimated; the others keep what the provider said.
    expect(result.plan.legs[0].distanceMeters).toBe(1000);
    expect(result.plan.legs[1].distanceMeters).not.toBe(1000);
    expect(result.plan.legs[2].distanceMeters).toBe(1000);
    expect(result.plan.totalDistanceMeters).toBe(
      result.plan.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
    );
  });

  it('patches when the first stop and one in the middle are gone', () => {
    const result = reconcilePlan(googlePlan(1, 2, 3, 4), [stop(2), stop(4)]);

    expect(result.kind).toBe('patched');
    if (result.kind !== 'patched') return;
    expect(result.plan.origin).toEqual(point(1));
    expect(result.plan.legs.map((leg) => leg.stopId)).toEqual(['v2', 'v4']);
  });

  it('recomputes only for a new stop or a store that moved', () => {
    expect(reconcilePlan(googlePlan(1, 2), [stop(1), stop(2), stop(3)]).kind).toBe('recompute');
    expect(reconcilePlan(googlePlan(1, 2), [stop(1), { id: 'v2', point: point(9) }]).kind).toBe(
      'recompute',
    );
    expect(reconcilePlan(googlePlan(1, 2), [stop(1), stop(2)]).kind).toBe('same');
  });
});

describe('withPostponedStops', () => {
  it('appends them after the plan, leaving what the provider computed untouched', () => {
    const composed = withPostponedStops(
      { ...googlePlan(2, 3), encodedPolyline: 'abc' },
      [stop(1)],
      point(0),
    );

    expect(composed?.legs.map((leg) => leg.stopId)).toEqual(['v2', 'v3', 'v1']);
    expect(composed?.postponedFrom).toBe(2);
    expect(composed?.provider).toBe('GOOGLE');
    expect(composed?.encodedPolyline).toBe('abc');
    expect(composed?.legs[0].distanceMeters).toBe(1000);
    expect(composed?.totalDistanceMeters).toBe(
      composed?.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
    );
  });

  it('never repeats a visit just left for later that is still in the saved plan', () => {
    const composed = withPostponedStops(googlePlan(1, 2), [stop(1)], point(0));

    expect(composed?.legs.map((leg) => leg.stopId)).toEqual(['v2', 'v1']);
  });

  it('builds the route on the device when only postponed visits remain', () => {
    const composed = withPostponedStops(null, [stop(1), stop(2)], point(5));

    expect(composed?.provider).toBe('ESTIMATE');
    expect(composed?.origin).toEqual(point(5));
    expect(composed?.postponedFrom).toBe(0);
    expect(composed?.legs.map((leg) => leg.stopId)).toEqual(['v1', 'v2']);
  });

  it('leaves the plan as it is without postponed visits', () => {
    const plan = googlePlan(1);
    expect(withPostponedStops(plan, [], point(0))).toBe(plan);
    expect(withPostponedStops(null, [], point(0))).toBeNull();
  });
});
