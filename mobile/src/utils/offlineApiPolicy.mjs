/** Only known offline states skip network calls; unknown states may retry. */
export function shouldUseCachedRecipes(status) { return status === 'offline'; }
export function shouldRefreshAfterReconnect(previous, current) {
  return previous === 'offline' && current === 'online';
}
export function offlineRecipesMessage(language='fa') {
  return language === 'en' ? 'Offline: showing saved results. Reconnect to refresh.' : 'آفلاین: نتایج ذخیره‌شده نمایش داده می‌شوند. پس از اتصال، به‌روز می‌شوند.';
}
