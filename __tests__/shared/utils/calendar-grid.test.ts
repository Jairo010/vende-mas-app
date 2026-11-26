import { addMonths, monthCells, monthOf, shiftMonth, weekOf } from '@/shared/utils/date';

describe('calendar grid (weeks from Monday)', () => {
  it('lays a month out in full weeks', () => {
    // November 2026 starts on a Sunday and has 30 days.
    const cells = monthCells('2026-11');

    expect(cells).toHaveLength(42);
    expect(cells.slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(cells[7]).toBe('2026-11-02');
    expect(cells.filter(Boolean)).toHaveLength(30);
    expect(cells.at(-1)).toBeNull();
  });

  it('needs no padding when the month fills its rows', () => {
    // February 2027 starts on a Monday and has 28 days.
    expect(monthCells('2027-02')).toHaveLength(28);
    expect(monthCells('2027-02')[0]).toBe('2027-02-01');
  });

  it('gives the week of a day, across months and years', () => {
    expect(weekOf('2026-12-31')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });

  it('moves between months keeping the day when it exists', () => {
    expect(monthOf('2026-11-16')).toBe('2026-11');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-11-16', 1)).toBe('2026-12-16');
    expect(shiftMonth('2027-01-31', 1)).toBe('2027-02-28');
    expect(shiftMonth('2026-03-31', -1)).toBe('2026-02-28');
  });
});
