-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Create function to normalize text for fuzzy matching
CREATE OR REPLACE FUNCTION normalize_search_text(input_text text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN lower(unaccent(regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g')));
END;
$$;

-- Create function to get similarity score
CREATE OR REPLACE FUNCTION get_similarity_score(search_text text, target_text text)
RETURNS float LANGUAGE plpgsql AS $$
DECLARE
  normalized_search text;
  normalized_target text;
BEGIN
  normalized_search := normalize_search_text(search_text);
  normalized_target := normalize_search_text(target_text);
  RETURN (
    similarity(normalized_search, normalized_target) +
    word_similarity(normalized_search, normalized_target)
  ) / 2;
END;
$$;

-- Update search_content function with fuzzy matching
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
  normalized_search text;
  similarity_threshold float := 0.3;  -- Adjust this value to control fuzzy matching sensitivity
BEGIN
  -- Normalize search text
  normalized_search := normalize_search_text(search_text);

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
      GREATEST(
        get_similarity_score(search_text, a.title),
        get_similarity_score(search_text, COALESCE(a.excerpt, '')),
        ts_rank_cd(a.search_vector, websearch_to_tsquery('english', search_text)) * 0.8
      ) as rank
    FROM articles a
    JOIN profiles p ON p.id = a.author_id
    WHERE a.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'article')
      AND (category_filter IS NULL OR a.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        get_similarity_score(search_text, a.title) > similarity_threshold OR
        a.search_vector @@ websearch_to_tsquery('english', search_text)
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
      GREATEST(
        get_similarity_score(search_text, b.title),
        get_similarity_score(search_text, COALESCE(b.description, '')),
        ts_rank_cd(b.search_vector, websearch_to_tsquery('english', search_text)) * 0.8
      ) as rank
    FROM books b
    JOIN profiles p ON p.id = b.author_id
    WHERE b.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'book')
      AND (category_filter IS NULL OR b.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        get_similarity_score(search_text, b.title) > similarity_threshold OR
        b.search_vector @@ websearch_to_tsquery('english', search_text)
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
      GREATEST(
        get_similarity_score(search_text, ab.title),
        get_similarity_score(search_text, COALESCE(ab.description, '')),
        ts_rank_cd(ab.search_vector, websearch_to_tsquery('english', search_text)) * 0.8
      ) as rank
    FROM audiobooks ab
    JOIN profiles p ON p.id = ab.author_id
    WHERE ab.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'audiobook')
      AND (category_filter IS NULL OR ab.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        get_similarity_score(search_text, ab.title) > similarity_threshold OR
        ab.search_vector @@ websearch_to_tsquery('english', search_text)
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
      GREATEST(
        get_similarity_score(search_text, pe.title),
        get_similarity_score(search_text, COALESCE(pe.description, '')),
        ts_rank_cd(pe.search_vector, websearch_to_tsquery('english', search_text)) * 0.8
      ) as rank
    FROM podcast_episodes pe
    JOIN profiles p ON p.id = pe.author_id
    WHERE pe.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'podcast')
      AND (category_filter IS NULL OR pe.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        get_similarity_score(search_text, pe.title) > similarity_threshold OR
        pe.search_vector @@ websearch_to_tsquery('english', search_text)
      )
  )
  SELECT
    cu.id,
    cu.type,
    cu.title,
    cu.thumbnail,
    cu.duration,
    cu.views,
    cu.created_at,
    cu.creator,
    cu.category,
    cu.featured
  FROM content_union cu
  WHERE cu.rank > 0 OR search_text IS NULL OR search_text = ''
  ORDER BY
    CASE 
      WHEN search_text IS NULL OR search_text = '' THEN
        cu.featured::int * 2 + (cu.views::float / EXTRACT(EPOCH FROM (now() - cu.created_at)))::int
      ELSE cu.rank
    END DESC,
    cu.created_at DESC
  LIMIT items_limit
  OFFSET items_offset;
END;
$$;

-- Update search suggestions function with fuzzy matching
CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_query text,
  max_suggestions int DEFAULT 5
)
RETURNS TABLE (suggestion text) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  normalized_query text;
  similarity_threshold float := 0.3;
BEGIN
  IF search_query IS NULL OR search_query = '' THEN
    -- Return trending content for empty queries
    RETURN QUERY
    SELECT DISTINCT title
    FROM (
      SELECT title, view_count, created_at 
      FROM articles 
      WHERE status = 'published'
      UNION ALL
      SELECT title, view_count, created_at 
      FROM books 
      WHERE status = 'published'
      UNION ALL
      SELECT title, view_count, created_at 
      FROM audiobooks 
      WHERE status = 'published'
      UNION ALL
      SELECT title, view_count, created_at 
      FROM podcast_episodes 
      WHERE status = 'published'
    ) content
    ORDER BY 
      view_count DESC,
      created_at DESC
    LIMIT max_suggestions;
  ELSE
    -- Normalize search query
    normalized_query := normalize_search_text(search_query);

    -- Return fuzzy matched suggestions
    RETURN QUERY
    WITH suggestions AS (
      SELECT 
        title,
        get_similarity_score(search_query, title) as similarity
      FROM (
        SELECT DISTINCT title
        FROM (
          SELECT title FROM articles WHERE status = 'published'
          UNION ALL
          SELECT title FROM books WHERE status = 'published'
          UNION ALL
          SELECT title FROM audiobooks WHERE status = 'published'
          UNION ALL
          SELECT title FROM podcast_episodes WHERE status = 'published'
        ) all_content
      ) unique_titles
      WHERE get_similarity_score(search_query, title) > similarity_threshold
    )
    SELECT title
    FROM suggestions
    ORDER BY similarity DESC
    LIMIT max_suggestions;
  END IF;
END;
$$;