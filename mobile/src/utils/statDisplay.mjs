/** Presentation-only numeric formatting; never use for persisted numeric values. */
export function formatStatValue(value, language='fa') {
 const numeric=Number(value);
 const safe=Number.isFinite(numeric)?Math.max(0,Math.floor(numeric)):0;
 return safe.toLocaleString(language==='fa'?'fa-IR':'en-US');
}
