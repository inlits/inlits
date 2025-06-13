/*
  # User Profile Functions Migration

  1. New Functions
    - get_user_reading_stats: Get detailed reading statistics for a user
    - get_user_reading_history: Get user's reading history with content details
    - get_user_bookmarks: Get user's bookmarked content with details
    
  2. Changes
    - Add functions to support real user profile data
    - Improve existing get_user_profile function
*/

-- Function to get user reading stats
CREATE OR REPLACE FUNCTION get_user_reading_stats(user_id uuid)
RETURNS TABLE (
  articles_read bigint,
  books_read bigint,
  audiobooks_listened bigint,
  podcasts_listened bigint,
  total_content_viewed bigint,
  avg_view_duration interval,
  favorite_categories text[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH content_views_stats AS (
    SELECT
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'article') as articles_read,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'book') as books_read,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'audiobook') as audiobooks_listened,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'podcast') as podcasts_listened,
      COUNT(DISTINCT cv.content_id) as total_content_viewed,
      COALESCE(AVG(CASE WHEN cv.viewer_id IS NOT NULL THEN interval '5 minutes' ELSE interval '2 minutes' END), interval '0') as avg_view_duration
    FROM content_views cv
    WHERE cv.viewer_id = get_user_reading_stats.user_id
  ),
  category_counts AS (
    SELECT
      category,
      COUNT(*) as count
    FROM (
      SELECT
        CASE cv.content_type
          WHEN 'article' THEN (SELECT category FROM articles WHERE id = cv.content_id)
          WHEN 'book' THEN (SELECT category FROM books WHERE id = cv.content_id)
          WHEN 'audiobook' THEN (SELECT category FROM audiobooks WHERE id = cv.content_id)
          WHEN 'podcast' THEN (SELECT category FROM podcast_episodes WHERE id = cv.content_id)
        END as category
      FROM content_views cv
      WHERE cv.viewer_id = get_user_reading_stats.user_id
    ) categories
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
    LIMIT 5
  )
  SELECT
    cvs.articles_read,
    cvs.books_read,
    cvs.audiobooks_listened,
    cvs.podcasts_listened,
    cvs.total_content_viewed,
    cvs.avg_view_duration,
    ARRAY(SELECT category FROM category_counts) as favorite_categories
  FROM content_views_stats cvs;
END;
$$;

-- Function to get user reading history
CREATE OR REPLACE FUNCTION get_user_reading_history(user_id uuid, limit_count int DEFAULT 10)
RETURNS TABLE (
  content_id uuid,
  content_type text,
  title text,
  thumbnail text,
  progress int,
  viewed_at timestamptz,
  creator jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH latest_views AS (
    SELECT DISTINCT ON (content_id, content_type)
      content_id,
      content_type,
      viewed_at,
      COALESCE(progress, 0) as progress
    FROM content_views
    WHERE viewer_id = get_user_reading_history.user_id
    ORDER BY content_id, content_type, viewed_at DESC
  )
  SELECT
    lv.content_id,
    lv.content_type,
    CASE lv.content_type
      WHEN 'article' THEN (SELECT title FROM articles WHERE id = lv.content_id)
      WHEN 'book' THEN (SELECT title FROM books WHERE id = lv.content_id)
      WHEN 'audiobook' THEN (SELECT title FROM audiobooks WHERE id = lv.content_id)
      WHEN 'podcast' THEN (SELECT title FROM podcast_episodes WHERE id = lv.content_id)
    END as title,
    CASE lv.content_type
      WHEN 'article' THEN (SELECT cover_url FROM articles WHERE id = lv.content_id)
      WHEN 'book' THEN (SELECT cover_url FROM books WHERE id = lv.content_id)
      WHEN 'audiobook' THEN (SELECT cover_url FROM audiobooks WHERE id = lv.content_id)
      WHEN 'podcast' THEN (SELECT cover_url FROM podcast_episodes WHERE id = lv.content_id)
    END as thumbnail,
    lv.progress,
    lv.viewed_at,
    CASE lv.content_type
      WHEN 'article' THEN (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar_url
        )
        FROM articles a
        JOIN profiles p ON p.id = a.author_id
        WHERE a.id = lv.content_id
      )
      WHEN 'book' THEN (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar_url
        )
        FROM books b
        JOIN profiles p ON p.id = b.author_id
        WHERE b.id = lv.content_id
      )
      WHEN 'audiobook' THEN (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar_url
        )
        FROM audiobooks ab
        JOIN profiles p ON p.id = ab.author_id
        WHERE ab.id = lv.content_id
      )
      WHEN 'podcast' THEN (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar_url
        )
        FROM podcast_episodes pe
        JOIN profiles p ON p.id = pe.author_id
        WHERE pe.id = lv.content_id
      )
    END as creator
  FROM latest_views lv
  WHERE 
    CASE lv.content_type
      WHEN 'article' THEN EXISTS (SELECT 1 FROM articles WHERE id = lv.content_id)
      WHEN 'book' THEN EXISTS (SELECT 1 FROM books WHERE id = lv.content_id)
      WHEN 'audiobook' THEN EXISTS (SELECT 1 FROM audiobooks WHERE id = lv.content_id)
      WHEN 'podcast' THEN EXISTS (SELECT 1 FROM podcast_episodes WHERE id = lv.content_id)
      ELSE false
    END
  ORDER BY lv.viewed_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get user bookmarks
