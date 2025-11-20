import { MagicItemResult } from '../types';
import { supabase } from './supabaseClient';

export interface SavedMagicItem extends MagicItemResult {
  id: string;
  created_at: string; // ISO timestamp from Supabase
}

// Database table name
const TABLE_NAME = 'magic_items';

// Cache keys
const CACHE_KEY_ITEMS = 'arcane-forge-items-cache';
const CACHE_KEY_TIMESTAMP = 'arcane-forge-items-cache-timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if Supabase is properly configured
 */
const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!(url && url !== '' && !url.includes('placeholder'));
};

/**
 * Get cached items from localStorage
 * Returns lightweight items (without imageUrl, imagePrompt, itemCard)
 */
const getCachedItems = (): SavedMagicItem[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_ITEMS);
    const timestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);
    
    if (!cached || !timestamp) {
      return null;
    }
    
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_DURATION) {
      // Cache expired
      localStorage.removeItem(CACHE_KEY_ITEMS);
      localStorage.removeItem(CACHE_KEY_TIMESTAMP);
      return null;
    }
    
    const items = JSON.parse(cached) as any[];
    // Restore to SavedMagicItem format with empty strings for missing fields
    return items.map(item => ({
      ...item,
      imagePrompt: '', // Will be fetched on demand
      itemCard: '', // Will be fetched on demand
      imageUrl: null, // Will be fetched on demand
    })) as SavedMagicItem[];
  } catch (error) {
    console.warn('Failed to read cache:', error);
    // Clear corrupted cache
    try {
      localStorage.removeItem(CACHE_KEY_ITEMS);
      localStorage.removeItem(CACHE_KEY_TIMESTAMP);
    } catch (clearError) {
      // Ignore clear errors
    }
    return null;
  }
};

/**
 * Save items to localStorage cache
 * Excludes large fields like imageUrl to save space
 */
const setCachedItems = (items: SavedMagicItem[]): void => {
  try {
    // Create a lightweight version without large image URLs
    const lightweightItems = items.map(item => ({
      id: item.id,
      created_at: item.created_at,
      savedAt: item.savedAt,
      itemData: item.itemData,
      // Exclude imageUrl, imagePrompt, and itemCard to save space
      // These will be fetched on demand when viewing an item
    }));

    const cacheData = JSON.stringify(lightweightItems);
    const cacheSize = new Blob([cacheData]).size;
    
    // Check if cache would exceed ~4MB (localStorage limit is usually 5-10MB)
    if (cacheSize > 4 * 1024 * 1024) {
      console.warn('Cache too large, skipping cache write. Size:', cacheSize);
      return;
    }

    localStorage.setItem(CACHE_KEY_ITEMS, cacheData);
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old cache and retrying...');
      // Try to clear old cache and retry with fewer items
      try {
        localStorage.removeItem(CACHE_KEY_ITEMS);
        localStorage.removeItem(CACHE_KEY_TIMESTAMP);
        // Retry with just the first 50 items
        const limitedItems = items.slice(0, 50).map(item => ({
          id: item.id,
          created_at: item.created_at,
          savedAt: item.savedAt,
          itemData: item.itemData,
        }));
        localStorage.setItem(CACHE_KEY_ITEMS, JSON.stringify(limitedItems));
        localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
      } catch (retryError) {
        console.warn('Failed to write cache even after cleanup:', retryError);
      }
    } else {
      console.warn('Failed to write cache:', error);
    }
  }
};

/**
 * Invalidate the cache (call when items are added/deleted)
 */
export const invalidateCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY_ITEMS);
    localStorage.removeItem(CACHE_KEY_TIMESTAMP);
  } catch (error) {
    console.warn('Failed to invalidate cache:', error);
  }
};

/**
 * Get all saved magic items from Supabase
 * Optimized to only fetch necessary fields for list display
 * Uses localStorage cache for instant loading
 */
export const getSavedItems = async (limit?: number): Promise<SavedMagicItem[]> => {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return [];
  }

  // Try to get from cache first
  const cached = getCachedItems();
  if (cached) {
    // Return cached data immediately, but also refresh in background
    refreshItemsInBackground(limit);
    return limit ? cached.slice(0, limit) : cached;
  }

  // No cache, fetch from database
  return await fetchItemsFromDatabase(limit);
};

/**
 * Fetch items from database (internal function)
 * Excludes image_url to dramatically reduce payload size (images are 100KB-500KB+ each)
 */
const fetchItemsFromDatabase = async (limit?: number): Promise<SavedMagicItem[]> => {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('id, created_at, item_data')
      .order('created_at', { ascending: false });
    
    // Always limit queries to prevent huge payloads
    const queryLimit = limit || 500;
    query = query.limit(queryLimit);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load saved items:', error);
      return [];
    }

    const items = (data || []).map((item: any) => ({
      itemData: item.item_data,
      imagePrompt: '', // Not needed for list view
      itemCard: '', // Not needed for list view
      imageUrl: null, // Images loaded on demand via getItemImageUrl
      id: item.id,
      created_at: item.created_at,
      savedAt: new Date(item.created_at).getTime(),
    })) as SavedMagicItem[];

    // Cache the results (will handle quota errors gracefully)
    setCachedItems(items);
    
    return items;
  } catch (error) {
    console.error('Failed to load saved items:', error);
    return [];
  }
};

