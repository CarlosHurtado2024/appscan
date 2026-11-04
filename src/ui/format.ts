const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);

/** "hoy", "ayer", or the date for anything older. */
export function relativeDay(ms: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / 86_400_000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  return new Date(ms).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}
