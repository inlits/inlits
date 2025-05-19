-- Profile Management

-- Add additional profile fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS expertise text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS achievements jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '{
  "total_content": 0,
  "total_views": 0,
  "total_followers": 0,
  "avg_rating": 0
}'::jsonb;

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
  created_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id, content_type)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own bookmarks"
  ON bookmarks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own ratings"
  ON ratings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view ratings"
  ON ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own comments"
  ON comments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view comments"
  ON comments
  FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS bookmarks_user_content_idx ON bookmarks(user_id, content_id, content_type);
CREATE INDEX IF NOT EXISTS ratings_content_idx ON ratings(content_id, content_type);
CREATE INDEX IF NOT EXISTS comments_content_idx ON comments(content_id, content_type);
CREATE INDEX IF NOT EXISTS comments_parent_idx ON comments(parent_id);

-- Create function to get creator profile
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
        'excerpt', a.excerpt,
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
      'created_at', p.created_at
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
    p.achievements
  FROM creator p
  CROSS JOIN content_stats cs
  CROSS JOIN recent_articles ra
  CROSS JOIN recent_books rb
  CROSS JOIN recent_audiobooks rab
  CROSS JOIN recent_podcasts rp;
END;
$$;

-- Create function to get user profile
CREATE OR REPLACE FUNCTION get_user_profile(username text)
RETURNS TABLE (
  profile jsonb,
  stats jsonb,
  reading_history jsonb,
  bookmarks jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH profile_user AS (
    SELECT * FROM profiles WHERE profiles.username = get_user_profile.username
  ),
  reading_stats AS (
    SELECT
      COUNT(DISTINCT cv.content_id) as total_content_viewed,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'article') as articles_read,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'book') as books_read,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'audiobook') as audiobooks_listened,
      COUNT(DISTINCT cv.content_id) FILTER (WHERE cv.content_type = 'podcast') as podcasts_listened,
      EXTRACT(epoch FROM AVG(cv.view_duration))::int as avg_view_duration
    FROM content_views cv
    WHERE cv.viewer_id = (SELECT id FROM profile_user)
  ),
  recent_views AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', cv.content_id,
        'type', cv.content_type,
        'title', COALESCE(
          (SELECT title FROM articles WHERE id = cv.content_id),
          (SELECT title FROM books WHERE id = cv.content_id),
          (SELECT title FROM audiobooks WHERE id = cv.content_id),
          (SELECT title FROM podcast_episodes WHERE id = cv.content_id)
        ),
        'viewed_at', cv.viewed_at,
        'progress', cv.progress
      )
    ) as views
    FROM (
      SELECT DISTINCT ON (content_id, content_type)
        content_id,
        content_type,
        viewed_at,
        progress
      FROM content_views
      WHERE viewer_id = (SELECT id FROM profile_user)
      ORDER BY content_id, content_type, viewed_at DESC
      LIMIT 10
    ) cv
  ),
  bookmarked_content AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', b.content_id,
        'type', b.content_type,
        'title', COALESCE(
          (SELECT title FROM articles WHERE id = b.content_id),
          (SELECT title FROM books WHERE id = b.content_id),
          (SELECT title FROM audiobooks WHERE id = b.content_id),
          (SELECT title FROM podcast_episodes WHERE id = b.content_id)
        ),
        'bookmarked_at', b.created_at
      )
    ) as bookmarks
    FROM bookmarks b
    WHERE b.user_id = (SELECT id FROM profile_user)
    ORDER BY b.created_at DESC
    LIMIT 10
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
      'created_at', p.created_at
    ) as profile,
    
    -- Stats
    jsonb_build_object(
      'total_content_viewed', rs.total_content_viewed,
      'articles_read', rs.articles_read,
      'books_read', rs.books_read,
      'audiobooks_listened', rs.audiobooks_listened,
      'podcasts_listened', rs.podcasts_listened,
      'avg_view_duration', rs.avg_view_duration,
      'following_count', (
        SELECT COUNT(*) FROM followers 
        WHERE follower_id = p.id
      )
    ) as stats,
    
    -- Reading History
    jsonb_build_object(
      'recent_views', COALESCE(rv.views, '[]'::jsonb)
    ) as reading_history,
    
    -- Bookmarks
    jsonb_build_object(
      'recent_bookmarks', COALESCE(bc.bookmarks, '[]'::jsonb)
    ) as bookmarks
    
  FROM profile_user p
  CROSS JOIN reading_stats rs
  CROSS JOIN recent_views rv
  CROSS JOIN bookmarked_content bc;
END;
$$;

-- Create function to check if user follows a creator
CREATE OR REPLACE FUNCTION check_following(
  follower_id uuid,
  creator_id uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM followers
    WHERE followers.follower_id = check_following.follower_id
    AND followers.creator_id = check_following.creator_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to toggle follow status
CREATE OR REPLACE FUNCTION toggle_follow(
  creator_id uuid
) RETURNS boolean AS $$
DECLARE
  was_following boolean;
BEGIN
  -- Check if already following
  SELECT EXISTS (
    SELECT 1 FROM followers
    WHERE follower_id = auth.uid()
    AND creator_id = toggle_follow.creator_id
  ) INTO was_following;
  
  IF was_following THEN
    -- Unfollow
    DELETE FROM followers
    WHERE follower_id = auth.uid()
    AND creator_id = toggle_follow.creator_id;
    RETURN false;
  ELSE
    -- Follow
    INSERT INTO followers (follower_id, creator_id)
    VALUES (auth.uid(), creator_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;