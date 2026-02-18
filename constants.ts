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

// Weapon subtypes, grouped for better display in the UI
export const SIMPLE_MELEE_WEAPONS = [
  'Weapon (Club)',
  'Weapon (Dagger)',
  'Weapon (Greatclub)',
  'Weapon (Handaxe)',
  'Weapon (Javelin)',
  'Weapon (Light Hammer)',
  'Weapon (Mace)',
  'Weapon (Quarterstaff)',
  'Weapon (Sickle)',
  'Weapon (Spear)',
];

export const SIMPLE_RANGED_WEAPONS = [
  'Weapon (Light Crossbow)',
  'Weapon (Dart)',
  'Weapon (Shortbow)',
  'Weapon (Sling)',
];

export const MARTIAL_MELEE_WEAPONS = [
  'Weapon (Battleaxe)',
  'Weapon (Flail)',
  'Weapon (Glaive)',
  'Weapon (Greataxe)',
  'Weapon (Greatsword)',
  'Weapon (Halberd)',
  'Weapon (Lance)',
  'Weapon (Longsword)',
  'Weapon (Maul)',
  'Weapon (Morningstar)',
  'Weapon (Pike)',
  'Weapon (Rapier)',
  'Weapon (Scimitar)',
  'Weapon (Shortsword)',
  'Weapon (Trident)',
  'Weapon (War Pick)',
  'Weapon (Warhammer)',
  'Weapon (Whip)',
];

export const MARTIAL_RANGED_WEAPONS = [
  'Weapon (Blowgun)',
  'Weapon (Hand Crossbow)',
  'Weapon (Heavy Crossbow)',
  'Weapon (Longbow)',
  'Weapon (Net)',
];

export const OTHER_ITEM_TYPES = [
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
