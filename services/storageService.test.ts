import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the supabase client before importing storageService
vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Mock imageUtils (canvas API not available in jsdom reliably)
vi.mock('./imageUtils', () => ({
  generateThumbnail: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

import { isSupabaseConfigured, invalidateCache } from './storageService';

const CACHE_KEY_ITEMS     = 'arcane-forge-items-cache';
const CACHE_KEY_TIMESTAMP = 'arcane-forge-items-cache-timestamp';

describe('isSupabaseConfigured', () => {
  it('returns false when VITE_SUPABASE_URL is not set', () => {
    // import.meta.env defaults to empty in the test environment
    expect(isSupabaseConfigured()).toBe(false);
  });
});

describe('invalidateCache', () => {
  beforeEach(() => {
    localStorage.removeItem(CACHE_KEY_ITEMS);
    localStorage.removeItem(CACHE_KEY_TIMESTAMP);
  });

  it('removes items cache key', () => {
    localStorage.setItem(CACHE_KEY_ITEMS, '[]');
    localStorage.setItem(CACHE_KEY_TIMESTAMP, '12345');

    invalidateCache();

    expect(localStorage.getItem(CACHE_KEY_ITEMS)).toBeNull();
    expect(localStorage.getItem(CACHE_KEY_TIMESTAMP)).toBeNull();
  });

  it('does not throw when the cache keys are already absent', () => {
    expect(() => invalidateCache()).not.toThrow();
  });
});
