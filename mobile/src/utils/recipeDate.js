/** Localized calendar date from the server's UTC timestamp. */
export function formatRecipeDate(value, language = 'fa') {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'fa' ? 'fa-IR-u-ca-persian' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
  }).format(parsed);
}
