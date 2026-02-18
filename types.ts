export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';

export type PowerBand = 'Low Magic' | 'Standard' | 'High Magic' | 'Mythic';

export interface GenerationSettings {
  rarity: Rarity;
  type: string;
  theme: string;
  style: string;
  powerBand: PowerBand;
  includeCurse: boolean;
  includePlotHook: boolean;
  customPrompt?: string;
}

export interface ItemMechanics {
  attunement: boolean;
  effects: string[];
  activation: string;
  scaling: string;
}

export interface ItemData {
  name: string;
  type: string;
  rarity: string;
  style: string;
  theme: string;
  powerBand?: string; // Resonance Level (optional for backward compatibility)
  description: string;
  mechanics: ItemMechanics;
  curse: string;
  plot_hook: string;
  price_gp: number;
}

export interface GeneratedContent {
  itemData: ItemData;
  imagePrompt: string;
  itemCard: string;
}

export interface MagicItemResult extends GeneratedContent {
  imageUrl?: string;
}
