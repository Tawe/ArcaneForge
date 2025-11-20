import React, { useState, useEffect } from 'react';
import { SavedMagicItem, getItemImageUrls } from '../services/storageService';
import { MagicItemResult } from '../types';

interface RecentItemsProps {
  items: SavedMagicItem[];
  onViewItem: (item: MagicItemResult) => void;
}

// Recent item card with lazy image loading
const RecentItemCard: React.FC<{
  item: SavedMagicItem;
  config: { color: string; border: string };
  onViewItem: (item: MagicItemResult) => void;
  imageUrl: string | null | undefined;
}> = ({ item, config, onViewItem, imageUrl }) => {

  return (
    <div
      onClick={() => onViewItem(item)}
      className="relative bg-[#0f0f13] border border-[#2a2a35] rounded-md p-3 cursor-pointer hover:border-amber-600/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] group"
    >
      {/* Item Image/Icon */}
      <div className={`aspect-square rounded mb-3 overflow-hidden border-2 ${config.border} bg-black relative`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.itemData.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#050505]">
            <span className="text-2xl opacity-30">🔮</span>
          </div>
        )}
        <div className={`absolute inset-0 opacity-10 pointer-events-none shadow-[inset_0_0_30px_currentColor] ${config.color}`}></div>
      </div>

      {/* Item Info */}
      <div>
        <h3 className={`text-sm font-fantasy font-bold mb-1 ${config.color} line-clamp-1`}>
          {item.itemData.name}
        </h3>
        <p className="text-[10px] text-slate-500 font-serif italic line-clamp-1">
          {item.itemData.type}
        </p>
      </div>
    </div>
  );
};

export const RecentItems: React.FC<RecentItemsProps> = ({ items, onViewItem }) => {
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    // Batch load images when items change
    if (items.length > 0) {
      const ids = items.map(item => item.id);
      getItemImageUrls(ids).then(urls => {
        setImageUrls(urls);
      }).catch(err => {
        console.warn('Failed to load images:', err);
      });
    }
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const rarityConfig: Record<string, { color: string; border: string }> = {
    'Common': { color: 'text-slate-400', border: 'border-slate-600' },
    'Uncommon': { color: 'text-emerald-400', border: 'border-emerald-600' },
    'Rare': { color: 'text-blue-400', border: 'border-blue-500' },
    'Very Rare': { color: 'text-purple-400', border: 'border-purple-500' },
    'Legendary': { color: 'text-amber-400', border: 'border-amber-500' },
    'Artifact': { color: 'text-red-500', border: 'border-red-500' },
  };

  return (
    <section className="mt-20 pt-12 border-t border-[#2a2a35]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-fantasy font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 mb-6">
          RECENT FORGINGS
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((item) => {
            if (!item.itemData) {
              return null;
            }
            return <RecentItemCard key={item.id} item={item} config={rarityConfig[item.itemData.rarity] || rarityConfig['Common']} onViewItem={onViewItem} imageUrl={imageUrls[item.id] || item.imageUrl} />;
          })}
        </div>
      </div>
    </section>
  );
};

