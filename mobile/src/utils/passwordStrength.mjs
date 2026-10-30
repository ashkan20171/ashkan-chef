/** Pure UI feedback. Server-side password policy remains authoritative. */
export function passwordStrength(value) {
  const p = typeof value === 'string' ? value : '';
  const score = [p.length >= 8, p.length >= 12, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p) && /[^\w\s]/.test(p)].filter(Boolean).length;
  return {score, label: score >= 4 ? 'strong' : score >= 2 ? 'fair' : 'weak'};
}
export function passwordChecklist(value) {
  const p = typeof value === 'string' ? value : '';
  return {length: p.length >= 8, letters: /[a-zA-Z]/.test(p), numbers: /\d/.test(p)};
}
