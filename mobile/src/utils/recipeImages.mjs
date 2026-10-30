/** Category-based editorial image fallbacks ensure every recipe has a relevant photo. */
const CATEGORY_IMAGES = Object.freeze({
  'غذای اصلی': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&auto=format&fit=crop',
  'صبحانه': 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=900&auto=format&fit=crop',
  'سالم': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&auto=format&fit=crop',
  'غذای سالم': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&auto=format&fit=crop',
  'دسر': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&auto=format&fit=crop',
  'نوشیدنی': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=900&auto=format&fit=crop',
  'دستورهای من': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&auto=format&fit=crop',
});
const DEFAULT_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&auto=format&fit=crop';

/** Safe image URL selection and best-effort prefetching. No private URLs or credentials. */
export function recipeImageUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed) || /[\s\u0000-\u001f]/.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (!url.hostname || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export async function prefetchRecipeImage(image, prefetch) {
  const url = recipeImageUrl(image);
  if (!url || typeof prefetch !== 'function') return false;
  try { return Boolean(await prefetch(url)); } catch { return false; }
}

/** Returns a validated recipe photo or a relevant category fallback. */
export function resolveRecipeImage(recipe) {
  const supplied = recipeImageUrl(recipe?.image);
  if (supplied) return supplied;
  const category = typeof recipe?.category === 'string' ? recipe.category.trim() : '';
  return recipeImageUrl(CATEGORY_IMAGES[category]) || DEFAULT_RECIPE_IMAGE;
}

export function recipeImageCoverage(recipes) {
  const items = Array.isArray(recipes) ? recipes : [];
  return { total: items.length, withImage: items.filter(item => Boolean(resolveRecipeImage(item))).length };
}
