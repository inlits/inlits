-- Add featured column to content tables if not exists
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

ALTER TABLE books
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

ALTER TABLE audiobooks
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

ALTER TABLE podcast_episodes
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Create indexes for featured content
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_audiobooks_featured ON audiobooks(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_featured ON podcast_episodes(featured) WHERE featured = true;

-- Update search function to include featured status
CREATE OR REPLACE FUNCTION search_content(
  search_text text,
  content_filter text DEFAULT NULL,
  category_filter text DEFAULT NULL,
  items_limit int DEFAULT 10,
  items_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  thumbnail text,
  duration text,
  views bigint,
  created_at timestamptz,
  creator jsonb,
  category text,
  featured boolean
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH content_union AS (
    -- Articles
    SELECT
      a.id,
      'article'::text as type,
      a.title,
      a.cover_url as thumbnail,
      '5 min read'::text as duration,
      COALESCE(COUNT(cv.id), 0) as views,
      a.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url,
        'followers', (SELECT COUNT(*) FROM followers f WHERE f.creator_id = p.id)
      ) as creator,
      a.category,
      a.featured
    FROM articles a
    JOIN profiles p ON p.id = a.author_id
    LEFT JOIN content_views cv ON cv.content_id = a.id AND cv.content_type = 'article'
    WHERE 
      (content_filter IS NULL OR content_filter = 'article')
      AND (category_filter IS NULL OR a.category = category_filter)
      AND a.status = 'published'
      AND (
        search_text IS NULL 
        OR a.title_vector @@ to_tsquery('english', search_text)
        OR a.content_vector @@ to_tsquery('english', search_text)
      )
    GROUP BY a.id, p.id

    UNION ALL

    -- Books
    SELECT
      b.id,
      'book'::text as type,
      b.title,
      b.cover_url as thumbnail,
      NULL as duration,
      COALESCE(COUNT(cv.id), 0) as views,
      b.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url,
        'followers', (SELECT COUNT(*) FROM followers f WHERE f.creator_id = p.id)
      ) as creator,
      b.category,
      b.featured
    FROM books b
    JOIN profiles p ON p.id = b.author_id
    LEFT JOIN content_views cv ON cv.content_id = b.id AND cv.content_type = 'book'
    WHERE 
      (content_filter IS NULL OR content_filter = 'book')
      AND (category_filter IS NULL OR b.category = category_filter)
      AND b.status = 'published'
      AND (
        search_text IS NULL 
        OR b.title_vector @@ to_tsquery('english', search_text)
        OR b.description_vector @@ to_tsquery('english', search_text)
      )
    GROUP BY b.id, p.id

    UNION ALL

    -- Audiobooks
    SELECT
      ab.id,
      'audiobook'::text as type,
      ab.title,
      ab.cover_url as thumbnail,
      NULL as duration,
      COALESCE(COUNT(cv.id), 0) as views,
      ab.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url,
        'followers', (SELECT COUNT(*) FROM followers f WHERE f.creator_id = p.id)
      ) as creator,
      ab.category,
      ab.featured
    FROM audiobooks ab
    JOIN profiles p ON p.id = ab.author_id
    LEFT JOIN content_views cv ON cv.content_id = ab.id AND cv.content_type = 'audiobook'
    WHERE 
      (content_filter IS NULL OR content_filter = 'audiobook')
      AND (category_filter IS NULL OR ab.category = category_filter)
      AND ab.status = 'published'
      AND (
        search_text IS NULL 
        OR ab.title_vector @@ to_tsquery('english', search_text)
        OR ab.description_vector @@ to_tsquery('english', search_text)
      )
    GROUP BY ab.id, p.id

    UNION ALL

    -- Podcast Episodes
    SELECT
      pe.id,
      'podcast'::text as type,
      pe.title,
      pe.cover_url as thumbnail,
      pe.duration,
      COALESCE(COUNT(cv.id), 0) as views,
      pe.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url,
        'followers', (SELECT COUNT(*) FROM followers f WHERE f.creator_id = p.id)
      ) as creator,
      pe.category,
      pe.featured
    FROM podcast_episodes pe
    JOIN profiles p ON p.id = pe.author_id
    LEFT JOIN content_views cv ON cv.content_id = pe.id AND cv.content_type = 'podcast'
    WHERE 
      (content_filter IS NULL OR content_filter = 'podcast')
      AND (category_filter IS NULL OR pe.category = category_filter)
      AND pe.status = 'published'
      AND (
        search_text IS NULL 
        OR pe.title_vector @@ to_tsquery('english', search_text)
        OR pe.description_vector @@ to_tsquery('english', search_text)
      )
    GROUP BY pe.id, p.id
  )
  SELECT *
  FROM content_union
  ORDER BY 
    featured DESC,
    ts_rank(to_tsvector('english', title), to_tsquery('english', coalesce(search_text, ''))) DESC,
    views DESC,
    created_at DESC
  LIMIT items_limit
  OFFSET items_offset;
END;
$$;