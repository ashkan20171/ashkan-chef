/** Keep bulk image downloads intentional and avoid starting network work while offline. */
export function canStartOfflineImageBatch({ isRunning = false, isBusy = false, imageCount = 0, connection = 'unknown' } = {}) {
  if (isRunning || isBusy || !Number.isFinite(imageCount) || imageCount <= 0) return false;
  return connection !== 'offline';
}

/** A batch can be cancelled between images; never begin the next item after cancellation. */
export function shouldContinueOfflineImageBatch({ cancelRequested = false, connection = 'unknown' } = {}) {
  return !cancelRequested && connection !== 'offline';
}
