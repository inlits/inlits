-- Function to get personalized content recommendations
CREATE OR REPLACE FUNCTION get_content_recommendations(
  p_user_id uuid,
  p_category text DEFAULT NULL,
  p_limit int DEFAULT 10,
  p_exclude_ids uuid[] DEFAULT '{}'::uuid[]
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
  WITH user_preferences AS (
    -- Get user's reading preferences and history
    SELECT 
      COALESCE(
        (SELECT reading_preferences FROM profiles WHERE id = p_user_id),
        '{}'::text[]
      ) as preferences,
      ARRAY_AGG(DISTINCT cv.content_type) as preferred_types,
      ARRAY_AGG(DISTINCT 
        CASE cv.content_type
          WHEN 'article' THEN (SELECT category FROM articles WHERE id = cv.content_id)
          WHEN 'book' THEN (SELECT category FROM books WHERE id = cv.content_id)
          WHEN 'audiobook' THEN (SELECT category FROM audiobooks WHERE id = cv.content_id)
          WHEN 'podcast' THEN (SELECT category FROM podcast_episodes WHERE id = cv.content_id)
        END
      ) as preferred_categories
    FROM content_views cv
    WHERE cv.viewer_id = p_user_id
    GROUP BY cv.viewer_id
  ),
  content_scores AS (
    -- Score content based on user preferences and behavior
    SELECT
      c.id,
      c.type,
      c.title,
      c.thumbnail,
      c.duration,
      c.views,
      c.created_at,
      c.creator,
      c.category,
      c.featured,
      (
        CASE 
          WHEN c.category = ANY(up.preferred_categories) THEN 2
          WHEN c.category = p_category THEN 3
          ELSE 0
        END +
        CASE WHEN c.type = ANY(up.preferred_types) THEN 1 ELSE 0 END +
        CASE WHEN c.featured THEN 1 ELSE 0 END +
        CASE 
          WHEN c.created_at > now() - interval '7 days' THEN 2
          WHEN c.created_at > now() - interval '30 days' THEN 1
          ELSE 0
        END +
        (c.views::float / (EXTRACT(EPOCH FROM (now() - c.created_at)) / 86400))::int
      ) as score
    FROM (
      -- Union all content types
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
          'avatar', p.avatar_url
        ) as creator,
        a.category,
        a.featured
      FROM articles a
      JOIN profiles p ON p.id = a.author_id
      WHERE a.status = 'published'
        AND NOT (a.id = ANY(p_exclude_ids))
        AND (p_category IS NULL OR a.category = p_category)

      UNION ALL

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
          'avatar', p.avatar_url
        ) as creator,
        b.category,
        b.featured
      FROM books b
      JOIN profiles p ON p.id = b.author_id
      WHERE b.status = 'published'
        AND NOT (b.id = ANY(p_exclude_ids))
        AND (p_category IS NULL OR b.category = p_category)

      UNION ALL

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
          'avatar', p.avatar_url
        ) as creator,
        ab.category,
        ab.featured
      FROM audiobooks ab
      JOIN profiles p ON p.id = ab.author_id
      WHERE ab.status = 'published'
        AND NOT (ab.id = ANY(p_exclude_ids))
        AND (p_category IS NULL OR ab.category = p_category)

      UNION ALL

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
          'avatar', p.avatar_url
        ) as creator,
        pe.category,
        pe.featured
      FROM podcast_episodes pe
      JOIN profiles p ON p.id = pe.author_id
      WHERE pe.status = 'published'
        AND NOT (pe.id = ANY(p_exclude_ids))
        AND (p_category IS NULL OR pe.category = p_category)
    ) c
    CROSS JOIN user_preferences up
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
  FROM content_scores
  ORDER BY score DESC, views DESC, created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to get similar content
