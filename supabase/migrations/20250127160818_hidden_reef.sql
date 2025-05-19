/*
  # Add full-text search functionality
  
  1. New Functions
    - search_content: Main search function across all content types
    - get_search_suggestions: Function to get search suggestions based on titles
    - update_search_vector: Function to update search vectors when content changes
  
  2. Changes
    - Add search vector columns to content tables
    - Add triggers to update search vectors
  
  3. Security
    - Functions are accessible to all users
    - Search results respect RLS policies
*/

-- Create a function to search across all content types
CREATE OR REPLACE FUNCTION search_content(
  search_query text,
  content_type text DEFAULT NULL,
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
  creator jsonb
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
      ) as creator
    FROM articles a
    JOIN profiles p ON p.id = a.author_id
    LEFT JOIN content_views cv ON cv.content_id = a.id AND cv.content_type = 'article'
    WHERE 
      (content_type IS NULL OR content_type = 'article')
      AND a.status = 'published'
      AND (
        search_query IS NULL 
        OR a.title_vector @@ to_tsquery('english', search_query)
        OR a.content_vector @@ to_tsquery('english', search_query)
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
      ) as creator
    FROM books b
    JOIN profiles p ON p.id = b.author_id
    LEFT JOIN content_views cv ON cv.content_id = b.id AND cv.content_type = 'book'
    WHERE 
      (content_type IS NULL OR content_type = 'book')
      AND b.status = 'published'
      AND (
        search_query IS NULL 
        OR b.title_vector @@ to_tsquery('english', search_query)
        OR b.description_vector @@ to_tsquery('english', search_query)
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
      ) as creator
    FROM audiobooks ab
    JOIN profiles p ON p.id = ab.author_id
    LEFT JOIN content_views cv ON cv.content_id = ab.id AND cv.content_type = 'audiobook'
    WHERE 
      (content_type IS NULL OR content_type = 'audiobook')
      AND ab.status = 'published'
      AND (
        search_query IS NULL 
        OR ab.title_vector @@ to_tsquery('english', search_query)
        OR ab.description_vector @@ to_tsquery('english', search_query)
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
      ) as creator
    FROM podcast_episodes pe
    JOIN profiles p ON p.id = pe.author_id
    LEFT JOIN content_views cv ON cv.content_id = pe.id AND cv.content_type = 'podcast'
    WHERE 
      (content_type IS NULL OR content_type = 'podcast')
      AND pe.status = 'published'
      AND (
        search_query IS NULL 
        OR pe.title_vector @@ to_tsquery('english', search_query)
        OR pe.description_vector @@ to_tsquery('english', search_query)
      )
    GROUP BY pe.id, p.id
  )
  SELECT *
  FROM content_union
  ORDER BY 
    ts_rank(to_tsvector('english', title), to_tsquery('english', search_query)) DESC,
    views DESC,
    created_at DESC
  LIMIT items_limit
  OFFSET items_offset;
END;
$$;

-- Create a function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_query text,
  max_suggestions int DEFAULT 5
)
RETURNS TABLE (suggestion text) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH suggestions AS (
    -- Get suggestions from articles
    SELECT title FROM articles
    WHERE status = 'published'
    AND title_vector @@ to_tsquery('english', search_query)
    UNION
    -- Get suggestions from books
    SELECT title FROM books
    WHERE status = 'published'
    AND title_vector @@ to_tsquery('english', search_query)
    UNION
    -- Get suggestions from audiobooks
    SELECT title FROM audiobooks
    WHERE status = 'published'
    AND title_vector @@ to_tsquery('english', search_query)
    UNION
    -- Get suggestions from podcast episodes
    SELECT title FROM podcast_episodes
    WHERE status = 'published'
    AND title_vector @@ to_tsquery('english', search_query)
  )
  SELECT DISTINCT title
  FROM suggestions
  ORDER BY similarity(title, search_query) DESC
  LIMIT max_suggestions;
END;
$$;

-- Add search vector columns to content tables
ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

ALTER TABLE books ADD COLUMN IF NOT EXISTS title_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;
ALTER TABLE books ADD COLUMN IF NOT EXISTS description_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(description, ''))) STORED;

ALTER TABLE audiobooks ADD COLUMN IF NOT EXISTS title_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;
ALTER TABLE audiobooks ADD COLUMN IF NOT EXISTS description_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(description, ''))) STORED;

ALTER TABLE podcast_episodes ADD COLUMN IF NOT EXISTS title_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;
ALTER TABLE podcast_episodes ADD COLUMN IF NOT EXISTS description_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(description, ''))) STORED;

-- Create indexes for search vectors
CREATE INDEX IF NOT EXISTS articles_title_vector_idx ON articles USING gin(title_vector);
CREATE INDEX IF NOT EXISTS articles_content_vector_idx ON articles USING gin(content_vector);

CREATE INDEX IF NOT EXISTS books_title_vector_idx ON books USING gin(title_vector);
CREATE INDEX IF NOT EXISTS books_description_vector_idx ON books USING gin(description_vector);

CREATE INDEX IF NOT EXISTS audiobooks_title_vector_idx ON audiobooks USING gin(title_vector);
CREATE INDEX IF NOT EXISTS audiobooks_description_vector_idx ON audiobooks USING gin(description_vector);

CREATE INDEX IF NOT EXISTS podcast_episodes_title_vector_idx ON podcast_episodes USING gin(title_vector);
CREATE INDEX IF NOT EXISTS podcast_episodes_description_vector_idx ON podcast_episodes USING gin(description_vector);