/**
 * Refresh items in background (non-blocking)
 */
const refreshItemsInBackground = async (limit?: number): Promise<void> => {
  // Don't await - let it run in background
  fetchItemsFromDatabase(limit).catch(err => {
    console.warn('Background refresh failed:', err);
  });
};

/**
 * Save a magic item to Supabase (automatically called on generation)
 */
export const saveItem = async (item: MagicItemResult): Promise<SavedMagicItem | null> => {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    // Silently fail if Supabase is not configured
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        item_data: item.itemData,
        image_prompt: item.imagePrompt,
        item_card: item.itemCard,
        image_url: item.imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save item:', error);
      throw new Error('Failed to save item to database');
    }

    const savedItem = {
      ...item,
      id: data.id,
      created_at: data.created_at,
      savedAt: new Date(data.created_at).getTime(),
    };

    // Invalidate cache so new item appears
    invalidateCache();

    return savedItem;
  } catch (error) {
    console.error('Failed to save item:', error);
    throw error;
  }
};

/**
 * Remove a saved item by ID
 */
export const removeItem = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to remove item:', error);
      throw new Error('Failed to remove item from database');
    }

    // Invalidate cache so deleted item disappears
    invalidateCache();
  } catch (error) {
    console.error('Failed to remove item:', error);
    throw error;
  }
};

/**
 * Get a saved item by ID with full data (for viewing)
 * This is the only function that fetches image_url - called on demand
 */
export const getItemById = async (id: string): Promise<SavedMagicItem | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, created_at, item_data, image_prompt, item_card, image_url')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      itemData: data.item_data || {},
      imagePrompt: data.image_prompt || '',
      itemCard: data.item_card || '',
      imageUrl: data.image_url || null,
      id: data.id,
      created_at: data.created_at,
      savedAt: new Date(data.created_at).getTime(),
    };
  } catch (error) {
    console.error('Failed to get item:', error);
    return null;
  }
};

/**
 * Get image URL for an item (separate function for lazy loading)
 */
export const getItemImageUrl = async (id: string): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('image_url')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching image:', error);
      return null;
    }

    if (!data || !data.image_url) {
      return null;
    }

    return data.image_url;
  } catch (error) {
    console.error('Failed to get item image:', error);
    return null;
  }
};

/**
 * Batch load image URLs for multiple items (more efficient)
 */
export const getItemImageUrls = async (ids: string[]): Promise<Record<string, string | null>> => {
  if (!isSupabaseConfigured() || ids.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, image_url')
      .in('id', ids);

    if (error) {
      console.error('Error fetching images:', error);
      return {};
    }

    const result: Record<string, string | null> = {};
    (data || []).forEach(item => {
      result[item.id] = item.image_url || null;
    });
    
    return result;
  } catch (error) {
    console.error('Failed to get item images:', error);
    return {};
  }
};

/**
 * Search saved items by name, type, rarity, or theme
 * Uses cache when available, falls back to database
 */
export const searchSavedItems = async (query: string): Promise<SavedMagicItem[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    if (!query.trim()) {
      return await getSavedItems();
    }

    // Try cache first
    const cached = getCachedItems();
    if (cached && cached.length > 0) {
      // Search in cached data (fast)
      const lowerQuery = query.toLowerCase();
      const filtered = cached.filter((item) => {
        const itemData = item.itemData || {};
        const name = itemData.name?.toLowerCase() || '';
        const type = itemData.type?.toLowerCase() || '';
        const rarity = itemData.rarity?.toLowerCase() || '';
        const theme = itemData.theme?.toLowerCase() || '';
        const description = itemData.description?.toLowerCase() || '';

        return name.includes(lowerQuery) ||
               type.includes(lowerQuery) ||
               rarity.includes(lowerQuery) ||
               theme.includes(lowerQuery) ||
               description.includes(lowerQuery);
      });

      // Refresh in background
      refreshItemsInBackground();
      
      return filtered;
    }

    // No cache, fetch from database (without images for speed)
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, created_at, item_data')
      .order('created_at', { ascending: false })
      .limit(500); // Limit to 500 most recent for performance

    if (error) {
      console.error('Failed to search items:', error);
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const filtered = (data || []).filter((item: any) => {
      const itemData = item.item_data || {};
      const name = itemData.name?.toLowerCase() || '';
      const type = itemData.type?.toLowerCase() || '';
      const rarity = itemData.rarity?.toLowerCase() || '';
      const theme = itemData.theme?.toLowerCase() || '';
      const description = itemData.description?.toLowerCase() || '';

      return name.includes(lowerQuery) ||
             type.includes(lowerQuery) ||
             rarity.includes(lowerQuery) ||
             theme.includes(lowerQuery) ||
             description.includes(lowerQuery);
    });

    const items = filtered.map((item: any) => ({
      itemData: item.item_data || {},
      imagePrompt: '', // Not needed for list view
      itemCard: '', // Not needed for list view
      imageUrl: null, // Will be fetched on demand
      id: item.id,
      created_at: item.created_at,
      savedAt: new Date(item.created_at).getTime(),
    })) as SavedMagicItem[];

    // Cache the full results for future searches
    const allItems = await fetchItemsFromDatabase();
    setCachedItems(allItems);

    return items;
  } catch (error) {
    console.error('Failed to search items:', error);
    return [];
  }
};
