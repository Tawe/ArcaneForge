# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (output: dist/)
npm run preview  # Preview production build
```

No test runner or linter is configured.

## Environment Variables

Create `.env.local` with:
```
GEMINI_API_KEY=your_gemini_api_key   # or API_KEY= (both work)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

`GEMINI_API_KEY`/`API_KEY` is injected via `vite.config.ts` as `process.env.API_KEY`. Supabase vars use the `VITE_` prefix to be available at runtime. The app degrades gracefully if Supabase is not configured — storage operations silently no-op.

## Architecture

### Routing
`App.tsx` defines two routes via react-router-dom:
- `/` → `ForgePage` (inline in App.tsx) — the main generation + archives UI
- `/item/:id` → `pages/ItemView.tsx` — shareable permalink for a single item

### Generation Flow (App.tsx `handleGenerate`)
1. Client-side rate limit check (5 generations/minute, tracked in `localStorage`)
2. `generateMagicItemText()` → calls Gemini `gemini-2.5-flash` with a structured JSON schema, returns `GeneratedContent` (itemData, imagePrompt, itemCard)
3. UI updates immediately with text content; image generation runs after
4. `generateMagicItemImage()` → calls Gemini `gemini-2.5-flash-image`, returns base64 data URL
5. `saveItem()` → generates a 340×340 thumbnail via canvas (`imageUtils.ts`), inserts full record into Supabase

### Services
| File | Purpose |
|------|---------|
| `services/geminiService.ts` | All AI calls — text uses `responseSchema` for structured output; image returns inline base64 |
| `services/storageService.ts` | Supabase CRUD + localStorage caching (5-min TTL); list queries fetch only `thumbnail_url`, never `image_url` |
| `services/supabaseClient.ts` | Supabase client init; falls back to a dummy client with placeholder credentials if unconfigured |
| `services/imageUtils.ts` | Canvas-based thumbnail generation |

### Data / Types
- Core types live in `types.ts`: `GenerationSettings`, `ItemData`, `GeneratedContent`, `MagicItemResult`
- `SavedMagicItem` (in `storageService.ts`) extends `MagicItemResult` with `id` and `created_at`
- All dropdown options (item types, rarities, themes, visual styles, power bands) are defined in `constants.ts`

### Database Schema
Single table `magic_items` (see `supabase-schema.sql`):
- `item_data` JSONB — the structured item (matches `ItemData` type)
- `image_prompt` TEXT — prompt used for image generation
- `item_card` TEXT — player-facing formatted card text
- `image_url` TEXT — full base64 image (large; only fetched in `getItemById()`)
- `thumbnail_url` TEXT — compressed 340×340 base64 thumbnail (used in list views)

RLS is enabled with public read/insert/delete policies.

### Key Patterns
- **Lazy loading**: `SavedItems` and `RecentItems` components are `React.lazy()` loaded
- **Thumbnail vs full image**: List views always use `thumbnail_url`. `image_url` is only fetched on-demand in `getItemById()` and `getItemFullImageUrl()`. Never add `image_url` to list queries — it can be 1–2 MB per item.
- **localStorage cache**: Item lists are cached for 5 minutes. Call `invalidateCache()` after writes/deletes.
- **OG meta tags**: `hooks/useMetaTags.ts` updates `<meta>` tags dynamically; base64 `image_url` values can't be used as OG image URLs (crawlers need public URLs), so the favicon is used as fallback.
- **Path alias**: `@` resolves to the project root (configured in `vite.config.ts`)
