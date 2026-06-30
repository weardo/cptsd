/**
 * Maximum backoff delay in milliseconds (5 minutes).
 */
export const MAX_BACKOFF_MS = 300000;

/**
 * Exponential backoff delay calculation.
 *
 * Returns 1000 * 2^attempts milliseconds, capped at MAX_BACKOFF_MS (5 minutes).
 *
 * @param attempts Number of attempts already made.
 * @returns Delay in milliseconds before the next retry.
 */
export function getBackoffDelay(attempts: number): number {
  return Math.min(1000 * Math.pow(2, attempts), MAX_BACKOFF_MS);
}
