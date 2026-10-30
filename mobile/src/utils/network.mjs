/** Pure network helpers shared by the API client and node tests. */
export class ApiError extends Error {
  constructor(message, status = 0, code = 'UNKNOWN') {
    super(message); this.name = 'ApiError'; this.status = status; this.code = code;
  }
}
export function buildApiUrl(base, path) {
  if (!/^https?:\/\//i.test(base)) throw new Error('API base URL must be http(s)');
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('API path must start with a single /');
  return `${base.replace(/\/+$/, '')}${path}`;
}
export function normalizeApiError(error, language = 'fa') {
  const fa = language === 'fa';
  if (error?.code === 'CANCELLED') return fa ? 'درخواست لغو شد.' : 'Request cancelled.';
  if (error?.name === 'AbortError' || error?.code === 'TIMEOUT') return fa ? 'زمان پاسخ‌گویی سرور تمام شد. دوباره تلاش کنید.' : 'The server took too long. Please retry.';
  if (error?.status === 401) return fa ? 'نشست شما منقضی شده است. دوباره وارد شوید.' : 'Your session expired. Please sign in again.';
  if (error?.status === 429) return fa ? 'درخواست‌های زیادی ارسال شده است. کمی بعد تلاش کنید.' : 'Too many requests. Please try again later.';
  if (error?.status >= 500) return fa ? 'خطای سرور. لطفاً بعداً دوباره تلاش کنید.' : 'Server error. Please try again later.';
  if (error instanceof TypeError || error?.code === 'NETWORK') return fa ? 'اتصال به سرور برقرار نشد. اینترنت و نشانی API را بررسی کنید.' : 'Could not connect. Check your network and API address.';
  return error?.message || (fa ? 'خطای ناشناخته' : 'Unknown error');
}
/** Cancels on timeout or an upstream signal, while preserving the reason. */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000, fetcher = fetch) {
  const controller = new AbortController();
  const upstream = options.signal;
  if (upstream?.aborted) throw new ApiError('Request cancelled', 0, 'CANCELLED');
  let timedOut = false;
  const cancel = () => controller.abort();
  upstream?.addEventListener('abort', cancel, {once: true});
  const timer = setTimeout(() => {timedOut = true; controller.abort();}, timeoutMs);
  try {
    return await fetcher(url, {...options, signal: controller.signal});
  } catch (error) {
    if (timedOut) throw new ApiError('Request timed out', 0, 'TIMEOUT');
    if (upstream?.aborted || controller.signal.aborted) throw new ApiError('Request cancelled', 0, 'CANCELLED');
    throw error;
  } finally {
    clearTimeout(timer);
    upstream?.removeEventListener('abort', cancel);
  }
}
