import { MagicItemResult } from '../types';
import { supabase } from './supabaseClient';
import { generateThumbnail } from './imageUtils';

export interface SavedMagicItem extends MagicItemResult {
  id: string;
  created_at: string; // ISO timestamp from Supabase
}

// Database table name
const TABLE_NAME = 'magic_items';

// Cache keys
const CACHE_KEY_ITEMS = 'arcane-forge-items-cache';
const CACHE_KEY_TIMESTAMP = 'arcane-forge-items-cache-timestamp';
const CACHE_KEY_IMAGE_URLS = 'arcane-forge-image-urls-cache'; // Separate cache for image URLs
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if Supabase is properly configured
 */
const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!(url && url !== '' && !url.includes('placeholder'));
};

/**
 * Get cached image URL flags from localStorage
 * We only cache a boolean flag indicating if an item has a thumbnail,
 * not the actual base64 string (to avoid quota issues)
 */
const getCachedImageUrlFlags = (): Record<string, boolean> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_IMAGE_URLS);
    if (!cached) {
      return {};
    }
    return JSON.parse(cached) as Record<string, boolean>;
  } catch (error) {
    console.warn('Failed to read image URL flags cache:', error);
    return {};
  }
};

/**
 * Save image URL flags to localStorage cache
 * Only stores boolean flags (has thumbnail: true/false), not the actual base64 strings
 * This prevents quota issues while still allowing us to know which items have thumbnails
 */
const setCachedImageUrlFlags = (urls: Record<string, string | null>): void => {
  try {
    // Convert to flags: only store boolean indicating if item has a thumbnail
    const flags: Record<string, boolean> = {};
    Object.entries(urls).forEach(([id, url]) => {
      flags[id] = url !== null && url !== undefined;
    });
    
    // Merge with existing cache
    const existing = getCachedImageUrlFlags();
    const merged = { ...existing, ...flags };
    
    // Limit cache size to prevent quota issues (keep only most recent 500)
    const entries = Object.entries(merged);
    if (entries.length > 500) {
      // Keep the most recent 500 entries
      const limited = Object.fromEntries(entries.slice(-500));
      localStorage.setItem(CACHE_KEY_IMAGE_URLS, JSON.stringify(limited));
    } else {
      localStorage.setItem(CACHE_KEY_IMAGE_URLS, JSON.stringify(merged));
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Image URL flags cache quota exceeded, clearing...');
      try {
        localStorage.removeItem(CACHE_KEY_IMAGE_URLS);
      } catch (clearError) {
        // Ignore
      }
    } else {
      console.warn('Failed to write image URL flags cache:', error);
    }
  }
};

/**
 * Get cached items from localStorage
 * Returns lightweight items (without imageUrl, imagePrompt, itemCard)
 * Image URLs are restored from separate cache
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
    // Note: We don't restore image URLs from cache anymore to avoid quota issues
    // Image URLs will be fetched from database when needed (they're already in the query)
    // The items from fetchItemsFromDatabase already include thumbnails
    
    // Restore to SavedMagicItem format
    return items.map(item => ({
      ...item,
      imagePrompt: '', // Will be fetched on demand
      itemCard: '', // Will be fetched on demand
      imageUrl: item.imageUrl || null, // Keep imageUrl if it was in the cached item
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
 * Includes thumbnail URLs (they're small now: 150x150 at 0.5 quality)
 * Excludes full image URLs, imagePrompt, and itemCard to save space
 */
