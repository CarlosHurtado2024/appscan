import { relativeDay } from './format';

const NOW = new Date(2026, 10, 3, 21, 48).getTime();

test('today and yesterday are named', () => {
  expect(relativeDay(new Date(2026, 10, 3, 0, 5).getTime(), NOW)).toBe('hoy');
  expect(relativeDay(new Date(2026, 10, 2, 23, 59).getTime(), NOW)).toBe('ayer');
});

test('older days show the date', () => {
  expect(relativeDay(new Date(2026, 9, 28, 10, 0).getTime(), NOW)).toContain('28');
});
