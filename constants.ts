import { Rarity, PowerBand } from './types';

export const RARITIES: Rarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Very Rare',
  'Legendary',
  'Artifact',
];

export const POWER_BANDS: PowerBand[] = [
  'Low Magic',
  'Standard',
  'High Magic',
  'Mythic',
];

export const ITEM_TYPES = [
  'Weapon (Sword)',
  'Weapon (Axe)',
  'Weapon (Bow)',
  'Armor (Light)',
  'Armor (Heavy)',
  'Shield',
  'Wondrous Item',
  'Potion',
  'Ring',
  'Rod',
  'Staff',
  'Wand',
  'Scroll',
  'Amulet',
];

export const THEMES = [
  'None',
  'Celestial',
  'Infernal',
  'Feywild',
  'Elemental (Fire)',
  'Elemental (Ice)',
  'Elemental (Lightning)',
  'Shadowfell',
  'Ancient Civilization',
  'Draconic',
  'Necrotic',
  'Clockwork/Mechanus',
  'Eldritch/Far Realm',
  'Druidic/Nature',
];

export const VISUAL_STYLES = [
  '80s Fantasy Novel Cover',
  'Oil Painting',
  'Watercolor',
  'Pen and Ink',
  'Hyper-Realistic',
  'Dark Fantasy Concept Art',
  'Stained Glass',
  'Ethereal Glow',
  'Sketchbook',
];

export const DEFAULT_SETTINGS = {
  rarity: 'Rare' as Rarity,
  type: 'Wondrous Item',
  theme: 'Ancient Civilization',
  style: 'Oil Painting',
  powerBand: 'Standard' as PowerBand,
  includeCurse: false,
  includePlotHook: true,
};