const setCachedItems = (items: SavedMagicItem[]): void => {
  try {
    // Include thumbnail URLs since they're now smaller (150x150, 0.5 quality)
    // This allows images to persist across navigation without quota issues
    const lightweightItems = items.map(item => ({
      id: item.id,
      created_at: item.created_at,
      savedAt: item.savedAt,
      itemData: item.itemData,
      imageUrl: item.imageUrl || null, // Include thumbnail URLs (small enough now)
      // Exclude imagePrompt and itemCard to save space (fetched on demand)
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
 * Includes thumbnail_url for fast progressive loading
 */
const fetchItemsFromDatabase = async (limit?: number): Promise<SavedMagicItem[]> => {
  try {
    // CRITICAL: Only fetch thumbnail_url, NOT image_url
    // image_url contains full base64 images which are HUGE (can be 1-2MB each)
    // thumbnail_url contains compressed thumbnails (much smaller, ~50-100KB each)
    // item_data is JSONB with text fields only (relatively small)
    let query = supabase
      .from(TABLE_NAME)
      .select('id, created_at, item_data, thumbnail_url') // Removed image_url - this is the main culprit!
      .order('created_at', { ascending: false });
    
    // Always limit queries to prevent huge payloads
    const queryLimit = limit || 100; // Reduced default from 500 to 100
    query = query.limit(queryLimit);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load saved items:', error);
      return [];
    }

    const items = (data || []).map((item: any) => ({
      itemData: item.item_data || {},
      imagePrompt: '', // Not needed for list view
      itemCard: '', // Not needed for list view
      imageUrl: item.thumbnail_url || null, // Only use thumbnail (much smaller than full image)
      id: item.id,
      created_at: item.created_at,
      savedAt: new Date(item.created_at).getTime(),
    })) as SavedMagicItem[];

    // Cache the results (will handle quota errors gracefully)
    // Note: items already include imageUrl (thumbnails), so they're cached with the items
    setCachedItems(items);
    
    // Cache flags indicating which items have thumbnails (not the actual base64 strings)
    const imageUrlFlags: Record<string, string | null> = {};
    items.forEach(item => {
      imageUrlFlags[item.id] = item.imageUrl;
    });
    if (Object.keys(imageUrlFlags).length > 0) {
      setCachedImageUrlFlags(imageUrlFlags);
    }
    
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
    // Generate thumbnail if we have an image
    // Using smaller dimensions (150x150) and balanced quality (0.6) for good visual quality
    // This keeps file size reasonable while maintaining good image quality in list views
    let thumbnailUrl: string | null = null;
    if (item.imageUrl) {
      try {
        thumbnailUrl = await generateThumbnail(item.imageUrl, 150, 150, 0.6);
      } catch (thumbError) {
        console.warn('Failed to generate thumbnail, saving without it:', thumbError);
        // Continue without thumbnail
      }
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        item_data: item.itemData,
        image_prompt: item.imagePrompt,
        item_card: item.itemCard,
        image_url: item.imageUrl || null,
        thumbnail_url: thumbnailUrl,
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
 * Batch load thumbnail URLs for multiple items (for list views)
 * Uses thumbnails for fast progressive loading
 */
export const getItemImageUrls = async (ids: string[], useThumbnails: boolean = true): Promise<Record<string, string | null>> => {
  if (!isSupabaseConfigured() || ids.length === 0) {
    return {};
  }

  try {
    // Don't check localStorage cache for base64 strings (to avoid quota issues)
    // Always fetch from database - it's fast since we're only fetching thumbnails
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 50) {
      chunks.push(ids.slice(i, i + 50));
    }

    const fetchedResults: Record<string, string | null> = {};
    const fieldToSelect = useThumbnails ? 'id, thumbnail_url' : 'id, image_url';
    
    // Load chunks in parallel for better performance
    await Promise.all(chunks.map(async (chunk) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(fieldToSelect)
        .in('id', chunk);

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      (data || []).forEach(item => {
        if (useThumbnails) {
          fetchedResults[item.id] = item.thumbnail_url || null;
        } else {
          fetchedResults[item.id] = item.image_url || null;
        }
      });
    }));
    
    // Cache flags (not the actual base64 strings) to track which items have thumbnails
    if (Object.keys(fetchedResults).length > 0) {
      setCachedImageUrlFlags(fetchedResults);
    }
    
    return fetchedResults;
  } catch (error) {
    console.error('Failed to get item images:', error);
    return {};
  }
};

/**
 * Load full-size image for an item (for detail view)
 */
export const getItemFullImageUrl = async (id: string): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('image_url')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return data.image_url || null;
  } catch (error) {
    console.error('Failed to get full image:', error);
    return null;
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

    // No cache, fetch from database (without image_url for performance)
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, created_at, item_data, thumbnail_url') // Removed image_url - too large!
      .order('created_at', { ascending: false })
      .limit(100); // Limit to 100 results for performance

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
      imageUrl: item.thumbnail_url || null, // Only use thumbnail (much smaller)
      id: item.id,
      created_at: item.created_at,
      savedAt: new Date(item.created_at).getTime(),
    })) as SavedMagicItem[];

    // Cache the full results for future searches
    const allItems = await fetchItemsFromDatabase();
    setCachedItems(allItems);
    
    // Cache flags indicating which items have thumbnails (not the actual base64 strings)
    const imageUrlFlags: Record<string, string | null> = {};
    items.forEach(item => {
      imageUrlFlags[item.id] = item.imageUrl;
    });
    if (Object.keys(imageUrlFlags).length > 0) {
      setCachedImageUrlFlags(imageUrlFlags);
    }

    return items;
  } catch (error) {
    console.error('Failed to search items:', error);
    return [];
  }
};
