import { normalizeLanguage } from './language.mjs';

export const messages = Object.freeze({
  fa: Object.freeze({
    profileLoadFailed: 'بارگذاری پروفایل ممکن نشد.', profileRefreshFailed: 'به‌روزرسانی پروفایل ممکن نشد.',
    signOutFailed: 'خروج از حساب انجام نشد.', restoreFailed: 'بازیابی اطلاعات ذخیره‌شده ممکن نشد.',
    saveFailed: 'ذخیره اطلاعات ممکن نشد.', timerDoneTitle: 'زمان تمام شد!',
    timerDone: 'تایمر آشپزی به پایان رسید.', shoppingTitle: 'لیست خرید',
    shoppingAdded: 'مواد اولیه به لیست خرید اضافه شدند.',
    savedTitle: 'ذخیره شد', savedNote: 'یادداشت شما روی دستگاه ذخیره شد.',
    clearTitle: 'پاک‌سازی', clearQuestion: 'مواد خریداری‌شده حذف شوند؟',
    cancel: 'انصراف', delete: 'حذف', error: 'خطا',
    offline: 'اتصال اینترنت برقرار نیست. دوباره تلاش کنید.',
    timeout: 'زمان پاسخ‌گویی سرور تمام شد. دوباره تلاش کنید.',
    unauthorized: 'نشست شما منقضی شده است. دوباره وارد شوید.',
    forbidden: 'اجازه انجام این عملیات را ندارید.',
    rateLimited: 'تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.',
    serverError: 'سرور موقتاً در دسترس نیست. دوباره تلاش کنید.',
    unexpected: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
  }),
  en: Object.freeze({
    profileLoadFailed: 'Could not load your profile.', profileRefreshFailed: 'Could not refresh your profile.',
    signOutFailed: 'Could not sign out.', restoreFailed: 'Could not restore saved data.',
    saveFailed: 'Could not save your data.', timerDoneTitle: 'Time is up!',
    timerDone: 'Your cooking timer has finished.', shoppingTitle: 'Shopping list',
    shoppingAdded: 'Ingredients were added to your shopping list.',
    savedTitle: 'Saved', savedNote: 'Your note was saved on this device.',
    clearTitle: 'Clear items', clearQuestion: 'Remove purchased items?',
    cancel: 'Cancel', delete: 'Remove', error: 'Error',
    offline: 'No internet connection. Please try again.',
    timeout: 'The request timed out. Please try again.',
    unauthorized: 'Your session expired. Please sign in again.',
    forbidden: 'You do not have permission to do this.',
    rateLimited: 'Too many requests. Please try again later.',
    serverError: 'The server is temporarily unavailable. Please try again.',
    unexpected: 'Something went wrong. Please try again.'
  })
});
export function translate(language, key) {
  const lang = normalizeLanguage(language);
  return messages[lang][key] ?? messages.fa[key] ?? key;
}
export function localizedApiError(language, error) {
  const status = Number(error?.status ?? error?.statusCode ?? 0);
  const code = String(error?.code ?? '').toLowerCase();
  if (status === 401) return translate(language, 'unauthorized');
  if (status === 403) return translate(language, 'forbidden');
  if (status === 429) return translate(language, 'rateLimited');
  if (status >= 500) return translate(language, 'serverError');
  if (code.includes('timeout') || error?.name === 'AbortError') return translate(language, 'timeout');
  if (status === 0 && (code.includes('network') || error?.name === 'TypeError')) return translate(language, 'offline');
  return translate(language, 'unexpected');
}
