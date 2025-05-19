-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop existing search functions to recreate them
DROP FUNCTION IF EXISTS search_content(text, text, text, int, int);
DROP FUNCTION IF EXISTS get_search_suggestions(text, int);
DROP FUNCTION IF EXISTS process_search_query(text);

-- Create improved search query processor
CREATE OR REPLACE FUNCTION process_search_query(query text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN trim(regexp_replace(
    unaccent(LOWER(query)),
    '[^a-z0-9\s]',
    ' ',
    'g'
  ));
END;
$$;

-- Create function to generate search vectors
CREATE OR REPLACE FUNCTION generate_search_vector(title text, content text)
RETURNS tsvector LANGUAGE plpgsql AS $$
BEGIN
  RETURN (
    setweight(to_tsvector('english', COALESCE(unaccent(title), '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(unaccent(content), '')), 'B')
  );
END;
$$;

-- Recreate search vectors for all content
DO $$ 
BEGIN
  -- Articles
  ALTER TABLE articles DROP COLUMN IF EXISTS search_vector;
  ALTER TABLE articles ADD COLUMN search_vector tsvector;
  UPDATE articles SET search_vector = generate_search_vector(title, content || ' ' || COALESCE(excerpt, ''));
  CREATE INDEX IF NOT EXISTS articles_search_idx ON articles USING gin(search_vector);

  -- Books
  ALTER TABLE books DROP COLUMN IF EXISTS search_vector;
  ALTER TABLE books ADD COLUMN search_vector tsvector;
  UPDATE books SET search_vector = generate_search_vector(title, COALESCE(description, ''));
  CREATE INDEX IF NOT EXISTS books_search_idx ON books USING gin(search_vector);

  -- Audiobooks
  ALTER TABLE audiobooks DROP COLUMN IF EXISTS search_vector;
  ALTER TABLE audiobooks ADD COLUMN search_vector tsvector;
  UPDATE audiobooks SET search_vector = generate_search_vector(title, COALESCE(description, ''));
  CREATE INDEX IF NOT EXISTS audiobooks_search_idx ON audiobooks USING gin(search_vector);

  -- Podcast Episodes
  ALTER TABLE podcast_episodes DROP COLUMN IF EXISTS search_vector;
  ALTER TABLE podcast_episodes ADD COLUMN search_vector tsvector;
  UPDATE podcast_episodes SET search_vector = generate_search_vector(title, COALESCE(description, ''));
  CREATE INDEX IF NOT EXISTS podcast_episodes_search_idx ON podcast_episodes USING gin(search_vector);
END $$;

-- Create triggers to update search vectors
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector = generate_search_vector(
    NEW.title,
    CASE TG_TABLE_NAME
      WHEN 'articles' THEN NEW.content || ' ' || COALESCE(NEW.excerpt, '')
      ELSE COALESCE(NEW.description, '')
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS articles_search_update ON articles;
  DROP TRIGGER IF EXISTS books_search_update ON books;
  DROP TRIGGER IF EXISTS audiobooks_search_update ON audiobooks;
  DROP TRIGGER IF EXISTS podcast_episodes_search_update ON podcast_episodes;

  CREATE TRIGGER articles_search_update
    BEFORE INSERT OR UPDATE OF title, content, excerpt
    ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

  CREATE TRIGGER books_search_update
    BEFORE INSERT OR UPDATE OF title, description
    ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

  CREATE TRIGGER audiobooks_search_update
    BEFORE INSERT OR UPDATE OF title, description
    ON audiobooks
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

  CREATE TRIGGER podcast_episodes_search_update
    BEFORE INSERT OR UPDATE OF title, description
    ON podcast_episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();
END $$;

-- Improved search_content function
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
DECLARE
  search_query tsquery;
BEGIN
  -- Convert search text to tsquery
  IF search_text IS NOT NULL AND search_text != '' THEN
    search_query := websearch_to_tsquery('english', process_search_query(search_text));
  END IF;

  RETURN QUERY
  WITH content_union AS (
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
      CASE 
        WHEN search_text IS NULL OR search_text = '' THEN 0
        ELSE ts_rank_cd(a.search_vector, search_query)
      END as rank
    FROM articles a
    JOIN profiles p ON p.id = a.author_id
    WHERE a.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'article')
      AND (category_filter IS NULL OR a.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        a.search_vector @@ search_query
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
      CASE 
        WHEN search_text IS NULL OR search_text = '' THEN 0
        ELSE ts_rank_cd(b.search_vector, search_query)
      END as rank
    FROM books b
    JOIN profiles p ON p.id = b.author_id
    WHERE b.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'book')
      AND (category_filter IS NULL OR b.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        b.search_vector @@ search_query
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
      CASE 
        WHEN search_text IS NULL OR search_text = '' THEN 0
        ELSE ts_rank_cd(ab.search_vector, search_query)
      END as rank
    FROM audiobooks ab
    JOIN profiles p ON p.id = ab.author_id
    WHERE ab.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'audiobook')
      AND (category_filter IS NULL OR ab.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        ab.search_vector @@ search_query
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
      CASE 
        WHEN search_text IS NULL OR search_text = '' THEN 0
        ELSE ts_rank_cd(pe.search_vector, search_query)
      END as rank
    FROM podcast_episodes pe
    JOIN profiles p ON p.id = pe.author_id
    WHERE pe.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'podcast')
      AND (category_filter IS NULL OR pe.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        pe.search_vector @@ search_query
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
        featured::int * 2 + (views::float / EXTRACT(EPOCH FROM (now() - created_at)))::int
      ELSE rank
    END DESC,
    created_at DESC
  LIMIT items_limit
  OFFSET items_offset;
END;
$$;

-- Improved search suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_query text,
  max_suggestions int DEFAULT 5
)
RETURNS TABLE (suggestion text) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  processed_query text;
  search_tsquery tsquery;
BEGIN
  IF search_query IS NULL OR search_query = '' THEN
    -- Return trending content for empty queries
    RETURN QUERY
    WITH trending AS (
      SELECT 
        title,
        view_count,
        created_at
      FROM (
        SELECT title, view_count, created_at FROM articles WHERE status = 'published'
        UNION ALL
        SELECT title, view_count, created_at FROM books WHERE status = 'published'
        UNION ALL
        SELECT title, view_count, created_at FROM audiobooks WHERE status = 'published'
        UNION ALL
        SELECT title, view_count, created_at FROM podcast_episodes WHERE status = 'published'
      ) content
      ORDER BY 
        view_count DESC,
        created_at DESC
      LIMIT max_suggestions
    )
    SELECT DISTINCT title FROM trending;
  ELSE
    -- Process search query
    processed_query := process_search_query(search_query);
    search_tsquery := websearch_to_tsquery('english', processed_query);

    -- Return relevant suggestions
    RETURN QUERY
    WITH suggestions AS (
      SELECT 
        title,
        ts_rank_cd(search_vector, search_tsquery) as rank,
        word_similarity(processed_query, title) as similarity
      FROM (
        SELECT title, search_vector FROM articles WHERE status = 'published'
        UNION ALL
        SELECT title, search_vector FROM books WHERE status = 'published'
        UNION ALL
        SELECT title, search_vector FROM audiobooks WHERE status = 'published'
        UNION ALL
        SELECT title, search_vector FROM podcast_episodes WHERE status = 'published'
      ) content
      WHERE search_vector @@ search_tsquery
         OR word_similarity(processed_query, title) > 0.3
    )
    SELECT title
    FROM (
      SELECT DISTINCT title, rank, similarity
      FROM suggestions
      ORDER BY 
        rank * 0.7 + similarity * 0.3 DESC,
        similarity DESC
      LIMIT max_suggestions
    ) ranked_suggestions;
  END IF;
END;
$$;