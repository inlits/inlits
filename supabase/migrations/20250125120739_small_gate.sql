-- Create storage buckets for books and audiobooks
INSERT INTO storage.buckets (id, name)
VALUES 
  ('book-covers', 'book-covers'),
  ('books', 'books'),
  ('audiobook-covers', 'audiobook-covers'),
  ('audiobooks', 'audiobooks')
ON CONFLICT DO NOTHING;

-- Set up access policies for book covers
CREATE POLICY "Public Access for book covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can upload book covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "Users can update their own book covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own book covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up access policies for books
CREATE POLICY "Public Access for books"
ON storage.objects FOR SELECT
USING (bucket_id = 'books');

CREATE POLICY "Authenticated users can upload books"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'books');

CREATE POLICY "Users can update their own books"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own books"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up access policies for audiobook covers
CREATE POLICY "Public Access for audiobook covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'audiobook-covers');

CREATE POLICY "Authenticated users can upload audiobook covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiobook-covers');

CREATE POLICY "Users can update their own audiobook covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audiobook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audiobook covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audiobook-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up access policies for audiobooks
CREATE POLICY "Public Access for audiobooks"
ON storage.objects FOR SELECT
USING (bucket_id = 'audiobooks');

CREATE POLICY "Authenticated users can upload audiobooks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiobooks');

CREATE POLICY "Users can update their own audiobooks"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audiobooks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audiobooks"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audiobooks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file columns to books and audiobooks tables
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_type text,
ADD COLUMN IF NOT EXISTS file_size bigint;

ALTER TABLE audiobooks
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_type text,
ADD COLUMN IF NOT EXISTS file_size bigint;