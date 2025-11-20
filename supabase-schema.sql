-- Arcane Forge Database Schema
-- Run this SQL in your Supabase SQL Editor to create the magic_items table

CREATE TABLE IF NOT EXISTS magic_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_data JSONB NOT NULL,
  image_prompt TEXT NOT NULL,
  item_card TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_magic_items_created_at ON magic_items(created_at DESC);

-- Create a GIN index on item_data for faster JSONB searches
CREATE INDEX IF NOT EXISTS idx_magic_items_item_data ON magic_items USING GIN (item_data);

-- Optimize: Create a partial index for common queries (exclude large image_url field)
-- This helps when querying without images
CREATE INDEX IF NOT EXISTS idx_magic_items_list_view ON magic_items(created_at DESC) 
  WHERE image_url IS NOT NULL;

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE magic_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Allow public read access" ON magic_items;
DROP POLICY IF EXISTS "Allow public insert access" ON magic_items;
DROP POLICY IF EXISTS "Allow public delete access" ON magic_items;

-- Policy: Allow anyone to read (public read access)
CREATE POLICY "Allow public read access" ON magic_items
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert (public write access)
CREATE POLICY "Allow public insert access" ON magic_items
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to delete (public delete access)
CREATE POLICY "Allow public delete access" ON magic_items
  FOR DELETE
  USING (true);

-- Optional: If you want to restrict to authenticated users only, use:
-- CREATE POLICY "Allow authenticated users to read" ON magic_items
--   FOR SELECT
--   USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Allow authenticated users to insert" ON magic_items
--   FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');
--
-- CREATE POLICY "Allow authenticated users to delete" ON magic_items
--   FOR DELETE
--   USING (auth.role() = 'authenticated');

