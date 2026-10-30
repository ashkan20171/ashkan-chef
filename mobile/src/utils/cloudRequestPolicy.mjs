/** Protect paginated recipe results against stale asynchronous responses. */
export function isCurrentRequest(requestId, activeRequestId) {
  return Number.isSafeInteger(requestId) && requestId === activeRequestId;
}
export function shouldAppendCloudPage(nextPage, isMine) {
  return Number.isInteger(nextPage) && nextPage > 1 && !isMine;
}
export function mergeCloudPage(previous, incoming, nextPage, isMine) {
  const current = Array.isArray(previous) ? previous : [];
  const received = Array.isArray(incoming) ? incoming : [];
  if (!shouldAppendCloudPage(nextPage, isMine)) return received;
  const ids = new Set(current.map(item => String(item.id)));
  const additions = [];
  for (const item of received) {
    const id = String(item?.id);
    if (ids.has(id)) continue;
    ids.add(id);
    additions.push(item);
  }
  return [...current, ...additions];
}
export function cloudRequestError(error, language='fa') {
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  return message || (language === 'en' ? 'Unable to load recipes. Please retry.' : 'دریافت دستورها ممکن نشد. دوباره تلاش کنید.');
}

/** Whether a next-page action is valid for the current list state. */
export function canLoadMore({ page, total, loading, isMine=false, showSaved=false, error=false }) {
  return !loading && !isMine && !showSaved && !error && Number.isInteger(page) && page >= 1 && Number.isFinite(total) && total > 0 && page * 20 < total;
}
