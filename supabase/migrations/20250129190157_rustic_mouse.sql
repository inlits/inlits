-- First verify buckets exist and are public
DO $$ 
BEGIN
  -- Update existing buckets to ensure they are public
  UPDATE storage.buckets 
  SET public = true 
  WHERE id IN (
    'article-covers',
    'book-covers',
    'audiobook-covers',
    'books',
    'audiobooks'
  );

  -- Ensure buckets exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('article-covers', 'article-covers', true),
    ('book-covers', 'book-covers', true),
    ('audiobook-covers', 'audiobook-covers', true),
    ('books', 'books', true),
    ('audiobooks', 'audiobooks', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
END $$;

-- Create new policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id IN (
  'article-covers',
  'book-covers',
  'audiobook-covers',
  'books',
  'audiobooks'
));

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN (
  'article-covers',
  'book-covers',
  'audiobook-covers',
  'books',
  'audiobooks'
) AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN (
    'article-covers',
    'book-covers',
    'audiobook-covers',
    'books',
    'audiobooks'
  ) 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN (
    'article-covers',
    'book-covers',
    'audiobook-covers',
    'books',
    'audiobooks'
  )
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create helper function for storage URLs
CREATE OR REPLACE FUNCTION storage.format_file_url(
  bucket_id text,
  file_path text
) RETURNS text AS $$
DECLARE
  project_url text;
BEGIN
  -- Get project URL from environment or config
  project_url := current_setting('app.settings.project_url', true);
  
  -- Fallback to constructing from request
  IF project_url IS NULL THEN
    project_url := current_setting('request.headers', true)::json->>'origin';
  END IF;
  
  -- Return full URL
  RETURN project_url || '/storage/v1/object/public/' || bucket_id || '/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;