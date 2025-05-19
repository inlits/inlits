-- Add missing columns to books table if they don't exist
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_full_book boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS category text;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'books' 
    AND indexname = 'idx_books_category'
  ) THEN
    CREATE INDEX idx_books_category ON books(category);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'books' 
    AND indexname = 'idx_books_featured'
  ) THEN
    CREATE INDEX idx_books_featured ON books(featured) WHERE featured = true;
  END IF;
END $$;