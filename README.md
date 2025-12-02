# ⚒ Arcane Forge

**Artificer's Compendium v1.x**

A high-quality D&D magic item generator powered by Google Gemini AI. Create unique magic items with rich lore, detailed descriptions, and stunning visual representations.

## Features

- **Customizable Generation**: Choose from rich item types, rarities, themes, resonance level, and visual styles
- **AI-Powered Content**: Uses Google Gemini to generate detailed item descriptions, lore, and mechanics
- **Visual Generation**: Creates stunning images using Imagen via Gemini
- **Automatic Archiving**: All generated items are automatically saved to Supabase database
- **Archives Browser**: Browse, search, filter, and paginate your collection of generated items
- **Recent Items Display**: View the last 6 generated items directly on the forge page
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

2. **Set up your API keys and database:**
   Create a `.env.local` file in the root directory and add your API keys:
   ```
   API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   - Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor
   - Get your Supabase URL and anon key from your project settings

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

## Features in Detail

### Item Generation
- Generate unique magic items with AI-powered descriptions
- Customize item properties: type, rarity, theme, power level
- Automatic image generation (when API quota allows)
- Items are automatically saved to your database

### Archives
- Browse all your generated items in a beautiful grid view
- Search items by name, type, rarity, theme, or description
- Filter by rarity level
- Click any item to view it in full detail
- Delete items from your collection

### Recent Items
- View the 6 most recently generated items on the forge page
- Quick access to recent creations
- Click to view any item in detail

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Google Gemini AI** - Content and image generation
- **Supabase** - Database for storing generated items
- **Tailwind CSS** - Styling (via inline classes)

## Database Setup

All generated items are automatically saved to Supabase. To set up the database:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and run the SQL from `supabase-schema.sql`
4. Add your Supabase credentials to `.env.local` as shown above

## License

Private project

## Author

Created by [johnmunn.tech](https://johnmunn.tech)
