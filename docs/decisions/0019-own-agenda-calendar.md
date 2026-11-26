# 0019. The agenda calendar is our own component

- **Status**: Accepted
- **Date**: 2026-11-16
- **Related**: ADR 0004 (agenda and visit execution), ADR 0009 (agenda grouped by type). Replaces
  the calendar part of both.

## Context

The home showed its calendar with `ExpandableCalendar` from `react-native-calendars`. Sellers
reported that it sometimes stayed as an empty space: the gap was there, the days were not.

The failure was not reproduced on demand, so its exact cause is not confirmed. What the code
showed:

- the component keeps internal lists of weeks and months that paint on their own schedule;
- its marks changed identity after every sync, and it was remounted on every theme change;
- it was the only use of the library, and the date picker already drew its own month.

## Decision

- **`AgendaCalendar`** (`presentation/features/agenda/agenda-calendar.tsx`) is built with plain
  views:
  - a week strip (Monday to Sunday) with the weekday, the day and one dot per visit type;
  - the month title or the handle under the strip opens the whole month;
  - arrows and a horizontal swipe move one week (or one month while it is open).
- **What is shown always follows `selectedDate`.** Moving to another week or month selects the
  same weekday (or day of the month) there, so the agenda loads that period and its dots. The
  component keeps no date of its own.
- **Shared pieces** (`presentation/components/ui`):
  - `CalendarDay`: one day with its today / selected / disabled states and marks;
  - `MonthGrid`: a month as rows of weeks. `DatePickerModal` uses it too, so both calendars look
    and behave the same.
- **Layout math** lives in `shared/utils/date/calendar-grid.ts` (`monthCells`, `weekOf`,
  `shiftMonth`, `addMonths`), pure and unit tested.
- Month and weekday names come from `es.calendar`.
- `useVisits` keeps the previous data while another month is read, so the list is not replaced
  by skeletons on every month change.
- `react-native-calendars` is removed.

## Consequences

- Nothing in the calendar renders outside React's normal pass, so it cannot stay blank while
  the rest of the screen is painted.
- Less code runs on the home: one row of seven cells instead of the library's lists.
- Vertical drag to open the month is gone; the title and the handle do it.
- Swiping has no sliding animation: the week changes in place.