CREATE OR REPLACE FUNCTION get_user_bookmarks(user_id uuid, limit_count int DEFAULT 10)
RETURNS TABLE (
  content_id uuid,
  content_type text,
  title text,
  thumbnail text,
  bookmarked_at timestamptz,
  creator jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.content_id,
    b.content_type,
    CASE b.content_type
      WHEN 'article' THEN (SELECT title FROM articles WHERE id = b.content_id)
      WHEN 'book' THEN (SELECT title FROM books WHERE id = b.content_id)
      WHEN 'audiobook' THEN (SELECT title FROM audiobooks WHERE id = b.content_id)
      WHEN 'podcast' THEN (SELECT title FROM podcast_episodes WHERE id = b.content_id)
    END as title,
    CASE b.content_type
      WHEN 'article' THEN (SELECT cover_url FROM articles WHERE id = b.content_id)
      WHEN 'book' THEN (SELECT cover_url FROM books WHERE id = b.content_id)
      WHEN 'audiobook' THEN (SELECT cover_url FROM audiobooks WHERE id = b.content_id)
      WHEN 'podcast' THEN (SELECT cover_url FROM podcast_episodes WHERE id = b.content_id)
    END as thumbnail,
    b.created_at as bookmarked_at,
    CASE b.content_type
      WHEN 'article' THEN (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar_url
        )
        FROM articles a
        JOIN profiles p ON p.id = a.author_id
        WHERE a.id = b.content_id
      )
      WHEN 'book' THEN (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar_url
        )
        FROM books bk
        JOIN profiles p ON p.id = bk.author_id
        WHERE bk.id = b.content_id
      )
      WHEN 'audiobook' THEN (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar_url
        )
        FROM audiobooks ab
        JOIN profiles p ON p.id = ab.author_id
        WHERE ab.id = b.content_id
      )
      WHEN 'podcast' THEN (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar', p.avatar_url
        )
        FROM podcast_episodes pe
        JOIN profiles p ON p.id = pe.author_id
        WHERE pe.id = b.content_id
      )
    END as creator
  FROM bookmarks b
  WHERE b.user_id = get_user_bookmarks.user_id
  AND CASE b.content_type
    WHEN 'article' THEN EXISTS (SELECT 1 FROM articles WHERE id = b.content_id)
    WHEN 'book' THEN EXISTS (SELECT 1 FROM books WHERE id = b.content_id)
    WHEN 'audiobook' THEN EXISTS (SELECT 1 FROM audiobooks WHERE id = b.content_id)
    WHEN 'podcast' THEN EXISTS (SELECT 1 FROM podcast_episodes WHERE id = b.content_id)
    ELSE false
  END
  ORDER BY b.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Improved get_user_profile function
CREATE OR REPLACE FUNCTION get_user_profile(username text)
RETURNS TABLE (
  profile jsonb,
  stats jsonb,
  reading_history jsonb,
  bookmarks jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get user ID from username
  SELECT id INTO user_id FROM profiles WHERE profiles.username = get_user_profile.username;
  
  IF user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT * FROM get_user_reading_stats(user_id)
  ),
  user_history AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', content_id,
        'type', content_type,
        'title', title,
        'thumbnail', thumbnail,
        'progress', progress,
        'viewed_at', viewed_at,
        'creator', creator
      )
    ) as history
    FROM get_user_reading_history(user_id, 10)
  ),
  user_bookmarks AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', content_id,
        'type', content_type,
        'title', title,
        'thumbnail', thumbnail,
        'bookmarked_at', bookmarked_at,
        'creator', creator
      )
    ) as bookmarks
    FROM get_user_bookmarks(user_id, 10)
  ),
  following_count AS (
    SELECT COUNT(*) as count
    FROM followers
    WHERE follower_id = user_id
  )
  SELECT
    -- Profile
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'name', p.name,
      'avatar_url', p.avatar_url,
      'cover_url', p.cover_url,
      'bio', p.bio,
      'role', p.role,
      'expertise', p.expertise,
      'reading_preferences', p.reading_preferences,
      'social_links', p.social_links,
      'verified', p.verified,
      'created_at', p.created_at
    ) as profile,
    
    -- Stats
    jsonb_build_object(
      'articles_read', us.articles_read,
      'books_read', us.books_read,
      'audiobooks_listened', us.audiobooks_listened,
      'podcasts_listened', us.podcasts_listened,
      'total_content_viewed', us.total_content_viewed,
      'avg_view_duration', us.avg_view_duration,
      'favorite_categories', us.favorite_categories,
      'following_count', fc.count
    ) as stats,
    
    -- Reading History
    jsonb_build_object(
      'recent_views', COALESCE(uh.history, '[]'::jsonb)
    ) as reading_history,
    
    -- Bookmarks
    jsonb_build_object(
      'recent_bookmarks', COALESCE(ub.bookmarks, '[]'::jsonb)
    ) as bookmarks
    
  FROM profiles p
  LEFT JOIN user_stats us ON true
  LEFT JOIN user_history uh ON true
  LEFT JOIN user_bookmarks ub ON true
  LEFT JOIN following_count fc ON true
  WHERE p.id = user_id;
END;
$$;

-- Add progress column to content_views if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_views' 
    AND column_name = 'progress'
  ) THEN
    ALTER TABLE content_views ADD COLUMN progress integer;
  END IF;
END $$;