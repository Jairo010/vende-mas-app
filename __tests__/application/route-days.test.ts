import { nextRouteDates } from '@/application/route/route-days';

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
