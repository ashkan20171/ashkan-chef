/** Maps the durable outbox protocol to the authenticated ASP.NET Core sync routes. */
export function createRecipeSyncTransport(request) {
  if (typeof request !== 'function') throw new TypeError('Sync transport requires an API request function');
  return {
    upsert(recipe, metadata = {}) {
      if (!recipe || typeof recipe !== 'object' || Array.isArray(recipe)) throw new TypeError('Recipe payload is required');
      const clientId = String(recipe.id ?? '').trim();
      if (!clientId) throw new TypeError('Recipe must have a stable client id');
      if (!metadata.idempotencyKey) throw new TypeError('Idempotency key is required');
      return request('/api/sync/recipes/upsert', {
        method: 'POST', authenticated: true,
        headers: { 'Idempotency-Key': metadata.idempotencyKey },
        body: {
          clientId, title: recipe.title, ingredients: recipe.ingredients, steps: recipe.steps,
          imageUrl: recipe.imageUrl ?? recipe.image ?? null,
          expectedVersion: Number.isInteger(recipe.syncVersion) ? recipe.syncVersion : null,
        },
      });
    },
    delete(recipeId, metadata = {}) {
      const clientId = String(recipeId ?? '').trim();
      if (!clientId) throw new TypeError('Recipe id is required');
      if (!metadata.idempotencyKey) throw new TypeError('Idempotency key is required');
      return request('/api/sync/recipes/delete', {
        method: 'POST', authenticated: true,
        headers: { 'Idempotency-Key': metadata.idempotencyKey },
        body: { clientId, expectedVersion: Number.isInteger(metadata.expectedVersion) ? metadata.expectedVersion : null },
      });
    },
  };
}
