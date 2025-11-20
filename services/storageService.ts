import { MagicItemResult } from '../types';
import { supabase } from './supabaseClient';

export interface SavedMagicItem extends MagicItemResult {
  id: string;
  created_at: string; // ISO timestamp from Supabase
}

// Database table name
const TABLE_NAME = 'magic_items';

/**
 * Check if Supabase is properly configured
 */
const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!(url && url !== '' && !url.includes('placeholder'));
};

/**
 * Get all saved magic items from Supabase
 * Optimized to only fetch necessary fields for list display
 */
export const getSavedItems = async (limit?: number): Promise<SavedMagicItem[]> => {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('id, created_at, item_data, image_url')
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load saved items:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      itemData: item.item_data,
      imagePrompt: '', // Not needed for list view
      itemCard: '', // Not needed for list view
      imageUrl: item.image_url,
      id: item.id,
      created_at: item.created_at,
      savedAt: new Date(item.created_at).getTime(),
    })) as SavedMagicItem[];
  } catch (error) {
    console.error('Failed to load saved items:', error);
    return [];
  }
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

    return {
      ...item,
      id: data.id,
      created_at: data.created_at,
      savedAt: new Date(data.created_at).getTime(),
    };
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
  } catch (error) {
    console.error('Failed to remove item:', error);
    throw error;
  }
};

/**
 * Get a saved item by ID with full data (for viewing)
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
 * Search saved items by name, type, rarity, or theme
 * Optimized to fetch only necessary fields and limit results
 */
export const searchSavedItems = async (query: string): Promise<SavedMagicItem[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    if (!query.trim()) {
      return await getSavedItems();
    }

    // Fetch limited items and filter client-side
    // This is still faster than fetching everything
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, created_at, item_data, image_url')
      .order('created_at', { ascending: false })
      .limit(200); // Limit to 200 most recent for performance

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

    return filtered.map((item: any) => ({
      itemData: item.item_data || {},
      imagePrompt: '', // Not needed for list view
      itemCard: '', // Not needed for list view
      imageUrl: item.image_url || null,
      id: item.id,
      created_at: item.created_at,
      savedAt: new Date(item.created_at).getTime(),
    })) as SavedMagicItem[];
  } catch (error) {
    console.error('Failed to search items:', error);
    return [];
  }
};
