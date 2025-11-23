import React from 'react';
import { GenerationSettings, Rarity, PowerBand } from '../types';
import { RARITIES, POWER_BANDS, ITEM_TYPES, THEMES, VISUAL_STYLES } from '../constants';
import { Button } from './Button';

interface GeneratorFormProps {
  settings: GenerationSettings;
  onSettingsChange: (newSettings: GenerationSettings) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  settings,
  onSettingsChange,
  onGenerate,
  isGenerating,
}) => {
  
  const handleChange = (key: keyof GenerationSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const labelClass = "block text-[10px] uppercase tracking-[0.2em] text-amber-600/80 mb-1 font-fantasy";
  const selectClass = "w-full bg-[#050505] border border-[#2a2a35] text-slate-300 rounded-sm px-3 py-2 text-sm focus:border-amber-600 focus:ring-1 focus:ring-amber-900 focus:outline-none transition-colors font-serif tracking-wide";

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* Decorative Border Frame */}
      <div className="absolute -inset-1 border border-amber-900/30 rounded-lg pointer-events-none"></div>
      <div className="absolute -inset-[2px] border border-indigo-900/20 rounded-lg pointer-events-none"></div>
      
      <div className="relative bg-[#0f0f13] border border-[#2a2a35] shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-md p-6">
        
        {/* Header - Integrated into the border/frame concept conceptually */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#0f0f13] px-4 border border-[#2a2a35] rounded shadow-xl">
          <h2 className="text-amber-500 text-xs font-fantasy tracking-[0.3em] uppercase py-1">
             Arcane Components
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Column 1-4: The Selectors (8 columns wide total) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={settings.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className={selectClass}
              >
                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Rarity</label>
              <select
                value={settings.rarity}
                onChange={(e) => handleChange('rarity', e.target.value as Rarity)}
                className={selectClass}
              >
                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className={selectClass}
              >
                {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Art Style</label>
              <select
                value={settings.style}
                onChange={(e) => handleChange('style', e.target.value)}
                className={selectClass}
              >
                {VISUAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Column 5: Power Band (4 columns wide total) */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-1">
              <label className={labelClass}>Resonance Level</label>
              <div className="relative group">
                <div className="w-3.5 h-3.5 rounded-full border border-amber-600/50 bg-amber-950/30 flex items-center justify-center cursor-help hover:bg-amber-950/50 transition-colors">
                  <span className="text-[8px] text-amber-500 font-bold leading-none">i</span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#0a0a0a] border border-amber-900/50 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                  <p className="text-xs text-amber-400 font-serif">
                    Adjusts item power to match your campaign's magic level.
                  </p>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                    <div className="border-4 border-transparent border-t-amber-900/50"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex bg-[#050505] border border-[#2a2a35] p-1 rounded-sm h-[38px]">
              {POWER_BANDS.map((pb) => (
                <button
                  key={pb}
                  onClick={() => handleChange('powerBand', pb as PowerBand)}
                  className={`flex-1 text-[10px] uppercase tracking-wider transition-all duration-300 ${
                    settings.powerBand === pb 
                      ? 'bg-[#1a1a2e] text-amber-400 border border-amber-900/50 shadow-[0_0_10px_rgba(199,160,89,0.1)]' 
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {pb.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Row: Toggles and Generate Button */}
        <div className="mt-6 pt-6 border-t border-[#2a2a35] flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left: Toggles */}
            <div className="flex gap-8">
               {/* Curse Toggle */}
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 border transition-colors duration-300 flex items-center justify-center ${settings.includeCurse ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-[#050505]'}`}>
                    {settings.includeCurse && <div className="w-2 h-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.includeCurse}
                    onChange={(e) => handleChange('includeCurse', e.target.checked)}
                    className="hidden"
                  />
                  <span className={`text-xs uppercase tracking-widest font-fantasy transition-colors ${settings.includeCurse ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    Incantation: Curse
                  </span>
               </label>

               {/* Plot Hook Toggle */}
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 border transition-colors duration-300 flex items-center justify-center ${settings.includePlotHook ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-[#050505]'}`}>
                    {settings.includePlotHook && <div className="w-2 h-2 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.includePlotHook}
                    onChange={(e) => handleChange('includePlotHook', e.target.checked)}
                    className="hidden"
                  />
                  <span className={`text-xs uppercase tracking-widest font-fantasy transition-colors ${settings.includePlotHook ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    Weave: Plot Hook
                  </span>
               </label>
            </div>

            {/* Right: Action */}
            <div className="w-full md:w-auto">
              <Button onClick={onGenerate} isLoading={isGenerating} className="w-full md:w-64">
                <span className="text-lg mr-2">⚒</span> Strike Anvil
              </Button>
            </div>
        </div>

      </div>
    </div>
  );
};