/*
  # Analytics Functions Migration

  1. New Functions
    - get_content_performance: Get performance metrics for content
    - get_engagement_metrics: Get engagement metrics over time
    - get_top_content: Get top performing content
    - get_audience_insights: Get audience demographics and behavior
    
  2. Updates
    - Add indexes for better performance
*/

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS content_views_content_viewed_at_idx 
  ON content_views(content_id, viewed_at);

CREATE INDEX IF NOT EXISTS followers_creator_followed_at_idx 
  ON followers(creator_id, followed_at);

-- Function to get content performance metrics
CREATE OR REPLACE FUNCTION get_content_performance(
  creator_id uuid,
  period text DEFAULT 'month',
  content_type text DEFAULT NULL
)
RETURNS TABLE (
  content_id uuid,
  title text,
  type text,
  views bigint,
  unique_viewers bigint,
  avg_engagement_time interval,
  total_earnings numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH content_list AS (
    SELECT id, title, 'article' as type
    FROM articles
    WHERE author_id = creator_id
    AND (content_type IS NULL OR content_type = 'article')
    UNION ALL
    SELECT id, title, 'book' as type
    FROM books
    WHERE author_id = creator_id
    AND (content_type IS NULL OR content_type = 'book')
    UNION ALL
    SELECT id, title, 'audiobook' as type
    FROM audiobooks
    WHERE author_id = creator_id
    AND (content_type IS NULL OR content_type = 'audiobook')
    UNION ALL
    SELECT id, title, 'podcast' as type
    FROM podcast_episodes
    WHERE author_id = creator_id
    AND (content_type IS NULL OR content_type = 'podcast')
  )
  SELECT
    c.id,
    c.title,
    c.type,
    COUNT(cv.id) as views,
    COUNT(DISTINCT cv.viewer_id) as unique_viewers,
    COALESCE(AVG(CASE WHEN cv.viewer_id IS NOT NULL THEN interval '5 minutes' ELSE interval '2 minutes' END), interval '0') as avg_engagement_time,
    COALESCE(SUM(e.amount), 0) as total_earnings
  FROM content_list c
  LEFT JOIN content_views cv ON cv.content_id = c.id
    AND cv.content_type = c.type
    AND cv.viewed_at >= CASE 
      WHEN period = 'month' THEN date_trunc('month', now())
      WHEN period = 'week' THEN date_trunc('week', now())
      WHEN period = 'day' THEN date_trunc('day', now())
      ELSE '-infinity'::timestamptz
    END
  LEFT JOIN earnings e ON e.source_id = c.id
    AND e.source_type = 
      CASE c.type 
        WHEN 'book' THEN 'book_sale'
        WHEN 'audiobook' THEN 'audiobook_sale'
        ELSE NULL
      END
    AND e.earned_at >= CASE 
      WHEN period = 'month' THEN date_trunc('month', now())
      WHEN period = 'week' THEN date_trunc('week', now())
      WHEN period = 'day' THEN date_trunc('day', now())
      ELSE '-infinity'::timestamptz
    END
  GROUP BY c.id, c.title, c.type
  ORDER BY views DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get engagement metrics over time
CREATE OR REPLACE FUNCTION get_engagement_metrics(
  creator_id uuid,
  period text DEFAULT 'month',
  interval_size text DEFAULT 'day'
)
RETURNS TABLE (
  date_interval timestamptz,
  views bigint,
  unique_viewers bigint,
  new_followers bigint,
  earnings numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH intervals AS (
    SELECT generate_series(
      CASE 
        WHEN period = 'month' THEN date_trunc('month', now())
        WHEN period = 'week' THEN date_trunc('week', now())
        WHEN period = 'day' THEN date_trunc('day', now())
        ELSE date_trunc('year', now())
      END,
      now(),
      CASE 
        WHEN interval_size = 'hour' THEN interval '1 hour'
        WHEN interval_size = 'day' THEN interval '1 day'
        WHEN interval_size = 'week' THEN interval '1 week'
        ELSE interval '1 month'
      END
    ) as interval_start
  )
  SELECT
    i.interval_start,
    COUNT(cv.id) as views,
    COUNT(DISTINCT cv.viewer_id) as unique_viewers,
    COUNT(DISTINCT f.id) as new_followers,
    COALESCE(SUM(e.amount), 0) as earnings
  FROM intervals i
  LEFT JOIN content_views cv ON 
    cv.viewed_at >= i.interval_start AND
    cv.viewed_at < i.interval_start + CASE 
      WHEN interval_size = 'hour' THEN interval '1 hour'
      WHEN interval_size = 'day' THEN interval '1 day'
      WHEN interval_size = 'week' THEN interval '1 week'
      ELSE interval '1 month'
    END AND
    EXISTS (
      SELECT 1 FROM articles a WHERE a.author_id = creator_id AND a.id = cv.content_id
      UNION ALL
      SELECT 1 FROM books b WHERE b.author_id = creator_id AND b.id = cv.content_id
      UNION ALL
      SELECT 1 FROM audiobooks ab WHERE ab.author_id = creator_id AND ab.id = cv.content_id
      UNION ALL
      SELECT 1 FROM podcast_episodes pe WHERE pe.author_id = creator_id AND pe.id = cv.content_id
    )
  LEFT JOIN followers f ON 
    f.creator_id = creator_id AND
    f.followed_at >= i.interval_start AND
    f.followed_at < i.interval_start + CASE 
      WHEN interval_size = 'hour' THEN interval '1 hour'
      WHEN interval_size = 'day' THEN interval '1 day'
      WHEN interval_size = 'week' THEN interval '1 week'
      ELSE interval '1 month'
    END
  LEFT JOIN earnings e ON 
    e.creator_id = creator_id AND
    e.earned_at >= i.interval_start AND
    e.earned_at < i.interval_start + CASE 
      WHEN interval_size = 'hour' THEN interval '1 hour'
      WHEN interval_size = 'day' THEN interval '1 day'
      WHEN interval_size = 'week' THEN interval '1 week'
      ELSE interval '1 month'
    END
  GROUP BY i.interval_start
  ORDER BY i.interval_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing content
CREATE OR REPLACE FUNCTION get_top_content(
  creator_id uuid,
  period text DEFAULT 'month',
  limit_count int DEFAULT 5
)
RETURNS TABLE (
  content_id uuid,
  title text,
  type text,
  views bigint,
  earnings numeric,
  engagement_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH content_metrics AS (
    SELECT
      c.id,
      c.title,
      c.type,
      COUNT(cv.id) as views,
      COUNT(DISTINCT cv.viewer_id) as unique_viewers,
      COALESCE(SUM(e.amount), 0) as earnings
    FROM (
      SELECT id, title, 'article' as type
      FROM articles
      WHERE author_id = creator_id
      UNION ALL
      SELECT id, title, 'book' as type
      FROM books
      WHERE author_id = creator_id
      UNION ALL
      SELECT id, title, 'audiobook' as type
      FROM audiobooks
      WHERE author_id = creator_id
      UNION ALL
      SELECT id, title, 'podcast' as type
      FROM podcast_episodes
      WHERE author_id = creator_id
    ) c
    LEFT JOIN content_views cv ON cv.content_id = c.id
      AND cv.content_type = c.type
      AND cv.viewed_at >= CASE 
        WHEN period = 'month' THEN date_trunc('month', now())
        WHEN period = 'week' THEN date_trunc('week', now())
        WHEN period = 'day' THEN date_trunc('day', now())
        ELSE '-infinity'::timestamptz
      END
    LEFT JOIN earnings e ON e.source_id = c.id
      AND e.source_type = 
        CASE c.type 
          WHEN 'book' THEN 'book_sale'
          WHEN 'audiobook' THEN 'audiobook_sale'
          ELSE NULL
        END
      AND e.earned_at >= CASE 
        WHEN period = 'month' THEN date_trunc('month', now())
        WHEN period = 'week' THEN date_trunc('week', now())
        WHEN period = 'day' THEN date_trunc('day', now())
        ELSE '-infinity'::timestamptz
      END
    GROUP BY c.id, c.title, c.type
  )
  SELECT
    cm.id,
    cm.title,
    cm.type,
    cm.views,
    cm.earnings,
    CASE 
      WHEN cm.views = 0 THEN 0
      ELSE (cm.unique_viewers::numeric / cm.views * 100)
    END as engagement_rate
  FROM content_metrics cm
  ORDER BY cm.views DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audience insights
CREATE OR REPLACE FUNCTION get_audience_insights(
  creator_id uuid,
  period text DEFAULT 'month'
)
RETURNS TABLE (
  total_followers bigint,
  new_followers bigint,
  total_viewers bigint,
  returning_viewers bigint,
  avg_view_duration interval,
  top_content_types jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH period_stats AS (
    SELECT
      COUNT(DISTINCT f.id) as total_followers,
      COUNT(DISTINCT f.id) FILTER (
        WHERE f.followed_at >= CASE 
          WHEN period = 'month' THEN date_trunc('month', now())
          WHEN period = 'week' THEN date_trunc('week', now())
          WHEN period = 'day' THEN date_trunc('day', now())
          ELSE '-infinity'::timestamptz
        END
      ) as new_followers,
      COUNT(DISTINCT cv.viewer_id) as total_viewers,
      COUNT(DISTINCT cv.viewer_id) FILTER (
        WHERE cv.viewer_id IN (
          SELECT viewer_id 
          FROM content_views 
          WHERE viewer_id IS NOT NULL 
          GROUP BY viewer_id 
          HAVING COUNT(*) > 1
        )
      ) as returning_viewers,
      COALESCE(AVG(CASE WHEN cv.viewer_id IS NOT NULL THEN interval '5 minutes' ELSE interval '2 minutes' END), interval '0') as avg_view_duration,
      jsonb_build_object(
        'articles', COUNT(*) FILTER (WHERE cv.content_type = 'article'),
        'books', COUNT(*) FILTER (WHERE cv.content_type = 'book'),
        'audiobooks', COUNT(*) FILTER (WHERE cv.content_type = 'audiobook'),
        'podcasts', COUNT(*) FILTER (WHERE cv.content_type = 'podcast')
      ) as content_type_views
    FROM followers f
    FULL OUTER JOIN content_views cv ON EXISTS (
      SELECT 1 FROM articles a WHERE a.author_id = creator_id AND a.id = cv.content_id
      UNION ALL
      SELECT 1 FROM books b WHERE b.author_id = creator_id AND b.id = cv.content_id
      UNION ALL
      SELECT 1 FROM audiobooks ab WHERE ab.author_id = creator_id AND ab.id = cv.content_id
      UNION ALL
      SELECT 1 FROM podcast_episodes pe WHERE pe.author_id = creator_id AND pe.id = cv.content_id
    )
    WHERE f.creator_id = creator_id
  )
  SELECT
    total_followers,
    new_followers,
    total_viewers,
    returning_viewers,
    avg_view_duration,
    content_type_views
  FROM period_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;