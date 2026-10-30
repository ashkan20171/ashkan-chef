/** Pure localized chart presentation helpers. No platform dependencies. */
export function formatAnalyticsCount(value, language = 'fa') {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
  return new Intl.NumberFormat(language === 'fa' ? 'fa-IR' : 'en-US', {maximumFractionDigits:0}).format(safe);
}
export function chartEmptyMessage(language = 'fa') {
  return language === 'fa' ? 'در این بازه فعالیتی ثبت نشده است.' : 'No activity recorded in this period.';
}
export function getChartAccessibilitySummary(rows, language = 'fa') {
  const safe = Array.isArray(rows) ? rows : [];
  const total = safe.reduce((sum, row) => sum + Math.max(0, Number(row?.count) || 0), 0);
  const formatted = formatAnalyticsCount(total, language);
  return language === 'fa' ? `مجموع فعالیت‌ها: ${formatted}` : `Total activities: ${formatted}`;
}
