/*
  # Update book categories system

  1. Schema Changes
    - Change `category` column from text to text[] (array) in books table
    - Change `category` column from text to text[] (array) in audiobooks table
    - Change `category` column from text to text[] (array) in articles table
    - Change `category` column from text to text[] (array) in podcast_episodes table
    - Update search indexes to work with arrays

  2. Data Migration
    - Convert existing single categories to arrays
    - Preserve existing data during migration

  3. Index Updates
    - Update search indexes to handle array categories
    - Add GIN indexes for better array search performance
*/

-- First, add new array columns
DO $$
BEGIN
  -- Add new categories array column to books
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'categories'
  ) THEN
    ALTER TABLE books ADD COLUMN categories text[];
  END IF;

  -- Add new categories array column to audiobooks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audiobooks' AND column_name = 'categories'
  ) THEN
    ALTER TABLE audiobooks ADD COLUMN categories text[];
  END IF;

  -- Add new categories array column to articles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'categories'
  ) THEN
    ALTER TABLE articles ADD COLUMN categories text[];
  END IF;

  -- Add new categories array column to podcast_episodes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'podcast_episodes' AND column_name = 'categories'
  ) THEN
    ALTER TABLE podcast_episodes ADD COLUMN categories text[];
  END IF;
END $$;

-- Migrate existing data from category to categories
UPDATE books 
SET categories = CASE 
  WHEN category IS NOT NULL AND category != '' THEN ARRAY[category]
  ELSE ARRAY[]::text[]
END
WHERE categories IS NULL;

UPDATE audiobooks 
SET categories = CASE 
  WHEN category IS NOT NULL AND category != '' THEN ARRAY[category]
  ELSE ARRAY[]::text[]
END
WHERE categories IS NULL;

UPDATE articles 
SET categories = CASE 
  WHEN category IS NOT NULL AND category != '' THEN ARRAY[category]
  ELSE ARRAY[]::text[]
END
WHERE categories IS NULL;

UPDATE podcast_episodes 
SET categories = CASE 
  WHEN category IS NOT NULL AND category != '' THEN ARRAY[category]
  ELSE ARRAY[]::text[]
END
WHERE categories IS NULL;

-- Add GIN indexes for better array search performance
CREATE INDEX IF NOT EXISTS idx_books_categories_gin ON books USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_audiobooks_categories_gin ON audiobooks USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_articles_categories_gin ON articles USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_categories_gin ON podcast_episodes USING gin (categories);

-- Update search function to handle array categories
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different table structures
  IF TG_TABLE_NAME = 'books' THEN
    NEW.search_vector := 
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'C');
  ELSIF TG_TABLE_NAME = 'audiobooks' THEN
    NEW.search_vector := 
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'C');
  ELSIF TG_TABLE_NAME = 'articles' THEN
    NEW.search_vector := 
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'C');
  ELSIF TG_TABLE_NAME = 'podcast_episodes' THEN
    NEW.search_vector := 
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'C');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing search triggers to use new function
DROP TRIGGER IF EXISTS books_search_update ON books;
CREATE TRIGGER books_search_update
  BEFORE INSERT OR UPDATE OF title, description, categories ON books
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

DROP TRIGGER IF EXISTS audiobooks_search_update ON audiobooks;
CREATE TRIGGER audiobooks_search_update
  BEFORE INSERT OR UPDATE OF title, description, categories ON audiobooks
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

DROP TRIGGER IF EXISTS articles_search_update ON articles;
CREATE TRIGGER articles_search_update
  BEFORE INSERT OR UPDATE OF title, content, excerpt, categories ON articles
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

DROP TRIGGER IF EXISTS podcast_episodes_search_update ON podcast_episodes;
CREATE TRIGGER podcast_episodes_search_update
  BEFORE INSERT OR UPDATE OF title, description, categories ON podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();