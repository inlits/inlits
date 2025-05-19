-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('article-covers', 'article-covers', true),
  ('book-covers', 'book-covers', true),
  ('audiobook-covers', 'audiobook-covers', true),
  ('books', 'books', true),
  ('audiobooks', 'audiobooks', true)
ON CONFLICT DO NOTHING;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies for article covers
  DROP POLICY IF EXISTS "Public Access for article covers" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload article covers" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own article covers" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own article covers" ON storage.objects;

  -- Drop policies for book covers
  DROP POLICY IF EXISTS "Public Access for book covers" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload book covers" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own book covers" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own book covers" ON storage.objects;

  -- Drop policies for audiobook covers
  DROP POLICY IF EXISTS "Public Access for audiobook covers" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload audiobook covers" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own audiobook covers" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own audiobook covers" ON storage.objects;

  -- Drop policies for books
  DROP POLICY IF EXISTS "Public Access for books" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload books" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own books" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own books" ON storage.objects;

  -- Drop policies for audiobooks
  DROP POLICY IF EXISTS "Public Access for audiobooks" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload audiobooks" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own audiobooks" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own audiobooks" ON storage.objects;
END $$;

-- Recreate policies
-- Public access policies
CREATE POLICY "Public Access for article covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-covers');

CREATE POLICY "Public Access for book covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

CREATE POLICY "Public Access for audiobook covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'audiobook-covers');

CREATE POLICY "Public Access for books"
ON storage.objects FOR SELECT
USING (bucket_id = 'books');

CREATE POLICY "Public Access for audiobooks"
ON storage.objects FOR SELECT
USING (bucket_id = 'audiobooks');

-- Upload policies
CREATE POLICY "Authenticated users can upload article covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-covers');

CREATE POLICY "Authenticated users can upload book covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can upload audiobook covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiobook-covers');

CREATE POLICY "Authenticated users can upload books"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'books');

CREATE POLICY "Authenticated users can upload audiobooks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiobooks');

-- Update policies
CREATE POLICY "Users can update their own article covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own book covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own audiobook covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audiobook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own books"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own audiobooks"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audiobooks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Delete policies
CREATE POLICY "Users can delete their own article covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own book covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audiobook covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audiobook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own books"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audiobooks"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audiobooks' AND auth.uid()::text = (storage.foldername(name))[1]);