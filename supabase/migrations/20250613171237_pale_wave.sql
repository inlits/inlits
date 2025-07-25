/*
  # Fix User Profile Function and Add Profile Data Support

  1. Changes
    - Completely rewrite get_user_profile function to fix ambiguous column references
    - Add support for retrieving real user data including reading stats, history, and bookmarks
    - Ensure proper table aliases and column qualification
    - Add support for progress tracking in content views
    
  2. Security
    - Maintain existing security model with SECURITY DEFINER
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_profile(text);

-- Create a new, improved get_user_profile function
CREATE OR REPLACE FUNCTION get_user_profile(username_param text)
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
  SELECT id INTO user_id FROM profiles WHERE profiles.username = username_param;
  
  IF user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH user_reading_stats AS (
    -- Calculate reading stats
    SELECT
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'article') as articles_read,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'book') as books_read,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'audiobook') as audiobooks_listened,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'podcast') as podcasts_listened,
      COUNT(DISTINCT cv.content_id) as total_content_viewed,
      COALESCE(AVG(CASE WHEN cv.progress IS NOT NULL THEN cv.progress ELSE 50 END), 0) as avg_progress
    FROM content_views cv
    WHERE cv.viewer_id = user_id
  ),
  favorite_categories AS (
    -- Get favorite categories based on content views
    SELECT
      category,
      COUNT(*) as count
    FROM (
      SELECT
        CASE cv.content_type
          WHEN 'article' THEN (SELECT a.category FROM articles a WHERE a.id = cv.content_id)
          WHEN 'book' THEN (SELECT b.category FROM books b WHERE b.id = cv.content_id)
          WHEN 'audiobook' THEN (SELECT ab.category FROM audiobooks ab WHERE ab.id = cv.content_id)
          WHEN 'podcast' THEN (SELECT pe.category FROM podcast_episodes pe WHERE pe.id = cv.content_id)
        END as category
      FROM content_views cv
      WHERE cv.viewer_id = user_id
    ) categories
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
    LIMIT 5
  ),
  recent_views AS (
    -- Get recent content views with details
    SELECT
      cv.content_id,
      cv.content_type,
      cv.viewed_at,
      cv.progress,
      CASE cv.content_type
        WHEN 'article' THEN (SELECT a.title FROM articles a WHERE a.id = cv.content_id)
        WHEN 'book' THEN (SELECT b.title FROM books b WHERE b.id = cv.content_id)
        WHEN 'audiobook' THEN (SELECT ab.title FROM audiobooks ab WHERE ab.id = cv.content_id)
        WHEN 'podcast' THEN (SELECT pe.title FROM podcast_episodes pe WHERE pe.id = cv.content_id)
      END as title,
      CASE cv.content_type
        WHEN 'article' THEN (SELECT a.cover_url FROM articles a WHERE a.id = cv.content_id)
        WHEN 'book' THEN (SELECT b.cover_url FROM books b WHERE b.id = cv.content_id)
        WHEN 'audiobook' THEN (SELECT ab.cover_url FROM audiobooks ab WHERE ab.id = cv.content_id)
        WHEN 'podcast' THEN (SELECT pe.cover_url FROM podcast_episodes pe WHERE pe.id = cv.content_id)
      END as thumbnail,
      CASE cv.content_type
        WHEN 'article' THEN (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.name, p.username),
            'avatar', p.avatar_url
          )
          FROM articles a
          JOIN profiles p ON p.id = a.author_id
          WHERE a.id = cv.content_id
        )
        WHEN 'book' THEN (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.name, p.username),
            'avatar', p.avatar_url
          )
          FROM books b
          JOIN profiles p ON p.id = b.author_id
          WHERE b.id = cv.content_id
        )
        WHEN 'audiobook' THEN (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.name, p.username),
            'avatar', p.avatar_url
          )
          FROM audiobooks ab
          JOIN profiles p ON p.id = ab.author_id
          WHERE ab.id = cv.content_id
        )
        WHEN 'podcast' THEN (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.name, p.username),
            'avatar', p.avatar_url
          )
          FROM podcast_episodes pe
          JOIN profiles p ON p.id = pe.author_id
          WHERE pe.id = cv.content_id
        )
      END as creator
    FROM (
      SELECT DISTINCT ON (content_id, content_type)
        content_id,
        content_type,
        viewed_at,
        progress
      FROM content_views
      WHERE viewer_id = user_id
      ORDER BY content_id, content_type, viewed_at DESC
    ) cv
    WHERE 
      CASE cv.content_type
        WHEN 'article' THEN EXISTS (SELECT 1 FROM articles WHERE id = cv.content_id)
        WHEN 'book' THEN EXISTS (SELECT 1 FROM books WHERE id = cv.content_id)
        WHEN 'audiobook' THEN EXISTS (SELECT 1 FROM audiobooks WHERE id = cv.content_id)
        WHEN 'podcast' THEN EXISTS (SELECT 1 FROM podcast_episodes WHERE id = cv.content_id)
        ELSE false
      END
    ORDER BY cv.viewed_at DESC
    LIMIT 10
  ),
  user_bookmarks AS (
    -- Get user bookmarks with details
    SELECT
      bm.content_id,
      bm.content_type,
      bm.created_at as bookmarked_at,
      CASE bm.content_type
        WHEN 'article' THEN (SELECT a.title FROM articles a WHERE a.id = bm.content_id)
        WHEN 'book' THEN (SELECT b.title FROM books b WHERE b.id = bm.content_id)
        WHEN 'audiobook' THEN (SELECT ab.title FROM audiobooks ab WHERE ab.id = bm.content_id)
        WHEN 'podcast' THEN (SELECT pe.title FROM podcast_episodes pe WHERE pe.id = bm.content_id)
      END as title,
      CASE bm.content_type
        WHEN 'article' THEN (SELECT a.cover_url FROM articles a WHERE a.id = bm.content_id)
        WHEN 'book' THEN (SELECT b.cover_url FROM books b WHERE b.id = bm.content_id)
        WHEN 'audiobook' THEN (SELECT ab.cover_url FROM audiobooks ab WHERE ab.id = bm.content_id)
        WHEN 'podcast' THEN (SELECT pe.cover_url FROM podcast_episodes pe WHERE pe.id = bm.content_id)
      END as thumbnail,
      CASE bm.content_type
        WHEN 'article' THEN (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.name, p.username),
            'avatar', p.avatar_url
          )
          FROM articles a
          JOIN profiles p ON p.id = a.author_id
          WHERE a.id = bm.content_id
        )
        WHEN 'book' THEN (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.name, p.username),
            'avatar', p.avatar_url
          )
          FROM books b
          JOIN profiles p ON p.id = b.author_id
          WHERE b.id = bm.content_id
        )
        WHEN 'audiobook' THEN (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.name, p.username),
            'avatar', p.avatar_url
          )
          FROM audiobooks ab
          JOIN profiles p ON p.id = ab.author_id
          WHERE ab.id = bm.content_id
        )
        WHEN 'podcast' THEN (
          SELECT jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.name, p.username),
            'avatar', p.avatar_url
          )
          FROM podcast_episodes pe
          JOIN profiles p ON p.id = pe.author_id
          WHERE pe.id = bm.content_id
        )
      END as creator
    FROM bookmarks bm
    WHERE bm.user_id = user_id
    AND CASE bm.content_type
      WHEN 'article' THEN EXISTS (SELECT 1 FROM articles WHERE id = bm.content_id)
      WHEN 'book' THEN EXISTS (SELECT 1 FROM books WHERE id = bm.content_id)
      WHEN 'audiobook' THEN EXISTS (SELECT 1 FROM audiobooks WHERE id = bm.content_id)
      WHEN 'podcast' THEN EXISTS (SELECT 1 FROM podcast_episodes WHERE id = bm.content_id)
      ELSE false
    END
    ORDER BY bm.created_at DESC
    LIMIT 10
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
      'articles_read', urs.articles_read,
      'books_read', urs.books_read,
      'audiobooks_listened', urs.audiobooks_listened,
      'podcasts_listened', urs.podcasts_listened,
      'total_content_viewed', urs.total_content_viewed,
      'avg_progress', urs.avg_progress,
      'favorite_categories', ARRAY(SELECT category FROM favorite_categories),
      'following_count', fc.count
    ) as stats,
    
    -- Reading History
    jsonb_agg(
      jsonb_build_object(
        'content_id', rv.content_id,
        'type', rv.content_type,
        'title', rv.title,
        'thumbnail', rv.thumbnail,
        'progress', rv.progress,
        'viewed_at', rv.viewed_at,
        'creator', rv.creator
      )
    ) as reading_history,
    
    -- Bookmarks
    jsonb_agg(
      jsonb_build_object(
        'content_id', ub.content_id,
        'type', ub.content_type,
        'title', ub.title,
        'thumbnail', ub.thumbnail,
        'bookmarked_at', ub.bookmarked_at,
        'creator', ub.creator
      )
    ) as bookmarks
    
  FROM profiles p
  LEFT JOIN user_reading_stats urs ON true
  LEFT JOIN following_count fc ON true
  LEFT JOIN LATERAL (
    SELECT * FROM recent_views
  ) rv ON true
  LEFT JOIN LATERAL (
    SELECT * FROM user_bookmarks
  ) ub ON true
  WHERE p.id = user_id
  GROUP BY p.id, urs.articles_read, urs.books_read, urs.audiobooks_listened, 
           urs.podcasts_listened, urs.total_content_viewed, urs.avg_progress, fc.count;
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

-- Insert some sample content views with progress for testing
DO $$
DECLARE
  user_record RECORD;
  content_record RECORD;
  content_types TEXT[] := ARRAY['article', 'book', 'audiobook', 'podcast'];
  content_type TEXT;
  content_id UUID;
  progress INTEGER;
BEGIN
  -- Get a random user
  SELECT id INTO user_record FROM auth.users LIMIT 1;
  
  IF user_record.id IS NOT NULL THEN
    -- For each content type
    FOREACH content_type IN ARRAY content_types LOOP
      -- Get a random content item of that type
      CASE content_type
        WHEN 'article' THEN
          SELECT id INTO content_id FROM articles LIMIT 1;
        WHEN 'book' THEN
          SELECT id INTO content_id FROM books LIMIT 1;
        WHEN 'audiobook' THEN
          SELECT id INTO content_id FROM audiobooks LIMIT 1;
        WHEN 'podcast' THEN
          SELECT id INTO content_id FROM podcast_episodes LIMIT 1;
        ELSE
          content_id := NULL;
      END CASE;
      
      IF content_id IS NOT NULL THEN
        -- Generate a random progress value
        progress := floor(random() * 100)::integer;
        
        -- Insert a content view with progress
        INSERT INTO content_views (
          content_id, 
          content_type, 
          viewer_id, 
          viewed_at, 
          progress
        )
        VALUES (
          content_id,
          content_type,
          user_record.id,
          now() - (random() * interval '30 days'),
          progress
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;