import {
  isRouteDay,
  nextRouteDates,
  nextRouteDayFrom,
  quickVisitDates,
  routeWeekdaysOf,
} from '@/application/route/route-days';

// 2026-11-09 is a Monday.
const MONDAY = '2026-11-09';
const TUESDAY = '2026-11-10';
const route = [
  { weekday: 1, zoneId: 'centro' },
  { weekday: 4, zoneId: 'centro' },
  { weekday: 7, zoneId: 'sur' },
  { weekday: 2, zoneId: 'norte' },
];

describe('nextRouteDates (API ADR 0037)', () => {
  it('gives the next dates of the days the route goes through the zone', () => {
    expect(nextRouteDates('centro', route, TUESDAY, MONDAY)).toEqual([
      '2026-11-12',
      '2026-11-16',
      '2026-11-19',
      '2026-11-23',
    ]);
  });

  it('counts Sunday as day 7', () => {
    expect(nextRouteDates('sur', route, MONDAY, MONDAY, 1)).toEqual(['2026-11-15']);
  });

  it('offers today, but not the date the visit already has', () => {
    expect(nextRouteDates('centro', route, MONDAY, '2026-11-02', 1)).toEqual([MONDAY]);
    expect(nextRouteDates('centro', route, MONDAY, MONDAY, 1)).toEqual(['2026-11-12']);
  });

  it('has no dates for a customer without a zone or off the route', () => {
    expect(nextRouteDates(null, route, MONDAY, MONDAY)).toEqual([]);
    expect(nextRouteDates(undefined, route, MONDAY, MONDAY)).toEqual([]);
    expect(nextRouteDates('otra', route, MONDAY, MONDAY)).toEqual([]);
  });
});

describe('dates of the next visit (app ADR 0015)', () => {
  const mondaysAndThursdays = routeWeekdaysOf('centro', route);

  it('takes the weekdays of the customer zone only', () => {
    expect([...mondaysAndThursdays].sort()).toEqual([1, 4]);
    expect(routeWeekdaysOf(null, route)).toEqual([]);
  });

  it('tells a route day, and lets any day through without a route', () => {
    expect(isRouteDay('2026-11-12', mondaysAndThursdays)).toBe(true);
    expect(isRouteDay(TUESDAY, mondaysAndThursdays)).toBe(false);
    expect(isRouteDay(TUESDAY, [])).toBe(true);
  });

  it('moves a day forward to the next route day, or keeps it', () => {
    expect(nextRouteDayFrom(TUESDAY, mondaysAndThursdays)).toBe('2026-11-12');
    expect(nextRouteDayFrom(MONDAY, mondaysAndThursdays)).toBe(MONDAY);
    expect(nextRouteDayFrom(TUESDAY, [])).toBe(TUESDAY);
  });

  it('offers one week, two weeks and a month, on route days', () => {
    expect(quickVisitDates(MONDAY, mondaysAndThursdays)).toEqual({
      WEEK: '2026-11-16',
      TWO_WEEKS: '2026-11-23',
      // 9 Dec is a Wednesday: the next Thursday.
      MONTH: '2026-12-10',
    });
    expect(quickVisitDates(MONDAY, [])).toEqual({
      WEEK: '2026-11-16',
      TWO_WEEKS: '2026-11-23',
      MONTH: '2026-12-09',
    });
  });

  it('keeps a month inside a shorter month', () => {
    expect(quickVisitDates('2027-01-31', []).MONTH).toBe('2027-02-28');
  });
});
