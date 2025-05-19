/*
  # Earnings Functions Migration

  1. New Functions
    - get_earnings_overview: Get earnings stats by period
    - get_earnings_by_source: Get earnings breakdown by source type
    - get_earnings_history: Get earnings transaction history
    
  2. Changes
    - Add new functions for earnings analytics
    - Add index on earnings table for better performance
*/

-- Add index for better performance
CREATE INDEX IF NOT EXISTS earnings_creator_earned_at_idx ON earnings(creator_id, earned_at);

-- Function to get earnings overview
CREATE OR REPLACE FUNCTION get_earnings_overview(creator_id uuid, period text DEFAULT 'all')
RETURNS TABLE (
  total_earnings numeric,
  earnings_growth numeric,
  monthly_revenue numeric,
  monthly_growth numeric,
  pending_payouts numeric,
  available_balance numeric
) AS $$
DECLARE
  period_start timestamptz;
  prev_period_start timestamptz;
  monthly_start timestamptz;
  prev_monthly_start timestamptz;
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

  -- Set monthly dates
  monthly_start := date_trunc('month', now());
  prev_monthly_start := monthly_start - interval '1 month';

  RETURN QUERY
  WITH current_earnings AS (
    SELECT COALESCE(SUM(amount), 0) as earnings
    FROM earnings
    WHERE creator_id = get_earnings_overview.creator_id
    AND earned_at >= period_start
  ),
  previous_earnings AS (
    SELECT COALESCE(SUM(amount), 0) as earnings
    FROM earnings
    WHERE creator_id = get_earnings_overview.creator_id
    AND earned_at >= prev_period_start
    AND earned_at < period_start
  ),
  current_monthly AS (
    SELECT COALESCE(SUM(amount), 0) as earnings
    FROM earnings
    WHERE creator_id = get_earnings_overview.creator_id
    AND earned_at >= monthly_start
  ),
  previous_monthly AS (
    SELECT COALESCE(SUM(amount), 0) as earnings
    FROM earnings
    WHERE creator_id = get_earnings_overview.creator_id
    AND earned_at >= prev_monthly_start
    AND earned_at < monthly_start
  ),
  total_earnings AS (
    SELECT COALESCE(SUM(amount), 0) as total
    FROM earnings
    WHERE creator_id = get_earnings_overview.creator_id
  )
  SELECT
    t.total,
    CASE 
      WHEN p.earnings = 0 THEN 0
      ELSE ((c.earnings - p.earnings)::numeric / NULLIF(p.earnings, 0) * 100)
    END,
    cm.earnings,
    CASE 
      WHEN pm.earnings = 0 THEN 0
      ELSE ((cm.earnings - pm.earnings)::numeric / NULLIF(pm.earnings, 0) * 100)
    END,
    -- Simulated pending payouts (20% of monthly earnings)
    cm.earnings * 0.2,
    -- Simulated available balance (80% of monthly earnings)
    cm.earnings * 0.8
  FROM total_earnings t, 
       current_earnings c, 
       previous_earnings p,
       current_monthly cm,
       previous_monthly pm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get earnings breakdown by source
CREATE OR REPLACE FUNCTION get_earnings_by_source(creator_id uuid, period text DEFAULT 'month')
RETURNS TABLE (
  source_type text,
  amount numeric,
  percentage numeric
) AS $$
DECLARE
  period_start timestamptz;
BEGIN
  -- Set period dates
  IF period = 'month' THEN
    period_start := date_trunc('month', now());
  ELSIF period = 'week' THEN
    period_start := date_trunc('week', now());
  ELSIF period = 'day' THEN
    period_start := date_trunc('day', now());
  ELSE
    period_start := '-infinity'::timestamptz;
  END IF;

  RETURN QUERY
  WITH source_totals AS (
    SELECT 
      e.source_type,
      COALESCE(SUM(e.amount), 0) as amount
    FROM earnings e
    WHERE e.creator_id = get_earnings_by_source.creator_id
    AND e.earned_at >= period_start
    GROUP BY e.source_type
  ),
  total AS (
    SELECT COALESCE(SUM(amount), 0) as total
    FROM source_totals
  )
  SELECT 
    st.source_type,
    st.amount,
    CASE 
      WHEN t.total = 0 THEN 0
      ELSE (st.amount / t.total * 100)
    END
  FROM source_totals st, total t
  ORDER BY st.amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get earnings history
CREATE OR REPLACE FUNCTION get_earnings_history(
  creator_id uuid,
  page_size int DEFAULT 10,
  page_number int DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  amount numeric,
  source_type text,
  source_id uuid,
  earned_at timestamptz,
  source_details jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.amount,
    e.source_type,
    e.source_id,
    e.earned_at,
    CASE
      WHEN e.source_type = 'book_sale' THEN (
        SELECT jsonb_build_object(
          'title', b.title,
          'price', b.price
        )
        FROM books b
        WHERE b.id = e.source_id
      )
      WHEN e.source_type = 'audiobook_sale' THEN (
        SELECT jsonb_build_object(
          'title', a.title,
          'price', a.price
        )
        FROM audiobooks a
        WHERE a.id = e.source_id
      )
      ELSE '{}'::jsonb
    END as source_details
  FROM earnings e
  WHERE e.creator_id = get_earnings_history.creator_id
  ORDER BY e.earned_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;