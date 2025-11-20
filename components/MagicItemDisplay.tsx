import React from 'react';
import { MagicItemResult } from '../types';

interface MagicItemDisplayProps {
  result: MagicItemResult;
}

export const MagicItemDisplay: React.FC<MagicItemDisplayProps> = ({ result }) => {
  const { itemData, itemCard, imageUrl } = result;

  const rarityConfig: Record<string, { color: string; border: string; shadow: string }> = {
    'Common': { color: 'text-slate-400', border: 'border-slate-600', shadow: 'shadow-slate-900' },
    'Uncommon': { color: 'text-emerald-400', border: 'border-emerald-600', shadow: 'shadow-emerald-900/40' },
    'Rare': { color: 'text-blue-400', border: 'border-blue-500', shadow: 'shadow-blue-900/40' },
    'Very Rare': { color: 'text-purple-400', border: 'border-purple-500', shadow: 'shadow-purple-900/40' },
    'Legendary': { color: 'text-amber-400', border: 'border-amber-500', shadow: 'shadow-amber-900/40' },
    'Artifact': { color: 'text-red-500', border: 'border-red-500', shadow: 'shadow-red-900/40' },
  };

  const config = rarityConfig[itemData.rarity] || rarityConfig['Common'];

  // Helper to parse inline markdown (bold/italic)
  const renderInlineMarkdown = (text: string) => {
    // Split by bold (**...**) and italic (*...*) markers
    // Note: simplistic parser, might struggle with nested styles but sufficient for this use case
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[#1a1a1a]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-[#4a4a4a]">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  // Helper to render the card content
  const renderCardContent = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-3"></div>;

      // Skip if the line is just the Item Name (since we print it in the header)
      if (index < 3 && trimmed.toLowerCase().includes(itemData.name.toLowerCase()) && trimmed.length < itemData.name.length + 10) {
        return null;
      }

      // Skip if the line contains type, rarity, and attunement info (already in header)
      const lowerTrimmed = trimmed.toLowerCase();
      const hasType = lowerTrimmed.includes(itemData.type.toLowerCase());
      const hasRarity = lowerTrimmed.includes(itemData.rarity.toLowerCase());
      const hasAttunement = lowerTrimmed.includes('attunement') || lowerTrimmed.includes('requires attunement');
      
      // If it has type, rarity, and possibly attunement, it's likely the redundant header line
      if (index < 5 && hasType && hasRarity) {
        return null;
      }

      // Headers: Starts with # or is a short bold line (e.g. "**Hidden Curse**")
      const isHeader = trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 40 && !trimmed.includes(':'));
      
      if (isHeader) {
        const content = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
        return (
          <h4 key={index} className="font-bold font-fantasy text-[#7a2020] text-xl mt-6 mb-2 border-b border-[#7a2020]/30 pb-1">
            {content}
          </h4>
        );
      }

      // Lists: Starts with - or *
      if (trimmed.match(/^[-*•]\s/)) {
        const content = trimmed.replace(/^[-*•]\s/, '');
        return (
           <div key={index} className="flex items-start gap-3 mb-2 pl-2 text-[#2c2c2c]">
              <span className="text-[#922828] text-[10px] mt-[6px] transform rotate-45">◆</span>
              <p className="leading-relaxed text-lg">{renderInlineMarkdown(content)}</p>
           </div>
        );
      }

      // Standard Paragraph
      return (
        <p key={index} className="mb-3 text-[#2c2c2c] leading-relaxed text-lg font-serif">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in pb-20">
      
      {/* Left Column: Visual & Quick Stats */}
      <div className="space-y-6">
        
        {/* Image Frame */}
        <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${config.border} bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)] group`}>
            {/* Rarity Glow */}
            <div className={`absolute inset-0 opacity-20 pointer-events-none shadow-[inset_0_0_100px_currentColor] ${config.color}`}></div>
            
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={itemData.name} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f13]">
                 <div className="text-6xl animate-pulse grayscale opacity-20">🔮</div>
              </div>
            )}

             {/* Overlay Details */}
             <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-12">
                <h2 className={`text-2xl font-fantasy font-bold tracking-wide ${config.color} drop-shadow-md`}>
                  {itemData.name}
                </h2>
                <p className="text-slate-400 font-serif italic text-lg">
                  {itemData.rarity} {itemData.type}
                </p>
             </div>
        </div>

        {/* Price Tag */}
        <div className="bg-[#0f0f13] border border-[#2a2a35] p-4 rounded flex justify-between items-center">
            <span className="text-xs font-fantasy text-slate-500 uppercase tracking-widest">Estimated Value</span>
            <div className="flex items-center gap-2">
               <span className="text-amber-500 text-xl font-serif font-bold">{itemData.price_gp.toLocaleString()}</span>
               <span className="text-xs text-amber-700">gp</span>
            </div>
        </div>

         {/* JSON Data (Collapsed) */}
         <details className="group">
            <summary className="text-[10px] uppercase tracking-widest text-slate-600 cursor-pointer hover:text-indigo-400 transition-colors list-none flex items-center gap-2">
               <span className="w-2 h-2 border-l border-b border-current transform -rotate-45 group-open:rotate-0 transition-transform"></span>
               Inspect Arcane Matrix (JSON)
            </summary>
            <div className="mt-2 p-4 bg-black/50 rounded border border-slate-800/50 overflow-hidden">
              <pre className="text-xs font-mono text-emerald-500/80 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(itemData, null, 2)}
              </pre>
            </div>
        </details>
      </div>


      {/* Right Column: The Physical Item Card */}
      <div className="relative perspective-1000">
        <div className="relative bg-[#e3dacb] text-[#1a1a1a] p-8 sm:p-12 shadow-[0_5px_30px_rgba(0,0,0,0.6)] min-h-[600px] transform rotate-1 transition-transform duration-500 hover:rotate-0">
            
            {/* Texture Overlays */}
            <div className="absolute inset-0 opacity-40 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] mix-blend-multiply"></div>
            <div className="absolute inset-0 border-[6px] border-double border-[#4a4a3a] opacity-40 pointer-events-none m-3"></div>
            
            {/* Card Content */}
            <div className="relative z-10 font-serif">
                {/* Header */}
                <div className="border-b-2 border-[#922828] pb-4 mb-6 text-center">
                   <h3 className="text-3xl md:text-4xl font-bold font-fantasy text-[#922828] uppercase tracking-wide mb-2 leading-none">
                     {itemData.name}
                   </h3>
                   <p className="text-lg italic text-[#4a4a4a] font-semibold">
                     {itemData.rarity} {itemData.type}
                   </p>
                   {itemData.mechanics.attunement && (
                      <p className="text-sm font-bold text-[#58180d] uppercase tracking-widest mt-1">
                        (Requires Attunement)
                      </p>
                   )}
                </div>

                {/* Formatted Text Body */}
                <div>
                  {renderCardContent(itemCard)}
                </div>

                {/* Footer Flavor */}
                <div className="mt-12 pt-4 border-t border-[#4a4a3a]/20 text-center">
                   <p className="text-xs font-fantasy text-[#6a6a5a] uppercase tracking-[0.2em]">
                      From the Archives of the Arcane Forge
                   </p>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};
