import { createOfflineSyncOutbox } from './offlineSyncOutbox.mjs';

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Coordinates local recipe mutations with the durable outbox.
 * The transport is deliberately injected: production sync must use an authenticated
 * server endpoint that honors idempotency keys and returns explicit acknowledgements.
 */
export function createRecipeSyncService({ storage, transport, key } = {}) {
  if (!transport || typeof transport.upsert !== 'function' || typeof transport.delete !== 'function') {
    throw new TypeError('Recipe sync requires upsert and delete transport methods');
  }
  const outbox = createOfflineSyncOutbox(storage, key);

  return {
    async queueUpsert(recipe, now) {
      if (!isPlainObject(recipe) || recipe.id == null || String(recipe.id).trim() === '') {
        throw new TypeError('A recipe with a stable id is required');
      }
      if (typeof recipe.title !== 'string' || !recipe.title.trim()) {
        throw new TypeError('Recipe title is required');
      }
      if (!Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
        throw new TypeError('Recipe ingredients and steps must be arrays');
      }
      return outbox.enqueue('upsert', recipe, now);
    },

    async queueDelete(recipeId, now) {
      const id = String(recipeId ?? '').trim();
      if (!id) throw new TypeError('Recipe id is required');
      return outbox.enqueue('delete', { id }, now);
    },

    async flush(options) {
      return outbox.flush((entry, metadata) => {
        if (entry.operation === 'upsert') {
          return transport.upsert(entry.payload, metadata);
        }
        return transport.delete(entry.id, metadata);
      }, options);
    },

    async status() {
      const report = await outbox.load();
      const entries = report.entries;
      return {
        state: entries.length ? 'pending' : 'idle',
        pending: entries.length,
        upserts: entries.filter(entry => entry.operation === 'upsert').length,
        deletes: entries.filter(entry => entry.operation === 'delete').length,
        failedAttempts: entries.reduce((sum, entry) => sum + entry.attempts, 0),
        storageStatus: report.status,
        skippedCorruptEntries: report.skipped,
      };
    },
  };
}
