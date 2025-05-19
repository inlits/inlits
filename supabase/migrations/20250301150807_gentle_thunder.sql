-- Add text search vectors to content tables
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

-- Function to search across all content types
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
  WITH search_query AS (
    SELECT to_tsquery('english', regexp_replace(search_text, '\s+', ':* & ', 'g') || ':*') as query
  ),
  content_union AS (
    -- Articles
    SELECT
      a.id,
      'article'::text as type,
      a.title,
      a.cover_url as thumbnail,
      '5 min read'::text as duration,
      a.view_count as views,
      a.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url,
        'followers', (SELECT COUNT(*) FROM followers f WHERE f.creator_id = p.id)
      ) as creator,
      a.category,
      a.featured,
      ts_rank(a.title_vector, sq.query) + ts_rank(a.content_vector, sq.query) as rank
    FROM articles a
    CROSS JOIN search_query sq
    JOIN profiles p ON p.id = a.author_id
    WHERE 
      (content_filter IS NULL OR content_filter = 'article')
      AND (category_filter IS NULL OR a.category = category_filter)
      AND a.status = 'published'
      AND (
        search_text IS NULL OR search_text = '' OR
        a.title_vector @@ sq.query OR
        a.content_vector @@ sq.query
      )

    UNION ALL

    -- Books
    SELECT
      b.id,
      'book'::text as type,
      b.title,
      b.cover_url as thumbnail,
      NULL as duration,
      b.view_count as views,
      b.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url,
        'followers', (SELECT COUNT(*) FROM followers f WHERE f.creator_id = p.id)
      ) as creator,
      b.category,
      b.featured,
      ts_rank(b.title_vector, sq.query) + ts_rank(b.description_vector, sq.query) as rank
    FROM books b
    CROSS JOIN search_query sq
    JOIN profiles p ON p.id = b.author_id
    WHERE 
      (content_filter IS NULL OR content_filter = 'book')
      AND (category_filter IS NULL OR b.category = category_filter)
      AND b.status = 'published'
      AND (
        search_text IS NULL OR search_text = '' OR
        b.title_vector @@ sq.query OR
        b.description_vector @@ sq.query
      )

    UNION ALL

    -- Audiobooks
    SELECT
      ab.id,
      'audiobook'::text as type,
      ab.title,
      ab.cover_url as thumbnail,
      NULL as duration,
      ab.view_count as views,
      ab.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url,
        'followers', (SELECT COUNT(*) FROM followers f WHERE f.creator_id = p.id)
      ) as creator,
      ab.category,
      ab.featured,
      ts_rank(ab.title_vector, sq.query) + ts_rank(ab.description_vector, sq.query) as rank
    FROM audiobooks ab
    CROSS JOIN search_query sq
    JOIN profiles p ON p.id = ab.author_id
    WHERE 
      (content_filter IS NULL OR content_filter = 'audiobook')
      AND (category_filter IS NULL OR ab.category = category_filter)
      AND ab.status = 'published'
      AND (
        search_text IS NULL OR search_text = '' OR
        ab.title_vector @@ sq.query OR
        ab.description_vector @@ sq.query
      )

    UNION ALL

    -- Podcast Episodes
    SELECT
      pe.id,
      'podcast'::text as type,
      pe.title,
      pe.cover_url as thumbnail,
      pe.duration,
      pe.view_count as views,
      pe.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url,
        'followers', (SELECT COUNT(*) FROM followers f WHERE f.creator_id = p.id)
      ) as creator,
      pe.category,
      pe.featured,
      ts_rank(pe.title_vector, sq.query) + ts_rank(pe.description_vector, sq.query) as rank
    FROM podcast_episodes pe
    CROSS JOIN search_query sq
    JOIN profiles p ON p.id = pe.author_id
    WHERE 
      (content_filter IS NULL OR content_filter = 'podcast')
      AND (category_filter IS NULL OR pe.category = category_filter)
      AND pe.status = 'published'
      AND (
        search_text IS NULL OR search_text = '' OR
        pe.title_vector @@ sq.query OR
        pe.description_vector @@ sq.query
      )
  )
  SELECT
    id,
    type,
    title,
    thumbnail,
    duration,
    views,
    created_at,
    creator,
    category,
    featured
  FROM content_union
  ORDER BY
    CASE 
      WHEN search_text IS NULL OR search_text = '' THEN
        CASE WHEN featured THEN 1 ELSE 0 END
      ELSE rank
    END DESC,
    views DESC,
    created_at DESC
  LIMIT items_limit
  OFFSET items_offset;
END;
$$;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_query text,
  max_suggestions int DEFAULT 5
)
RETURNS TABLE (suggestion text) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF search_query IS NULL OR search_query = '' THEN
    -- Return trending searches for empty query
    RETURN QUERY
    SELECT DISTINCT title
    FROM (
      SELECT title, view_count FROM articles WHERE status = 'published'
      UNION ALL
      SELECT title, view_count FROM books WHERE status = 'published'
      UNION ALL
      SELECT title, view_count FROM audiobooks WHERE status = 'published'
      UNION ALL
      SELECT title, view_count FROM podcast_episodes WHERE status = 'published'
    ) content
    ORDER BY view_count DESC
    LIMIT max_suggestions;
  ELSE
    -- Return matching suggestions
    RETURN QUERY
    WITH search_terms AS (
      SELECT to_tsquery('english', regexp_replace(search_query, '\s+', ':* & ', 'g') || ':*') as query
    )
    SELECT DISTINCT title
    FROM (
      SELECT title, title_vector FROM articles WHERE status = 'published'
      UNION ALL
      SELECT title, title_vector FROM books WHERE status = 'published'
      UNION ALL
      SELECT title, title_vector FROM audiobooks WHERE status = 'published'
      UNION ALL
      SELECT title, title_vector FROM podcast_episodes WHERE status = 'published'
    ) content
    CROSS JOIN search_terms
    WHERE title_vector @@ query
    ORDER BY similarity(title, search_query) DESC
    LIMIT max_suggestions;
  END IF;
END;
$$;