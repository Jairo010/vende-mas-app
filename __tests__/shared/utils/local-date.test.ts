import {
  addDays,
  dayRange,
  formatDayLabel,
  formatTime,
  startOfWeek,
  toDateKey,
  todayKey,
  toLocalTime,
  toZonedIsoString,
  weekdayOf,
  zonedInstant,
  zoneOffsetMinutes,
} from '@/shared/utils/date';

describe('business time zone dates (America/Guayaquil, UTC-5)', () => {
  it('keeps "today" correct after 19:00 local time (already tomorrow in UTC)', () => {
    // 20:30 in Quito on Oct 14 = 01:30 UTC on Oct 15
    const evening = new Date('2026-10-15T01:30:00.000Z');

    expect(evening.toISOString().slice(0, 10)).toBe('2026-10-15');
    expect(todayKey(evening)).toBe('2026-10-14');
    expect(toLocalTime(evening)).toBe('20:30');
  });

  it('builds the UTC range of a local day for agenda queries', () => {
    expect(dayRange('2026-10-14')).toEqual({
      from: '2026-10-14T05:00:00.000Z',
      to: '2026-10-15T04:59:59.999Z',
    });
  });

  it('converts local wall-clock times to instants and back', () => {
    const instant = zonedInstant('2026-10-14', '09:30');

    expect(instant.toISOString()).toBe('2026-10-14T14:30:00.000Z');
    expect(toDateKey(instant)).toBe('2026-10-14');
    expect(zoneOffsetMinutes(instant)).toBe(-300);
  });

  it('formats payload timestamps with the local offset the API expects', () => {
    expect(toZonedIsoString('2026-10-15T01:30:05.000Z')).toBe('2026-10-14T20:30:05-05:00');
  });

  it('does calendar math across months and weeks', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(weekdayOf('2026-10-14')).toBe(3); // Wednesday
    expect(startOfWeek('2026-10-14')).toBe('2026-10-12');
    expect(startOfWeek('2026-10-18')).toBe('2026-10-12'); // Sunday belongs to the same week
  });

  it('formats in Spanish (Ecuador) and in the business zone', () => {
    expect(formatTime('2026-10-14T14:30:00.000Z')).toBe('09:30');
    expect(formatDayLabel('2026-10-14').toLowerCase()).toContain('octubre');
  });

  it('rejects malformed input instead of silently using UTC', () => {
    expect(() => zonedInstant('14/10/2026')).toThrow(RangeError);
    expect(() => zonedInstant('2026-10-14', '25:00')).toThrow(RangeError);
  });
});
