/** Stable, user-facing connectivity state for offline-first screens. */
export function classifyConnection({ isConnected, isInternetReachable } = {}) {
  if (isConnected === false || isInternetReachable === false) return 'offline';
  if (isConnected === true && isInternetReachable === true) return 'online';
  return 'unknown';
}

export function connectionMessage(state, language = 'fa') {
  const fa = language !== 'en';
  const messages = {
    offline: fa
      ? { title: 'حالت آفلاین', detail: 'دستورهای ذخیره‌شده در دسترس‌اند؛ دانلود جدید تا اتصال دوباره متوقف است.' }
      : { title: 'Offline mode', detail: 'Saved recipes remain available; new downloads wait until you reconnect.' },
    online: fa
      ? { title: 'اتصال اینترنت برقرار است', detail: 'می‌توانی دستورها و تصاویر موردنیاز را ذخیره یا به‌روزرسانی کنی.' }
      : { title: 'Internet connected', detail: 'You can save or update recipes and their images.' },
    unknown: fa
      ? { title: 'وضعیت اتصال نامشخص است', detail: 'برای جلوگیری از خطا، پیش از دانلود اتصال اینترنت را بررسی کن.' }
      : { title: 'Connection status unknown', detail: 'Check your internet connection before starting downloads.' },
  };
  return messages[state] || messages.unknown;
}
