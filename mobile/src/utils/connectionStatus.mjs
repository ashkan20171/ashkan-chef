/** Conservative connectivity indicator: unknown is not the same as offline. */
export function connectionStatus(state) {
  if (!state || typeof state !== 'object') return 'unknown';
  if (state.isConnected === false || state.isInternetReachable === false) return 'offline';
  if (state.isConnected === true && state.isInternetReachable === true) return 'online';
  return 'unknown';
}
export function connectionMessage(status, language='fa') {
  const en = language === 'en';
  if (status === 'offline') return en ? 'You are offline. Saved recipes remain available.' : 'اینترنت قطع است؛ دستورهای ذخیره‌شده همچنان در دسترس‌اند.';
  if (status === 'online') return en ? 'Connected to the internet' : 'اتصال اینترنت برقرار است';
  return en ? 'Checking connection…' : 'در حال بررسی اتصال اینترنت…';
}
