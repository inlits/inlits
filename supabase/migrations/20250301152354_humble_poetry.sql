-- Enable the pg_trgm extension for similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Update search suggestions function to use trigram similarity
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
    -- Return matching suggestions using trigram similarity
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
    ORDER BY word_similarity(search_query, title) DESC
    LIMIT max_suggestions;
  END IF;
END;
$$;