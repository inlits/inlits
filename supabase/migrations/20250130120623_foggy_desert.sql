-- Add view count columns to content tables
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS view_count bigint DEFAULT 0;

ALTER TABLE books
ADD COLUMN IF NOT EXISTS view_count bigint DEFAULT 0;

ALTER TABLE audiobooks 
ADD COLUMN IF NOT EXISTS view_count bigint DEFAULT 0;

ALTER TABLE podcast_episodes
ADD COLUMN IF NOT EXISTS view_count bigint DEFAULT 0;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the appropriate content type's view count
  CASE NEW.content_type
    WHEN 'article' THEN
      UPDATE articles 
      SET view_count = view_count + 1 
      WHERE id = NEW.content_id;
    WHEN 'book' THEN
      UPDATE books 
      SET view_count = view_count + 1 
      WHERE id = NEW.content_id;
    WHEN 'audiobook' THEN
      UPDATE audiobooks 
      SET view_count = view_count + 1 
      WHERE id = NEW.content_id;
    WHEN 'podcast' THEN
      UPDATE podcast_episodes 
      SET view_count = view_count + 1 
      WHERE id = NEW.content_id;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for view count
DROP TRIGGER IF EXISTS increment_view_count_trigger ON content_views;
CREATE TRIGGER increment_view_count_trigger
  AFTER INSERT ON content_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_view_count();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_views_article
  ON content_views (content_id)
  WHERE content_type = 'article';

CREATE INDEX IF NOT EXISTS idx_content_views_book
  ON content_views (content_id)
  WHERE content_type = 'book';

CREATE INDEX IF NOT EXISTS idx_content_views_audiobook
  ON content_views (content_id)
  WHERE content_type = 'audiobook';

CREATE INDEX IF NOT EXISTS idx_content_views_podcast
  ON content_views (content_id)
  WHERE content_type = 'podcast';

-- Create function to get content views
CREATE OR REPLACE FUNCTION get_content_views(
  content_id uuid,
  content_type text
) RETURNS bigint AS $$
BEGIN
  CASE content_type
    WHEN 'article' THEN
      RETURN (SELECT view_count FROM articles WHERE id = content_id);
    WHEN 'book' THEN
      RETURN (SELECT view_count FROM books WHERE id = content_id);
    WHEN 'audiobook' THEN
      RETURN (SELECT view_count FROM audiobooks WHERE id = content_id);
    WHEN 'podcast' THEN
      RETURN (SELECT view_count FROM podcast_episodes WHERE id = content_id);
    ELSE
      RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;