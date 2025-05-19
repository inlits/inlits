-- Create storage bucket for article covers
INSERT INTO storage.buckets (id, name)
VALUES ('article-covers', 'article-covers')
ON CONFLICT DO NOTHING;

-- Set up public access policy for the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-covers');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-covers');

-- Allow users to update and delete their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-covers' AND auth.uid()::text = (storage.foldername(name))[1]);