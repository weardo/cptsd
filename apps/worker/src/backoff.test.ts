import { getBackoffDelay, MAX_BACKOFF_MS } from './backoff';

describe('getBackoffDelay', () => {
  it('grows exponentially from a 1s base', () => {
    expect(getBackoffDelay(0)).toBe(1000);
    expect(getBackoffDelay(1)).toBe(2000);
    expect(getBackoffDelay(2)).toBe(4000);
    expect(getBackoffDelay(3)).toBe(8000);
  });

  it('caps the delay at the 5 minute maximum', () => {
    expect(MAX_BACKOFF_MS).toBe(300000);
    // 2^9 * 1000 = 512000 > 300000, so it must be clamped.
    expect(getBackoffDelay(9)).toBe(MAX_BACKOFF_MS);
    expect(getBackoffDelay(100)).toBe(MAX_BACKOFF_MS);
  });
});
