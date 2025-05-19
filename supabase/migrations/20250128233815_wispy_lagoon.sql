-- Add is_full_book column to books and audiobooks
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS is_full_book boolean DEFAULT true;

ALTER TABLE audiobooks
ADD COLUMN IF NOT EXISTS is_full_book boolean DEFAULT true;

-- Add category column if not exists (for filtering)
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE audiobooks
ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE podcast_episodes
ADD COLUMN IF NOT EXISTS category text;

-- Create indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_audiobooks_category ON audiobooks(category);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_category ON podcast_episodes(category);