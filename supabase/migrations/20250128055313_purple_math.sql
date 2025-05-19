/*
  # Fix Creator Profile Issues

  1. Changes
    - Add created_at column to profiles table
    - Add excerpt column to articles table
    - Update get_creator_profile function to handle missing columns

  2. Fixes
    - Resolves "column p.created_at does not exist" error
    - Resolves "column a.excerpt does not exist" error
*/

-- Add created_at to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add excerpt to articles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' 
    AND column_name = 'excerpt'
  ) THEN
    ALTER TABLE articles ADD COLUMN excerpt text;
  END IF;
END $$;

-- Update get_creator_profile function to handle missing columns
CREATE OR REPLACE FUNCTION get_creator_profile(username text)
RETURNS TABLE (
  profile jsonb,
  stats jsonb,
  recent_content jsonb,
  achievements jsonb[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH creator AS (
    SELECT * FROM profiles WHERE profiles.username = get_creator_profile.username
  ),
  content_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE type = 'article') as total_articles,
      COUNT(*) FILTER (WHERE type = 'book') as total_books,
      COUNT(*) FILTER (WHERE type = 'audiobook') as total_audiobooks,
      COUNT(*) FILTER (WHERE type = 'podcast') as total_podcasts,
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(AVG(CASE WHEN rating_count > 0 THEN rating_sum::float / rating_count ELSE NULL END), 0) as avg_rating
    FROM (
      SELECT 
        'article' as type,
        COUNT(cv.id) as views,
        COUNT(r.id) as rating_count,
        SUM(r.rating) as rating_sum
      FROM articles a
      LEFT JOIN content_views cv ON cv.content_id = a.id AND cv.content_type = 'article'
      LEFT JOIN ratings r ON r.content_id = a.id AND r.content_type = 'article'
      WHERE a.author_id = (SELECT id FROM creator)
      GROUP BY a.id
      
      UNION ALL
      
      SELECT 
        'book' as type,
        COUNT(cv.id) as views,
        COUNT(r.id) as rating_count,
        SUM(r.rating) as rating_sum
      FROM books b
      LEFT JOIN content_views cv ON cv.content_id = b.id AND cv.content_type = 'book'
      LEFT JOIN ratings r ON r.content_id = b.id AND r.content_type = 'book'
      WHERE b.author_id = (SELECT id FROM creator)
      GROUP BY b.id
      
      UNION ALL
      
      SELECT 
        'audiobook' as type,
        COUNT(cv.id) as views,
        COUNT(r.id) as rating_count,
        SUM(r.rating) as rating_sum
      FROM audiobooks ab
      LEFT JOIN content_views cv ON cv.content_id = ab.id AND cv.content_type = 'audiobook'
      LEFT JOIN ratings r ON r.content_id = ab.id AND r.content_type = 'audiobook'
      WHERE ab.author_id = (SELECT id FROM creator)
      GROUP BY ab.id
      
      UNION ALL
      
      SELECT 
        'podcast' as type,
        COUNT(cv.id) as views,
        COUNT(r.id) as rating_count,
        SUM(r.rating) as rating_sum
      FROM podcast_episodes pe
      LEFT JOIN content_views cv ON cv.content_id = pe.id AND cv.content_type = 'podcast'
      LEFT JOIN ratings r ON r.content_id = pe.id AND r.content_type = 'podcast'
      WHERE pe.author_id = (SELECT id FROM creator)
      GROUP BY pe.id
    ) content
  ),
  recent_articles AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'title', a.title,
        'excerpt', COALESCE(a.excerpt, substring(a.content from 1 for 200)),
        'cover_url', a.cover_url,
        'created_at', a.created_at,
        'views', (SELECT COUNT(*) FROM content_views WHERE content_id = a.id AND content_type = 'article')
      )
    ) as articles
    FROM (
      SELECT * FROM articles 
      WHERE author_id = (SELECT id FROM creator)
      AND status = 'published'
      ORDER BY created_at DESC 
      LIMIT 5
    ) a
  ),
  recent_books AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'title', b.title,
        'description', b.description,
        'cover_url', b.cover_url,
        'price', b.price,
        'created_at', b.created_at,
        'views', (SELECT COUNT(*) FROM content_views WHERE content_id = b.id AND content_type = 'book')
      )
    ) as books
    FROM (
      SELECT * FROM books 
      WHERE author_id = (SELECT id FROM creator)
      AND status = 'published'
      ORDER BY created_at DESC 
      LIMIT 5
    ) b
  ),
  recent_audiobooks AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ab.id,
        'title', ab.title,
        'description', ab.description,
        'cover_url', ab.cover_url,
        'price', ab.price,
        'narrator', ab.narrator,
        'created_at', ab.created_at,
        'views', (SELECT COUNT(*) FROM content_views WHERE content_id = ab.id AND content_type = 'audiobook')
      )
    ) as audiobooks
    FROM (
      SELECT * FROM audiobooks 
      WHERE author_id = (SELECT id FROM creator)
      AND status = 'published'
      ORDER BY created_at DESC 
      LIMIT 5
    ) ab
  ),
  recent_podcasts AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', pe.id,
        'title', pe.title,
        'description', pe.description,
        'cover_url', pe.cover_url,
        'duration', pe.duration,
        'created_at', pe.created_at,
        'views', (SELECT COUNT(*) FROM content_views WHERE content_id = pe.id AND content_type = 'podcast')
      )
    ) as podcasts
    FROM (
      SELECT * FROM podcast_episodes 
      WHERE author_id = (SELECT id FROM creator)
      AND status = 'published'
      ORDER BY created_at DESC 
      LIMIT 5
    ) pe
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
      'social_links', p.social_links,
      'verified', p.verified,
      'created_at', COALESCE(p.created_at, p.updated_at)
    ) as profile,
    
    -- Stats
    jsonb_build_object(
      'total_content', (
        cs.total_articles + cs.total_books + 
        cs.total_audiobooks + cs.total_podcasts
      ),
      'total_articles', cs.total_articles,
      'total_books', cs.total_books,
      'total_audiobooks', cs.total_audiobooks,
      'total_podcasts', cs.total_podcasts,
      'total_views', cs.total_views,
      'avg_rating', ROUND(cs.avg_rating::numeric, 1),
      'total_followers', (
        SELECT COUNT(*) FROM followers 
        WHERE creator_id = p.id
      )
    ) as stats,
    
    -- Recent Content
    jsonb_build_object(
      'articles', COALESCE(ra.articles, '[]'::jsonb),
      'books', COALESCE(rb.books, '[]'::jsonb),
      'audiobooks', COALESCE(rab.audiobooks, '[]'::jsonb),
      'podcasts', COALESCE(rp.podcasts, '[]'::jsonb)
    ) as recent_content,
    
    -- Achievements
    COALESCE(p.achievements, ARRAY[]::jsonb[])
  FROM creator p
  CROSS JOIN content_stats cs
  CROSS JOIN recent_articles ra
  CROSS JOIN recent_books rb
  CROSS JOIN recent_audiobooks rab
  CROSS JOIN recent_podcasts rp;
END;
$$;