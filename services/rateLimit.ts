export const RATE_LIMIT_KEY = 'arcane-forge-generation-log';
export const MAX_GENERATIONS_PER_MINUTE = 5;

export const checkClientRateLimit = (): { allowed: boolean; retryAfterSeconds?: number } => {
  if (typeof window === 'undefined') {
    return { allowed: true };
  }

  try {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const raw = window.localStorage.getItem(RATE_LIMIT_KEY);
    const parsed: number[] = raw ? JSON.parse(raw) : [];

    const recent = parsed.filter((ts) => now - ts < windowMs);

    if (recent.length >= MAX_GENERATIONS_PER_MINUTE) {
      const oldest = recent[0];
      const retryAfterMs = windowMs - (now - oldest);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    recent.push(now);
    window.localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
    return { allowed: true };
  } catch (e) {
    console.warn('Rate limit check failed, allowing generation by default.', e);
    return { allowed: true };
  }
};
