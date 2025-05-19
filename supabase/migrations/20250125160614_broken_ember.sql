/*
  # Analytics Tables

  1. New Tables
    - `content_views` - Track views for all content types
      - `id` (uuid, primary key)
      - `content_id` (uuid)
      - `content_type` (text)
      - `viewer_id` (uuid)
      - `viewed_at` (timestamptz)
    
    - `followers` - Track creator followers
      - `id` (uuid, primary key) 
      - `creator_id` (uuid)
      - `follower_id` (uuid)
      - `followed_at` (timestamptz)

    - `earnings` - Track creator earnings
      - `id` (uuid, primary key)
      - `creator_id` (uuid)
      - `amount` (numeric)
      - `source_type` (text)
      - `source_id` (uuid)
      - `earned_at` (timestamptz)

    - `activity_log` - Track creator activity
      - `id` (uuid, primary key)
      - `creator_id` (uuid)
      - `activity_type` (text)
      - `activity_data` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for viewing and managing data
*/

-- Content Views Table
CREATE TABLE IF NOT EXISTS content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
  viewer_id uuid REFERENCES auth.users(id),
  viewed_at timestamptz DEFAULT now()
);

-- Followers Table
CREATE TABLE IF NOT EXISTS followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  followed_at timestamptz DEFAULT now(),
  UNIQUE(creator_id, follower_id)
);

-- Earnings Table
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  source_type text NOT NULL CHECK (source_type IN ('book_sale', 'audiobook_sale', 'subscription', 'session')),
  source_id uuid,
  earned_at timestamptz DEFAULT now()
);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('content_published', 'content_updated', 'session_scheduled', 'earned_money', 'gained_follower')),
  activity_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Content Views Policies
CREATE POLICY "Creators can view their content views"
  ON content_views
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM articles WHERE articles.id = content_id AND articles.author_id = auth.uid()
    UNION
    SELECT 1 FROM books WHERE books.id = content_id AND books.author_id = auth.uid()
    UNION
    SELECT 1 FROM audiobooks WHERE audiobooks.id = content_id AND audiobooks.author_id = auth.uid()
    UNION
    SELECT 1 FROM podcast_episodes WHERE podcast_episodes.id = content_id AND podcast_episodes.author_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create views"
  ON content_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Followers Policies
CREATE POLICY "Anyone can view followers"
  ON followers
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can follow/unfollow"
  ON followers
  FOR ALL
  TO authenticated
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

-- Earnings Policies
CREATE POLICY "Creators can view their earnings"
  ON earnings
  FOR SELECT
  USING (creator_id = auth.uid());

-- Activity Log Policies
CREATE POLICY "Creators can view their activity"
  ON activity_log
  FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "System can create activity logs"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create functions for analytics
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
    WHERE p.id = creator_id
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
    WHERE p.id = creator_id
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