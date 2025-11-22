import React, { useState, useEffect, useMemo } from 'react';
import { SavedMagicItem } from '../services/storageService';
import { getSavedItems, searchSavedItems, removeItem, getItemImageUrls, getSavedItemsCount } from '../services/storageService';
import { MagicItemResult } from '../types';

interface SavedItemsProps {
  onViewItem: (item: MagicItemResult) => void;
  onBack: () => void;
}

const ITEMS_PER_PAGE = 12;

export const SavedItems: React.FC<SavedItemsProps> = ({ onViewItem, onBack }) => {
  const [savedItems, setSavedItems] = useState<SavedMagicItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadItems = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const items = await getSavedItems(ITEMS_PER_PAGE, offset);
      setSavedItems(items);
      
      // Get total count (only on first page load or when not searching)
      if (page === 1 && !searchQuery.trim()) {
        const count = await getSavedItemsCount();
        setTotalCount(count);
      }
      
      // Build imageUrls map from items (they already have thumbnails from fetchItemsFromDatabase)
      const existingUrls: Record<string, string | null> = {};
      const itemsWithoutThumbnails: string[] = [];
      
      items.forEach(item => {
        if (item.imageUrl) {
          existingUrls[item.id] = item.imageUrl;
        } else {
          itemsWithoutThumbnails.push(item.id);
        }
      });
      setImageUrls(prev => ({ ...prev, ...existingUrls }));
      
      // For items without thumbnails, fetch full images as fallback (lazy load)
      if (itemsWithoutThumbnails.length > 0) {
        // Fetch in batches to avoid overwhelming the network
        const batchSize = 10;
        for (let i = 0; i < itemsWithoutThumbnails.length; i += batchSize) {
          const batch = itemsWithoutThumbnails.slice(i, i + batchSize);
          getItemImageUrls(batch, false).then(fullImageUrls => {
            setImageUrls(prev => ({ ...prev, ...fullImageUrls }));
          }).catch(err => {
            console.warn('Failed to load fallback images:', err);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchResults = async (query: string, page: number = 1) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const items = await searchSavedItems(query, ITEMS_PER_PAGE, offset);
      setSavedItems(items);
      
      // For search, we don't have an easy way to get total count without fetching all
      // So we'll estimate based on whether we got a full page
      if (items.length < ITEMS_PER_PAGE) {
        setTotalCount((page - 1) * ITEMS_PER_PAGE + items.length);
      } else {
        // Might be more, but we'll update when user navigates
        setTotalCount(page * ITEMS_PER_PAGE);
      }
      
      // Items from search may not have thumbnails, so fetch them
      const idsToLoad = items.map(item => item.id);
      getItemImageUrls(idsToLoad, true).then(urls => {
        setImageUrls(prev => ({ ...prev, ...urls }));
      });
    } catch (error) {
      console.error('Failed to search items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems(1);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    // Reset to page 1 when search changes
    setCurrentPage(1);
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        loadSearchResults(searchQuery, 1);
      } else {
        loadItems(1);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    // Reset to page 1 when rarity filter changes
    setCurrentPage(1);
    // Load items for page 1 with current filter
    if (searchQuery.trim()) {
      loadSearchResults(searchQuery, 1);
    } else {
      loadItems(1);
    }
  }, [filterRarity]);

  // Note: Page loading is now handled directly in handlePageChange
  // This effect only handles cases where currentPage changes outside of user navigation
  // (e.g., when search/filter resets to page 1, which already loads data)

  const filteredItems = useMemo(() => {
    // Apply rarity filter to current page items
    if (filterRarity === 'all') {
      return savedItems;
    }
    return savedItems.filter(item => item.itemData.rarity === filterRarity);
  }, [savedItems, filterRarity]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Remove this item from your collection?')) {
      try {
        await removeItem(id);
        // Reload current page
        if (searchQuery.trim()) {
          await loadSearchResults(searchQuery, currentPage);
        } else {
          await loadItems(currentPage);
        }
        // Update total count
        const count = await getSavedItemsCount();
        setTotalCount(count);
      } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Failed to remove item. Please try again.');
      }
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    // Load data directly when user navigates
    if (searchQuery.trim()) {
      await loadSearchResults(searchQuery, newPage);
    } else {
      await loadItems(newPage);
    }
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <p className="text-xs text-slate-500 font-serif italic mb-1">
            {item.itemData.type} • {item.itemData.rarity}
          </p>
          {item.itemData.powerBand && (
            <p className="text-xs text-amber-500/80 font-fantasy uppercase tracking-wider mb-2">
              Resonance: {item.itemData.powerBand}
            </p>
          )}
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
          {totalCount > 0 ? (
            <>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </>
          ) : (
            '0 items in collection'
          )}
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              if (!item.itemData) {
                return null; // Skip items with missing data
              }
              // Use thumbnail from imageUrls state if available, otherwise use item.imageUrl (from initial fetch)
              const thumbnailUrl = imageUrls[item.id] !== undefined ? imageUrls[item.id] : item.imageUrl;
              return <ItemCard key={item.id} item={item} config={rarityConfig[item.itemData.rarity] || rarityConfig['Common']} onViewItem={onViewItem} onDelete={handleDelete} imageUrl={thumbnailUrl} />;
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage || isLoading}
                className={`px-4 py-2 bg-[#0f0f13] border border-[#2a2a35] rounded text-sm font-fantasy uppercase tracking-wider transition-colors ${
                  hasPrevPage && !isLoading
                    ? 'text-amber-400 hover:border-amber-600 hover:bg-amber-950/20 cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                ← Prev
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={`w-10 h-10 rounded text-sm font-fantasy transition-colors ${
                        currentPage === pageNum
                          ? 'bg-amber-950/30 border border-amber-600 text-amber-400'
                          : 'bg-[#0f0f13] border border-[#2a2a35] text-slate-400 hover:border-amber-600/50 hover:text-amber-400'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage || isLoading}
                className={`px-4 py-2 bg-[#0f0f13] border border-[#2a2a35] rounded text-sm font-fantasy uppercase tracking-wider transition-colors ${
                  hasNextPage && !isLoading
                    ? 'text-amber-400 hover:border-amber-600 hover:bg-amber-950/20 cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

