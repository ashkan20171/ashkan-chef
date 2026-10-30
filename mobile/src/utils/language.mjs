export const DEFAULT_LANGUAGE = 'fa';
export const SUPPORTED_LANGUAGES = Object.freeze(['fa', 'en']);
export function normalizeLanguage(value) { return value === 'en' ? 'en' : DEFAULT_LANGUAGE; }
export function directionFor(language) { return normalizeLanguage(language) === 'fa' ? 'rtl' : 'ltr'; }
export function localizedText(language, persian, english) { return normalizeLanguage(language) === 'fa' ? persian : english; }
