/** Durable, idempotent outbox for future recipe synchronization. Transport is caller-supplied. */
export const DEFAULT_SYNC_OUTBOX_KEY = '@ashkan-chef/sync-outbox/v1';
export const MAX_SYNC_ATTEMPTS = 5;

function normalizeEntry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const id = String(value.id ?? '').trim();
  if (!id || !['upsert', 'delete'].includes(value.operation)) return null;
  return { id, operation: value.operation,
    payload: value.operation === 'upsert' && value.payload && typeof value.payload === 'object' ? value.payload : null,
    attempts: Number.isInteger(value.attempts) && value.attempts >= 0 ? value.attempts : 0,
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : 0,
    nextAttemptAt: Number.isFinite(value.nextAttemptAt) ? value.nextAttemptAt : 0,
    lastError: typeof value.lastError === 'string' ? value.lastError : null };
}

export function inspectSyncOutbox(raw) {
  if (raw == null || raw === '') return { status: 'empty', entries: [], skipped: 0 };
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return { status: 'corrupt', entries: [], skipped: 0 }; }
  if (!Array.isArray(parsed)) return { status: 'invalid-shape', entries: [], skipped: 0 };
  const entries = []; let skipped = 0;
  for (const item of parsed) {
    const entry = normalizeEntry(item);
    if (!entry) { skipped++; continue; }
    const index = entries.findIndex(current => current.id === entry.id);
    if (index >= 0) entries.splice(index, 1);
    entries.push(entry);
  }
  return { status: skipped ? 'recovered' : 'ready', entries, skipped };
}

export function enqueueSyncOperation(entries, operation, payload, now = Date.now()) {
  const id = String(payload?.id ?? '').trim();
  if (!id || !['upsert', 'delete'].includes(operation)) return Array.isArray(entries) ? entries : [];
  const next = (Array.isArray(entries) ? entries : []).filter(entry => String(entry.id) !== id);
  next.push({ id, operation, payload: operation === 'upsert' ? payload : null, attempts: 0, createdAt: now, nextAttemptAt: now, lastError: null });
  return next;
}

export function syncRetryDelay(attempts) {
  const n = Math.max(1, Math.min(MAX_SYNC_ATTEMPTS, Number(attempts) || 1));
  return Math.min(60 * 60 * 1000, 1000 * (2 ** (n - 1)));
}

export function createOfflineSyncOutbox(storage, key = DEFAULT_SYNC_OUTBOX_KEY) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') throw new TypeError('Sync outbox requires getItem and setItem');
  let tail = Promise.resolve();
  const run = task => { const result = tail.then(task); tail = result.catch(() => undefined); return result; };
  const read = async () => inspectSyncOutbox(await storage.getItem(key));
  const write = entries => storage.setItem(key, JSON.stringify(entries));
  return {
    load: read,
    enqueue(operation, payload, now) { return run(async () => { const report = await read(); const entries = enqueueSyncOperation(report.entries, operation, payload, now); await write(entries); return entries; }); },
    remove(id) { return run(async () => { const report = await read(); const entries = report.entries.filter(entry => entry.id !== String(id)); await write(entries); return entries; }); },
    async flush(send, { now = Date.now(), limit = 20 } = {}) {
      if (typeof send !== 'function') throw new TypeError('flush requires a send function');
      return run(async () => {
        const report = await read(); let entries = report.entries;
        const result = { sent: 0, deferred: 0, failed: 0, remaining: 0 };
        for (const entry of [...entries]) {
          if (result.sent + result.failed >= limit) break;
          if (entry.nextAttemptAt > now || entry.attempts >= MAX_SYNC_ATTEMPTS) { result.deferred++; continue; }
          try {
            await send(entry, { idempotencyKey: `recipe:${entry.id}:${entry.createdAt}` });
            entries = entries.filter(item => item.id !== entry.id); result.sent++;
          } catch (error) {
            const attempts = entry.attempts + 1;
            entries = entries.map(item => item.id === entry.id ? { ...item, attempts, nextAttemptAt: now + syncRetryDelay(attempts), lastError: String(error?.message ?? 'Synchronization failed').slice(0, 240) } : item);
            result.failed++;
          }
        }
        await write(entries); result.remaining = entries.length; return result;
      });
    },
  };
}
