/*
  # Fix ambiguous column reference in get_user_profile function

  1. Function Updates
    - Update `get_user_profile` function to properly qualify column references
    - Add table aliases to resolve ambiguous `content_id` references
    - Ensure all column references are properly scoped

  2. Changes Made
    - Replace ambiguous `content_id` with properly qualified table aliases
    - Update all related column references for consistency
    - Maintain existing function signature and return structure
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_profile(text);

-- Recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION get_user_profile(username_param text)
RETURNS TABLE (
  id uuid,
  username text,
  name text,
  avatar_url text,
  bio text,
  role text,
  expertise text[],
  reading_preferences text[],
  cover_url text,
  social_links jsonb,
  achievements jsonb[],
  verified boolean,
  stats jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  reading_history jsonb,
  bookmarks jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.name,
    p.avatar_url,
    p.bio,
    p.role,
    p.expertise,
    p.reading_preferences,
    p.cover_url,
    p.social_links,
    p.achievements,
    p.verified,
    p.stats,
    p.created_at,
    p.updated_at,
    -- Reading history subquery with proper table aliases
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cv.id,
          'content_id', cv.content_id,
          'content_type', cv.content_type,
          'viewed_at', cv.viewed_at,
          'progress', cv.progress,
          'title', CASE 
            WHEN cv.content_type = 'article' THEN a.title
            WHEN cv.content_type = 'book' THEN b.title
            WHEN cv.content_type = 'audiobook' THEN ab.title
            WHEN cv.content_type = 'podcast' THEN pe.title
            ELSE NULL
          END,
          'cover_url', CASE 
            WHEN cv.content_type = 'article' THEN a.cover_url
            WHEN cv.content_type = 'book' THEN b.cover_url
            WHEN cv.content_type = 'audiobook' THEN ab.cover_url
            WHEN cv.content_type = 'podcast' THEN pe.cover_url
            ELSE NULL
          END
        )
      )
      FROM content_views cv
      LEFT JOIN articles a ON cv.content_type = 'article' AND cv.content_id = a.id
      LEFT JOIN books b ON cv.content_type = 'book' AND cv.content_id = b.id
      LEFT JOIN audiobooks ab ON cv.content_type = 'audiobook' AND cv.content_id = ab.id
      LEFT JOIN podcast_episodes pe ON cv.content_type = 'podcast' AND cv.content_id = pe.id
      WHERE cv.viewer_id = p.id
      ORDER BY cv.viewed_at DESC
      LIMIT 50
    ) as reading_history,
    -- Bookmarks subquery with proper table aliases
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', bm.id,
          'content_id', bm.content_id,
          'content_type', bm.content_type,
          'created_at', bm.created_at,
          'title', CASE 
            WHEN bm.content_type = 'article' THEN a2.title
            WHEN bm.content_type = 'book' THEN b2.title
            WHEN bm.content_type = 'audiobook' THEN ab2.title
            WHEN bm.content_type = 'podcast' THEN pe2.title
            ELSE NULL
          END,
          'cover_url', CASE 
            WHEN bm.content_type = 'article' THEN a2.cover_url
            WHEN bm.content_type = 'book' THEN b2.cover_url
            WHEN bm.content_type = 'audiobook' THEN ab2.cover_url
            WHEN bm.content_type = 'podcast' THEN pe2.cover_url
            ELSE NULL
          END
        )
      )
      FROM bookmarks bm
      LEFT JOIN articles a2 ON bm.content_type = 'article' AND bm.content_id = a2.id
      LEFT JOIN books b2 ON bm.content_type = 'book' AND bm.content_id = b2.id
      LEFT JOIN audiobooks ab2 ON bm.content_type = 'audiobook' AND bm.content_id = ab2.id
      LEFT JOIN podcast_episodes pe2 ON bm.content_type = 'podcast' AND bm.content_id = pe2.id
      WHERE bm.user_id = p.id
      ORDER BY bm.created_at DESC
      LIMIT 50
    ) as bookmarks
  FROM profiles p
  WHERE p.username = username_param;
END;
$$;