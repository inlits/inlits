-- Helper function to process search query
CREATE OR REPLACE FUNCTION process_search_query(query text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  -- Remove special characters and convert to space-separated words
  RETURN regexp_replace(
    regexp_replace(
      LOWER(query),
      '[^a-zA-Z0-9\s]',
      ' ',
      'g'
    ),
    '\s+',
    ' ',
    'g'
  );
END;
$$;

-- Update search_content function to handle query processing
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
  processed_query text;
  search_tsquery tsquery;
BEGIN
  -- Process the search query
  IF search_text IS NOT NULL AND search_text != '' THEN
    processed_query := process_search_query(search_text);
    search_tsquery := to_tsquery('english', array_to_string(
      array(
        SELECT word || ':*'
        FROM unnest(string_to_array(processed_query, ' ')) AS word
        WHERE length(word) > 0
      ),
      ' & '
    ));
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
        ELSE ts_rank(a.title_vector, search_tsquery) * 2 + ts_rank(a.content_vector, search_tsquery)
      END as rank
    FROM articles a
    JOIN profiles p ON p.id = a.author_id
    WHERE a.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'article')
      AND (category_filter IS NULL OR a.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        a.title_vector @@ search_tsquery OR
        a.content_vector @@ search_tsquery
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
        ELSE ts_rank(b.title_vector, search_tsquery) * 2 + ts_rank(b.description_vector, search_tsquery)
      END as rank
    FROM books b
    JOIN profiles p ON p.id = b.author_id
    WHERE b.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'book')
      AND (category_filter IS NULL OR b.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        b.title_vector @@ search_tsquery OR
        b.description_vector @@ search_tsquery
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
        ELSE ts_rank(ab.title_vector, search_tsquery) * 2 + ts_rank(ab.description_vector, search_tsquery)
      END as rank
    FROM audiobooks ab
    JOIN profiles p ON p.id = ab.author_id
    WHERE ab.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'audiobook')
      AND (category_filter IS NULL OR ab.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        ab.title_vector @@ search_tsquery OR
        ab.description_vector @@ search_tsquery
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
        ELSE ts_rank(pe.title_vector, search_tsquery) * 2 + ts_rank(pe.description_vector, search_tsquery)
      END as rank
    FROM podcast_episodes pe
    JOIN profiles p ON p.id = pe.author_id
    WHERE pe.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'podcast')
      AND (category_filter IS NULL OR pe.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        pe.title_vector @@ search_tsquery OR
        pe.description_vector @@ search_tsquery
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
        featured::int
      ELSE rank
    END DESC,
    views DESC,
    created_at DESC
  LIMIT items_limit
  OFFSET items_offset;
END;
$$;

-- Update search suggestions function
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
    -- Process the search query
    processed_query := process_search_query(search_query);
    search_tsquery := to_tsquery('english', array_to_string(
      array(
        SELECT word || ':*'
        FROM unnest(string_to_array(processed_query, ' ')) AS word
        WHERE length(word) > 0
      ),
      ' & '
    ));

    -- Return matching suggestions
    RETURN QUERY
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
    WHERE title_vector @@ search_tsquery
    ORDER BY 
      ts_rank(title_vector, search_tsquery) DESC,
      word_similarity(search_query, title) DESC
    LIMIT max_suggestions;
  END IF;
END;
$$;