-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_shelves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shelf_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id uuid REFERENCES custom_shelves(id) ON DELETE CASCADE NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
  added_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS bookmarks_user_content_idx ON bookmarks(user_id, content_id, content_type);
CREATE INDEX IF NOT EXISTS custom_shelves_user_idx ON custom_shelves(user_id);
CREATE INDEX IF NOT EXISTS shelf_items_shelf_idx ON shelf_items(shelf_id);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelf_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
DECLARE
  tables text[] := ARRAY['bookmarks', 'custom_shelves', 'shelf_items'];
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own %s" ON %I', 
      CASE 
        WHEN table_name = 'shelf_items' THEN 'items in their own shelves'
        ELSE table_name
      END,
      table_name
    );
  END LOOP;
END $$;

-- Create policies
CREATE POLICY "Users can manage their own bookmarks"
  ON bookmarks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own shelves"
  ON custom_shelves
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage items in their own shelves"
  ON shelf_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM custom_shelves
    WHERE id = shelf_id
    AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM custom_shelves
    WHERE id = shelf_id
    AND user_id = auth.uid()
  ));

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_library_content(uuid);

-- Create function to get library content
CREATE OR REPLACE FUNCTION get_library_content(user_id uuid)
RETURNS TABLE (
  content_id uuid,
  content_type text,
  title text,
  cover_url text,
  duration text,
  category text,
  author_id uuid,
  author_name text,
  author_avatar text,
  created_at timestamptz,
  view_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  -- Get articles
  SELECT 
    a.id as content_id,
    'article'::text as content_type,
    a.title,
    a.cover_url,
    '5 min read'::text as duration,
    a.category,
    p.id as author_id,
    p.name as author_name,
    p.avatar_url as author_avatar,
    b.created_at,
    a.view_count
  FROM bookmarks b
  JOIN articles a ON a.id = b.content_id
  JOIN profiles p ON p.id = a.author_id
  WHERE b.user_id = get_library_content.user_id
  AND b.content_type = 'article'

  UNION ALL

  -- Get books
  SELECT 
    b.id as content_id,
    'book'::text as content_type,
    b.title,
    b.cover_url,
    NULL as duration,
    b.category,
    p.id as author_id,
    p.name as author_name,
    p.avatar_url as author_avatar,
    bm.created_at,
    b.view_count
  FROM bookmarks bm
  JOIN books b ON b.id = bm.content_id
  JOIN profiles p ON p.id = b.author_id
  WHERE bm.user_id = get_library_content.user_id
  AND bm.content_type = 'book'

  UNION ALL

  -- Get audiobooks
  SELECT 
    ab.id as content_id,
    'audiobook'::text as content_type,
    ab.title,
    ab.cover_url,
    NULL as duration,
    ab.category,
    p.id as author_id,
    p.name as author_name,
    p.avatar_url as author_avatar,
    bm.created_at,
    ab.view_count
  FROM bookmarks bm
  JOIN audiobooks ab ON ab.id = bm.content_id
  JOIN profiles p ON p.id = ab.author_id
  WHERE bm.user_id = get_library_content.user_id
  AND bm.content_type = 'audiobook'

  UNION ALL

  -- Get podcasts
  SELECT 
    pe.id as content_id,
    'podcast'::text as content_type,
    pe.title,
    pe.cover_url,
    pe.duration,
    pe.category,
    p.id as author_id,
    p.name as author_name,
    p.avatar_url as author_avatar,
    bm.created_at,
    pe.view_count
  FROM bookmarks bm
  JOIN podcast_episodes pe ON pe.id = bm.content_id
  JOIN profiles p ON p.id = pe.author_id
  WHERE bm.user_id = get_library_content.user_id
  AND bm.content_type = 'podcast'

  ORDER BY created_at DESC;
END;
$$;