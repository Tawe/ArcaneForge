import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById } from '../services/storageService';
import { MagicItemDisplay } from '../components/MagicItemDisplay';
import { MagicItemResult } from '../types';
import { useMetaTags } from '../hooks/useMetaTags';

export const ItemView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MagicItemResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        setError('No item ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const loadedItem = await getItemById(id);
        
        if (!loadedItem) {
          setError('Item not found');
          setIsLoading(false);
          return;
        }

        setItem(loadedItem);
      } catch (err) {
        console.error('Failed to load item:', err);
        setError('Failed to load item');
      } finally {
        setIsLoading(false);
      }
    };

    loadItem();
  }, [id]);

  // Set up meta tags for sharing
  const getImageUrl = () => {
    if (!item?.imageUrl) {
      return `${window.location.origin}/favicon.svg`;
    }
    // If it's a base64 data URL, we can't use it for OG tags
    // Social media crawlers need publicly accessible URLs
    // For now, fall back to favicon if it's base64
    if (item.imageUrl.startsWith('data:')) {
      return `${window.location.origin}/favicon.svg`;
    }
    // If it's already a full URL, use it
    if (item.imageUrl.startsWith('http')) {
      return item.imageUrl;
    }
    // Otherwise, make it absolute
    return `${window.location.origin}${item.imageUrl}`;
  };

  useMetaTags({
    title: item ? `${item.itemData.name} - Arcane Forge` : 'Arcane Forge',
    description: item 
      ? `${item.itemData.name} - ${item.itemData.rarity} ${item.itemData.type}. ${item.itemData.description.substring(0, 150)}...`
      : 'Generate unique D&D magic items with AI',
    image: getImageUrl(),
    url: item ? `${window.location.origin}/item/${item.id}` : window.location.origin,
    type: 'website',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen text-slate-300 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-t-amber-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-amber-700 rounded-full animate-spin-reverse opacity-70"></div>
        </div>
        <p className="text-sm text-slate-500 font-mono mt-4">Loading item...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen text-slate-300 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-fantasy text-red-400 mb-4">Item Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'The requested item could not be found.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-950/30 border border-amber-600 text-amber-400 rounded font-fantasy uppercase tracking-wider hover:bg-amber-950/50 transition-colors"
          >
            Return to Forge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-300">
      {/* Header */}
      <header className="border-b border-[#1f1f23] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 bg-gradient-to-tr from-amber-700 to-amber-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] text-black font-bold text-2xl hover:scale-110 transition-transform"
            >
              ⚒
            </button>
            <div>
              <h1 className="text-2xl font-fantasy font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 drop-shadow-sm">
                ARCANE FORGE
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded text-sm font-fantasy uppercase tracking-wider transition-colors bg-[#0f0f13] border border-[#2a2a35] text-slate-400 hover:text-amber-400 hover:border-amber-600/50"
          >
            Back to Forge
          </button>
        </div>
      </header>

      {/* Item Display */}
      <main className="p-6 md:p-8 lg:p-12">
        <MagicItemDisplay result={item} />
      </main>
    </div>
  );
};

