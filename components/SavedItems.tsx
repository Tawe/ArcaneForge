import React, { useState, useEffect, useMemo } from 'react';
import { SavedMagicItem } from '../services/storageService';
import { getSavedItems, searchSavedItems, removeItem, getItemImageUrls } from '../services/storageService';
import { MagicItemResult } from '../types';

interface SavedItemsProps {
  onViewItem: (item: MagicItemResult) => void;
  onBack: () => void;
}

export const SavedItems: React.FC<SavedItemsProps> = ({ onViewItem, onBack }) => {
  const [savedItems, setSavedItems] = useState<SavedMagicItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const items = await getSavedItems();
      setSavedItems(items);
      
      // Load images in background (don't block UI)
      // Only load first 20 images immediately, rest load as needed
      const idsToLoad = items.slice(0, 20).map(item => item.id);
      getItemImageUrls(idsToLoad).then(urls => {
        setImageUrls(urls);
        
        // Load remaining images in background
        if (items.length > 20) {
          const remainingIds = items.slice(20).map(item => item.id);
          getItemImageUrls(remainingIds).then(remainingUrls => {
            setImageUrls(prev => ({ ...prev, ...remainingUrls }));
          });
        }
      });
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchResults = async (query: string) => {
    setIsLoading(true);
    try {
      const items = await searchSavedItems(query);
      setSavedItems(items);
      
      // Load images in background (don't block UI)
      // Only load first 20 images immediately
      const idsToLoad = items.slice(0, 20).map(item => item.id);
      getItemImageUrls(idsToLoad).then(urls => {
        setImageUrls(prev => ({ ...prev, ...urls }));
        
        // Load remaining images in background
        if (items.length > 20) {
          const remainingIds = items.slice(20).map(item => item.id);
          getItemImageUrls(remainingIds).then(remainingUrls => {
            setImageUrls(prev => ({ ...prev, ...remainingUrls }));
          });
        }
      });
    } catch (error) {
      console.error('Failed to search items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        loadSearchResults(searchQuery);
      } else {
        loadItems();
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    if (filterRarity === 'all') {
      return savedItems;
    }
    return savedItems.filter(item => item.itemData.rarity === filterRarity);
  }, [savedItems, filterRarity]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Remove this item from your collection?')) {
      try {
        await removeItem(id);
        await loadItems();
      } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Failed to remove item. Please try again.');
      }
    }
  };

  const rarityConfig: Record<string, { color: string; border: string }> = {
    'Common': { color: 'text-slate-400', border: 'border-slate-600' },
    'Uncommon': { color: 'text-emerald-400', border: 'border-emerald-600' },
    'Rare': { color: 'text-blue-400', border: 'border-blue-500' },
    'Very Rare': { color: 'text-purple-400', border: 'border-purple-500' },
    'Legendary': { color: 'text-amber-400', border: 'border-amber-500' },
    'Artifact': { color: 'text-red-500', border: 'border-red-500' },
  };

  const formatDate = (item: SavedMagicItem) => {
    const date = item.savedAt ? new Date(item.savedAt) : new Date(item.created_at);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Item card component with lazy image loading
  const ItemCard: React.FC<{
    item: SavedMagicItem;
    config: { color: string; border: string };
    onViewItem: (item: MagicItemResult) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    imageUrl: string | null | undefined;
  }> = ({ item, config, onViewItem, onDelete, imageUrl }) => {

    return (
      <div
        onClick={() => onViewItem(item)}
        className="relative bg-[#0f0f13] border border-[#2a2a35] rounded-md p-4 cursor-pointer hover:border-amber-600/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] group"
      >
        {/* Delete Button */}
        <button
          onClick={(e) => onDelete(item.id, e)}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-950/30 border border-red-900/50 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-950/50 text-xs"
          title="Remove from collection"
        >
          ×
        </button>

        {/* Item Image/Icon */}
        <div className={`aspect-square rounded mb-4 overflow-hidden border-2 ${config.border} bg-black relative`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.itemData.name}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // Hide broken images
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={(e) => {
                // Progressive enhancement: if this is a thumbnail, load full image
                const img = e.target as HTMLImageElement;
                if (img.naturalWidth < 300) {
                  // Likely a thumbnail, could load full image in background
                  // But for now, thumbnails are sufficient for list view
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#050505]">
              <span className="text-4xl opacity-30">🔮</span>
            </div>
          )}
          <div className={`absolute inset-0 opacity-10 pointer-events-none shadow-[inset_0_0_50px_currentColor] ${config.color}`}></div>
        </div>

        {/* Item Info */}
        <div>
          <h3 className={`text-lg font-fantasy font-bold mb-1 ${config.color} line-clamp-1`}>
            {item.itemData.name}
          </h3>
          <p className="text-xs text-slate-500 font-serif italic mb-2">
            {item.itemData.type} • {item.itemData.rarity}
          </p>
          <p className="text-sm text-slate-400 line-clamp-2 mb-3 font-serif">
            {item.itemData.description}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-mono">{formatDate(item)}</span>
            <span className="text-amber-600 font-fantasy">View →</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-fantasy font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 mb-2">
          ARCHIVED ARTIFACTS
        </h2>
        <p className="text-sm text-slate-500 font-mono">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} in collection
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-[#0f0f13] border border-[#2a2a35] rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-amber-600/80 mb-2 font-fantasy">
              Search Archives
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, type, rarity, theme..."
              className="w-full bg-[#050505] border border-[#2a2a35] text-slate-300 rounded-sm px-3 py-2 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-900 focus:outline-none transition-colors font-serif"
            />
          </div>

          {/* Rarity Filter */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-amber-600/80 mb-2 font-fantasy">
              Filter by Rarity
            </label>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="w-full bg-[#050505] border border-[#2a2a35] text-slate-300 rounded-sm px-3 py-2 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-900 focus:outline-none transition-colors font-serif"
            >
              <option value="all">All Rarities</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Very Rare">Very Rare</option>
              <option value="Legendary">Legendary</option>
              <option value="Artifact">Artifact</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-t-amber-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-amber-700 rounded-full animate-spin-reverse opacity-70"></div>
          </div>
          <p className="text-sm text-slate-500 font-mono mt-4">Loading archives...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
          <div className="w-24 h-24 border-2 border-dashed border-slate-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl filter grayscale">📚</span>
          </div>
          <h3 className="text-xl font-fantasy text-slate-500 tracking-widest mb-2">
            {savedItems.length === 0 ? 'ARCHIVES EMPTY' : 'NO MATCHES FOUND'}
          </h3>
          <p className="text-sm text-slate-600 font-mono">
            {savedItems.length === 0 
              ? 'Save items from the forge to build your collection'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            if (!item.itemData) {
              return null; // Skip items with missing data
            }
            return <ItemCard key={item.id} item={item} config={rarityConfig[item.itemData.rarity] || rarityConfig['Common']} onViewItem={onViewItem} onDelete={handleDelete} imageUrl={imageUrls[item.id] || item.imageUrl} />;
          })}
        </div>
      )}
    </div>
  );
};

