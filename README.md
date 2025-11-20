# ⚒ Arcane Forge

**Artificer's Compendium v1.0**

A high-quality D&D magic item generator powered by Google Gemini AI. Create unique magic items with rich lore, detailed descriptions, and stunning visual representations.

## Features

- **Customizable Generation**: Choose from various item types, rarities, themes, and visual styles
- **AI-Powered Content**: Uses Google Gemini to generate detailed item descriptions, lore, and mechanics
- **Visual Generation**: Creates stunning images using Imagen via Gemini
- **Rich Customization Options**:
  - Item types: Weapons, Armor, Potions, Rings, Wands, and more
  - Rarity levels: Common through Artifact
  - Themes: Celestial, Infernal, Feywild, Elemental, Draconic, and more
  - Visual styles: Oil Painting, Watercolor, Pen and Ink, Hyper-Realistic, and more
  - Power bands: Low Magic, Standard, High Magic, Mythic
  - Optional curse mechanics
  - Optional plot hooks for campaign integration

## Prerequisites

- Node.js (v18 or higher recommended)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   API_KEY=your_gemini_api_key_here
   ```
   
   You can get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Google Gemini AI** - Content and image generation
- **Tailwind CSS** - Styling (via inline classes)

## License

Private project
