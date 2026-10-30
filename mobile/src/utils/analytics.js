/** Pure, defensive helpers for the authenticated chef analytics dashboard. */
export function selectRecentMonths(rows, windowSize = 12) {
  const size = [3, 6, 12].includes(windowSize) ? windowSize : 12;
  return (Array.isArray(rows) ? rows : []).slice(-size).map(row => ({
    year: Number(row.year) || 0,
    month: Number(row.month) || 0,
    count: Math.max(0, Number(row.count) || 0),
  }));
}
export function chartSummary(rows, windowSize = 12) {
  const months = selectRecentMonths(rows, windowSize);
  const total = months.reduce((sum, row) => sum + row.count, 0);
  return { months, total, peak: Math.max(1, ...months.map(row => row.count)) };
}
export function ratingLabel(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 5 ? number.toFixed(1) : '—';
}
