import React, { useState, useEffect, lazy, Suspense } from 'react';
import { GenerationSettings, MagicItemResult } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateMagicItemText, generateMagicItemImage } from './services/geminiService';
import { saveItem, getSavedItems, SavedMagicItem } from './services/storageService';
import { GeneratorForm } from './components/GeneratorForm';
import { MagicItemDisplay } from './components/MagicItemDisplay';

// Lazy load components that aren't needed immediately
const SavedItems = lazy(() => import('./components/SavedItems').then(module => ({ default: module.SavedItems })));
const RecentItems = lazy(() => import('./components/RecentItems').then(module => ({ default: module.RecentItems })));

type ViewMode = 'generate' | 'saved';

const App: React.FC = () => {
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MagicItemResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('generate');
  const [recentItems, setRecentItems] = useState<SavedMagicItem[]>([]);

  // Load recent items when on generate view (defer initial load)
  useEffect(() => {
    if (viewMode === 'generate') {
      // Defer loading recent items slightly to prioritize initial render
      const timer = setTimeout(() => {
        loadRecentItems();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  const loadRecentItems = async () => {
    try {
      const items = await getSavedItems(6); // Only fetch 6 items
      setRecentItems(items);
    } catch (error) {
      console.error('Failed to load recent items:', error);
    }
  };

  const handleGenerate = async () => {
    if (!process.env.API_KEY) {
      setError("API Key is missing. The forge cannot operate without fuel.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Generate Text Content
      const content = await generateMagicItemText(settings);
      
      // Update UI immediately with text while image loads
      const partialResult: MagicItemResult = { ...content };
      setResult(partialResult);

      // Step 2: Generate Image
      let finalResult = partialResult;
      try {
        const imageUrl = await generateMagicItemImage(content.imagePrompt, settings.style);
        finalResult = { ...content, imageUrl };
        setResult(finalResult);
      } catch (imgErr) {
        // Image generation failed (likely quota/API limits), but item was created successfully
        console.warn("Visual manifestation failed, but the scroll was written.", imgErr);
        // Result already set with text content, so we continue without image
      }

      // Step 3: Automatically save to database (silently fails if Supabase not configured)
      try {
        const saved = await saveItem(finalResult);
        if (saved) {
          console.log('Item automatically saved to archives');
          // Reload recent items to show the new one
          await loadRecentItems();
        }
      } catch (saveErr) {
        // Only log if it's an unexpected error (not just missing config)
        if (!saveErr?.message?.includes('not configured')) {
          console.warn('Failed to save item to database:', saveErr);
        }
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "The arcane rituals failed unexpectedly.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-300 flex flex-col selection:bg-amber-900 selection:text-amber-100">
      
      {/* Global Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
         <div className="absolute inset-0 bg-[#050505]"></div>
         {/* Subtle Radial Glow from top */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
         {/* Texture overlay */}
         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      </div>

      {/* Header */}
      <header className="border-b border-[#1f1f23] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-700 to-amber-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] text-black font-bold text-2xl">
              ⚒
            </div>
            <div>
              <h1 className="text-2xl font-fantasy font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 drop-shadow-sm">
                ARCANE FORGE
              </h1>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('generate')}
              className={`px-4 py-2 rounded text-sm font-fantasy uppercase tracking-wider transition-colors ${
                viewMode === 'generate'
                  ? 'bg-amber-950/30 border border-amber-600 text-amber-400'
                  : 'bg-[#0f0f13] border border-[#2a2a35] text-slate-400 hover:text-amber-400 hover:border-amber-600/50'
              }`}
            >
              Forge
            </button>
            <button
              onClick={() => setViewMode('saved')}
              className={`px-4 py-2 rounded text-sm font-fantasy uppercase tracking-wider transition-colors ${
                viewMode === 'saved'
                  ? 'bg-amber-950/30 border border-amber-600 text-amber-400'
                  : 'bg-[#0f0f13] border border-[#2a2a35] text-slate-400 hover:text-amber-400 hover:border-amber-600/50'
              }`}
            >
              Archives
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow p-6 md:p-8 lg:p-12">
        {viewMode === 'saved' ? (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-t-amber-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-amber-700 rounded-full animate-spin-reverse opacity-70"></div>
              </div>
              <p className="text-sm text-slate-500 font-mono mt-4">Loading archives...</p>
            </div>
          }>
            <SavedItems
              onViewItem={async (item) => {
                // If item doesn't have full data, fetch it
                if (!item.itemCard || !item.imagePrompt) {
                  const { getItemById } = await import('./services/storageService');
                  const fullItem = await getItemById(item.id);
                  if (fullItem) {
                    setResult(fullItem);
                  } else {
                    setResult(item);
                  }
                } else {
                  setResult(item);
                }
                setViewMode('generate');
              }}
              onBack={() => setViewMode('generate')}
            />
          </Suspense>
        ) : (
          <>
            {/* Form Area */}
            <section className="mb-16 animate-slide-down">
              <GeneratorForm 
                settings={settings} 
                onSettingsChange={setSettings} 
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />

              {error && (
                <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded text-red-300 text-center text-sm max-w-2xl mx-auto font-serif italic">
                  ⚠️ {error}
                </div>
              )}
            </section>

            {/* Output Area */}
            <section className="w-full">
              
              {/* Empty State */}
              {!result && !isGenerating && !error && (
                <div className="flex flex-col items-center justify-center opacity-20 py-20 select-none">
                    <div className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-full flex items-center justify-center mb-6">
                       <span className="text-6xl filter grayscale">📜</span>
                    </div>
                    <h3 className="text-3xl font-fantasy text-slate-500 tracking-widest">THE ANVIL AWAITS</h3>
                </div>
              )}
              
              {/* Loading State */}
              {isGenerating && !result && (
                  <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                    <div className="relative w-24 h-24">
                       <div className="absolute inset-0 border-4 border-t-amber-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                       <div className="absolute inset-2 border-4 border-t-transparent border-r-indigo-500 border-b-transparent border-l-amber-700 rounded-full animate-spin-reverse opacity-70"></div>
                    </div>
                    <h3 className="text-2xl font-fantasy text-amber-500 mt-8 tracking-widest">Communing with the Weave...</h3>
                    <p className="text-sm text-indigo-400 font-mono mt-2">Forging lore and light</p>
                  </div>
              )}

              {/* Results */}
              {result && (
                <MagicItemDisplay result={result} />
              )}
            </section>

            {/* Recent Items */}
            {recentItems.length > 0 && (
              <Suspense fallback={null}>
                <RecentItems 
                  items={recentItems} 
                  onViewItem={async (item) => {
                    // If item doesn't have full data, fetch it
                    if (!item.itemCard || !item.imagePrompt) {
                      const { getItemById } = await import('./services/storageService');
                      const fullItem = await getItemById(item.id);
                      if (fullItem) {
                        setResult(fullItem);
                      } else {
                        setResult(item);
                      }
                    } else {
                      setResult(item);
                    }
                    // Scroll to top to show the item
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </Suspense>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f1f23] bg-[#050505]/80 backdrop-blur-md py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500">
            Created by{' '}
            <a 
              href="https://johnmunn.tech" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 transition-colors underline decoration-amber-600/50 hover:decoration-amber-500"
            >
              johnmunn.tech
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;