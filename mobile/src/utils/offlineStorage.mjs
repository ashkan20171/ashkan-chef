export function formatCacheBytes(bytes, language='fa') {
  const size = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  const unit = size >= 1024 * 1024 ? 'MB' : 'KB';
  const value = unit === 'MB' ? size / (1024 * 1024) : size / 1024;
  return `${new Intl.NumberFormat(language === 'en' ? 'en-US' : 'fa-IR', {maximumFractionDigits:1}).format(value)} ${unit}`;
}
