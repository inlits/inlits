-- Function to get creator stats
CREATE OR REPLACE FUNCTION get_creator_stats(creator_id uuid, period text DEFAULT 'all')
RETURNS TABLE (
  total_views bigint,
  total_followers bigint,
  total_earnings numeric,
  views_growth numeric,
  followers_growth numeric,
  earnings_growth numeric
) AS $$
DECLARE
  period_start timestamptz;
  prev_period_start timestamptz;
BEGIN
  -- Set period dates
  IF period = 'month' THEN
    period_start := date_trunc('month', now());
    prev_period_start := period_start - interval '1 month';
  ELSIF period = 'week' THEN
    period_start := date_trunc('week', now());
    prev_period_start := period_start - interval '1 week';
  ELSIF period = 'day' THEN
    period_start := date_trunc('day', now());
    prev_period_start := period_start - interval '1 day';
  ELSE
    period_start := '-infinity'::timestamptz;
    prev_period_start := '-infinity'::timestamptz;
  END IF;

  RETURN QUERY
  WITH current_stats AS (
    SELECT
      COUNT(DISTINCT cv.id) as views,
      COUNT(DISTINCT f.id) as followers,
      COALESCE(SUM(e.amount), 0) as earnings
    FROM profiles p
    LEFT JOIN content_views cv ON EXISTS (
      SELECT 1 FROM articles a WHERE a.author_id = p.id AND a.id = cv.content_id
      UNION ALL
      SELECT 1 FROM books b WHERE b.author_id = p.id AND b.id = cv.content_id
      UNION ALL
      SELECT 1 FROM audiobooks ab WHERE ab.author_id = p.id AND ab.id = cv.content_id
      UNION ALL
      SELECT 1 FROM podcast_episodes pe WHERE pe.author_id = p.id AND pe.id = cv.content_id
    ) AND cv.viewed_at >= period_start
    LEFT JOIN followers f ON f.creator_id = p.id AND f.followed_at >= period_start
    LEFT JOIN earnings e ON e.creator_id = p.id AND e.earned_at >= period_start
    WHERE p.id = get_creator_stats.creator_id
  ),
  previous_stats AS (
    SELECT
      COUNT(DISTINCT cv.id) as views,
      COUNT(DISTINCT f.id) as followers,
      COALESCE(SUM(e.amount), 0) as earnings
    FROM profiles p
    LEFT JOIN content_views cv ON EXISTS (
      SELECT 1 FROM articles a WHERE a.author_id = p.id AND a.id = cv.content_id
      UNION ALL
      SELECT 1 FROM books b WHERE b.author_id = p.id AND b.id = cv.content_id
      UNION ALL
      SELECT 1 FROM audiobooks ab WHERE ab.author_id = p.id AND ab.id = cv.content_id
      UNION ALL
      SELECT 1 FROM podcast_episodes pe WHERE pe.author_id = p.id AND pe.id = cv.content_id
    ) AND cv.viewed_at >= prev_period_start AND cv.viewed_at < period_start
    LEFT JOIN followers f ON f.creator_id = p.id AND f.followed_at >= prev_period_start AND f.followed_at < period_start
    LEFT JOIN earnings e ON e.creator_id = p.id AND e.earned_at >= prev_period_start AND e.earned_at < period_start
    WHERE p.id = get_creator_stats.creator_id
  )
  SELECT
    c.views,
    c.followers,
    c.earnings,
    CASE 
      WHEN p.views = 0 THEN 0
      ELSE ((c.views - p.views)::numeric / NULLIF(p.views, 0) * 100)
    END,
    CASE 
      WHEN p.followers = 0 THEN 0
      ELSE ((c.followers - p.followers)::numeric / NULLIF(p.followers, 0) * 100)
    END,
    CASE 
      WHEN p.earnings = 0 THEN 0
      ELSE ((c.earnings - p.earnings)::numeric / NULLIF(p.earnings, 0) * 100)
    END
  FROM current_stats c, previous_stats p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;