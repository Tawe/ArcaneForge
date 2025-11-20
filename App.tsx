import React, { useState } from 'react';
import { GenerationSettings, MagicItemResult } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateMagicItemText, generateMagicItemImage } from './services/geminiService';
import { GeneratorForm } from './components/GeneratorForm';
import { MagicItemDisplay } from './components/MagicItemDisplay';

const App: React.FC = () => {
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MagicItemResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      try {
        const imageUrl = await generateMagicItemImage(content.imagePrompt);
        setResult({ ...content, imageUrl });
      } catch (imgErr) {
        console.warn("Visual manifestation failed, but the scroll was written.", imgErr);
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
              <p className="text-[10px] text-indigo-400/60 font-mono tracking-widest uppercase">
                Artificer's Compendium v1.0
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 md:p-8 lg:p-12">
        
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

      </main>
    </div>
  );
};

export default App;