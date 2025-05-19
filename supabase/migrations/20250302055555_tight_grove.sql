-- Drop and recreate the search_content function with explicit table references
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
      ts_rank_cd(a.search_vector, websearch_to_tsquery('english', search_text)) as rank
    FROM articles a
    JOIN profiles p ON p.id = a.author_id
    WHERE a.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'article')
      AND (category_filter IS NULL OR a.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
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
      ts_rank_cd(b.search_vector, websearch_to_tsquery('english', search_text)) as rank
    FROM books b
    JOIN profiles p ON p.id = b.author_id
    WHERE b.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'book')
      AND (category_filter IS NULL OR b.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
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
      ts_rank_cd(ab.search_vector, websearch_to_tsquery('english', search_text)) as rank
    FROM audiobooks ab
    JOIN profiles p ON p.id = ab.author_id
    WHERE ab.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'audiobook')
      AND (category_filter IS NULL OR ab.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
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
      ts_rank_cd(pe.search_vector, websearch_to_tsquery('english', search_text)) as rank
    FROM podcast_episodes pe
    JOIN profiles p ON p.id = pe.author_id
    WHERE pe.status = 'published'
      AND (content_filter IS NULL OR content_filter = 'podcast')
      AND (category_filter IS NULL OR pe.category = category_filter)
      AND (
        search_text IS NULL OR search_text = '' OR
        pe.search_vector @@ websearch_to_tsquery('english', search_text)
      )
  )
  SELECT
    content_union.id,
    content_union.type,
    content_union.title,
    content_union.thumbnail,
    content_union.duration,
    content_union.views,
    content_union.created_at,
    content_union.creator,
    content_union.category,
    content_union.featured
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