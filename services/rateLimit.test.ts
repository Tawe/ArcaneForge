import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkClientRateLimit, RATE_LIMIT_KEY, MAX_GENERATIONS_PER_MINUTE } from './rateLimit';

describe('checkClientRateLimit', () => {
  beforeEach(() => {
    localStorage.removeItem(RATE_LIMIT_KEY);
    vi.restoreAllMocks();
  });

  it('allows the first generation with an empty log', () => {
    const result = checkClientRateLimit();
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBeUndefined();
  });

  it('records each allowed generation in localStorage', () => {
    checkClientRateLimit();
    const stored = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY)!);
    expect(stored).toHaveLength(1);
  });

  it(`allows up to ${MAX_GENERATIONS_PER_MINUTE} generations within a minute`, () => {
    for (let i = 0; i < MAX_GENERATIONS_PER_MINUTE; i++) {
      expect(checkClientRateLimit().allowed).toBe(true);
    }
  });

  it(`blocks the ${MAX_GENERATIONS_PER_MINUTE + 1}th generation within a minute`, () => {
    for (let i = 0; i < MAX_GENERATIONS_PER_MINUTE; i++) {
      checkClientRateLimit();
    }
    const result = checkClientRateLimit();
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('returns a positive retryAfterSeconds when blocked', () => {
    for (let i = 0; i < MAX_GENERATIONS_PER_MINUTE; i++) {
      checkClientRateLimit();
    }
    const { retryAfterSeconds } = checkClientRateLimit();
    expect(retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('allows generation again after the window has elapsed', () => {
    // Fill the log with timestamps 61 seconds in the past
    const oldTimestamps = Array.from({ length: MAX_GENERATIONS_PER_MINUTE }, () => Date.now() - 61_000);
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(oldTimestamps));

    const result = checkClientRateLimit();
    expect(result.allowed).toBe(true);
  });

  it('filters out expired timestamps and allows if under the limit', () => {
    // 4 old + 1 recent = 1 recent, so should be allowed
    const mixed = [
      ...Array.from({ length: 4 }, () => Date.now() - 61_000),
      Date.now() - 5_000,
    ];
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(mixed));

    const result = checkClientRateLimit();
    expect(result.allowed).toBe(true);
  });

  it('allows generation (fail open) when localStorage contains corrupted data', () => {
    localStorage.setItem(RATE_LIMIT_KEY, 'not-valid-json');
    const result = checkClientRateLimit();
    expect(result.allowed).toBe(true);
  });

  it('allows generation (fail open) when localStorage.getItem throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    const result = checkClientRateLimit();
    expect(result.allowed).toBe(true);
  });
});
