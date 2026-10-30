/** Pure offline-image source resolution. Never request the network while local lookup is pending. */
export function imageSourceState(url, localUri, lookupPending) {
  if (!url) return {source:null,ready:true,offline:false};
  if (lookupPending) return {source:null,ready:false,offline:false};
  if (typeof localUri === 'string' && localUri.startsWith('file://')) return {source:localUri,ready:true,offline:true};
  return {source:url,ready:true,offline:false};
}
export function shouldPersistLoadedImage(url, offline, loaded) {
  return Boolean(url && !offline && loaded);
}
