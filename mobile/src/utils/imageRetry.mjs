/** Limit explicit image retries to prevent accidental infinite loops. */
export const MAX_IMAGE_RETRIES = 2;
export function canRetryImage(url, failed, attempts) {
  return typeof url === 'string' && url.length > 0 && failed === true &&
    Number.isInteger(attempts) && attempts >= 0 && attempts < MAX_IMAGE_RETRIES;
}
export function nextImageAttempt(attempts) {
  return Number.isInteger(attempts) && attempts >= 0 && attempts < MAX_IMAGE_RETRIES ? attempts + 1 : attempts;
}