CREATE OR REPLACE FUNCTION get_similar_content(
  p_content_id uuid,
  p_content_type text,
  p_limit int DEFAULT 5
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
  v_category text;
  v_author_id uuid;
BEGIN
  -- Get the category and author of the source content
  SELECT 
    CASE p_content_type
      WHEN 'article' THEN (SELECT category FROM articles WHERE id = p_content_id)
      WHEN 'book' THEN (SELECT category FROM books WHERE id = p_content_id)
      WHEN 'audiobook' THEN (SELECT category FROM audiobooks WHERE id = p_content_id)
      WHEN 'podcast' THEN (SELECT category FROM podcast_episodes WHERE id = p_content_id)
    END,
    CASE p_content_type
      WHEN 'article' THEN (SELECT author_id FROM articles WHERE id = p_content_id)
      WHEN 'book' THEN (SELECT author_id FROM books WHERE id = p_content_id)
      WHEN 'audiobook' THEN (SELECT author_id FROM audiobooks WHERE id = p_content_id)
      WHEN 'podcast' THEN (SELECT author_id FROM podcast_episodes WHERE id = p_content_id)
    END
  INTO v_category, v_author_id;

  RETURN QUERY
  WITH similar_content AS (
    -- Union all content types
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
        'avatar', p.avatar_url
      ) as creator,
      a.category,
      a.featured,
      CASE 
        WHEN a.category = v_category AND a.author_id = v_author_id THEN 3
        WHEN a.category = v_category THEN 2
        WHEN a.author_id = v_author_id THEN 1
        ELSE 0
      END as similarity_score
    FROM articles a
    JOIN profiles p ON p.id = a.author_id
    WHERE a.status = 'published'
      AND a.id != p_content_id

    UNION ALL

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
        'avatar', p.avatar_url
      ) as creator,
      b.category,
      b.featured,
      CASE 
        WHEN b.category = v_category AND b.author_id = v_author_id THEN 3
        WHEN b.category = v_category THEN 2
        WHEN b.author_id = v_author_id THEN 1
        ELSE 0
      END as similarity_score
    FROM books b
    JOIN profiles p ON p.id = b.author_id
    WHERE b.status = 'published'
      AND b.id != p_content_id

    UNION ALL

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
        'avatar', p.avatar_url
      ) as creator,
      ab.category,
      ab.featured,
      CASE 
        WHEN ab.category = v_category AND ab.author_id = v_author_id THEN 3
        WHEN ab.category = v_category THEN 2
        WHEN ab.author_id = v_author_id THEN 1
        ELSE 0
      END as similarity_score
    FROM audiobooks ab
    JOIN profiles p ON p.id = ab.author_id
    WHERE ab.status = 'published'
      AND ab.id != p_content_id

    UNION ALL

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
        'avatar', p.avatar_url
      ) as creator,
      pe.category,
      pe.featured,
      CASE 
        WHEN pe.category = v_category AND pe.author_id = v_author_id THEN 3
        WHEN pe.category = v_category THEN 2
        WHEN pe.author_id = v_author_id THEN 1
        ELSE 0
      END as similarity_score
    FROM podcast_episodes pe
    JOIN profiles p ON p.id = pe.author_id
    WHERE pe.status = 'published'
      AND pe.id != p_content_id
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
  FROM similar_content
  WHERE similarity_score > 0
  ORDER BY similarity_score DESC, views DESC, created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to get trending content
CREATE OR REPLACE FUNCTION get_trending_content(
  p_category text DEFAULT NULL,
  p_timeframe text DEFAULT 'week',
  p_limit int DEFAULT 10
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
  v_start_date timestamptz;
BEGIN
  -- Set timeframe
  v_start_date := CASE p_timeframe
    WHEN 'day' THEN now() - interval '1 day'
    WHEN 'week' THEN now() - interval '7 days'
    WHEN 'month' THEN now() - interval '30 days'
    ELSE now() - interval '7 days'
  END;

  RETURN QUERY
  WITH trending_content AS (
    -- Union all content types with their view counts
    SELECT
      a.id,
      'article'::text as type,
      a.title,
      a.cover_url as thumbnail,
      '5 min read'::text as duration,
      a.view_count as total_views,
      COUNT(cv.id) as recent_views,
      a.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url
      ) as creator,
      a.category,
      a.featured
    FROM articles a
    JOIN profiles p ON p.id = a.author_id
    LEFT JOIN content_views cv ON cv.content_id = a.id 
      AND cv.content_type = 'article'
      AND cv.viewed_at >= v_start_date
    WHERE a.status = 'published'
      AND (p_category IS NULL OR a.category = p_category)
    GROUP BY a.id, p.id

    UNION ALL

    SELECT
      b.id,
      'book'::text as type,
      b.title,
      b.cover_url as thumbnail,
      NULL as duration,
      b.view_count as total_views,
      COUNT(cv.id) as recent_views,
      b.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url
      ) as creator,
      b.category,
      b.featured
    FROM books b
    JOIN profiles p ON p.id = b.author_id
    LEFT JOIN content_views cv ON cv.content_id = b.id 
      AND cv.content_type = 'book'
      AND cv.viewed_at >= v_start_date
    WHERE b.status = 'published'
      AND (p_category IS NULL OR b.category = p_category)
    GROUP BY b.id, p.id

    UNION ALL

    SELECT
      ab.id,
      'audiobook'::text as type,
      ab.title,
      ab.cover_url as thumbnail,
      NULL as duration,
      ab.view_count as total_views,
      COUNT(cv.id) as recent_views,
      ab.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url
      ) as creator,
      ab.category,
      ab.featured
    FROM audiobooks ab
    JOIN profiles p ON p.id = ab.author_id
    LEFT JOIN content_views cv ON cv.content_id = ab.id 
      AND cv.content_type = 'audiobook'
      AND cv.viewed_at >= v_start_date
    WHERE ab.status = 'published'
      AND (p_category IS NULL OR ab.category = p_category)
    GROUP BY ab.id, p.id

    UNION ALL

    SELECT
      pe.id,
      'podcast'::text as type,
      pe.title,
      pe.cover_url as thumbnail,
      pe.duration,
      pe.view_count as total_views,
      COUNT(cv.id) as recent_views,
      pe.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar', p.avatar_url
      ) as creator,
      pe.category,
      pe.featured
    FROM podcast_episodes pe
    JOIN profiles p ON p.id = pe.author_id
    LEFT JOIN content_views cv ON cv.content_id = pe.id 
      AND cv.content_type = 'podcast'
      AND cv.viewed_at >= v_start_date
    WHERE pe.status = 'published'
      AND (p_category IS NULL OR pe.category = p_category)
    GROUP BY pe.id, p.id
  )
  SELECT
    id,
    type,
    title,
    thumbnail,
    duration,
    total_views as views,
    created_at,
    creator,
    category,
    featured
  FROM trending_content
  ORDER BY 
    recent_views DESC,
    total_views DESC,
    created_at DESC
  LIMIT p_limit;
END;
$$;