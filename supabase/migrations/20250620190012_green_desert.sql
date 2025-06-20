/*
  # Security Enhancements Migration

  1. New Tables
    - `security_logs` - For tracking security events
      - `id` (uuid, primary key)
      - `event` (text)
      - `details` (jsonb)
      - `ip_address` (text)
      - `user_id` (uuid, references auth.users)
      - `timestamp` (timestamptz)

  2. Security
    - Add security logs table
    - Add additional RLS policies for better security
    - Add function to check for suspicious activity
*/

-- Create security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can view security logs"
  ON security_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create index for better query performance
CREATE INDEX security_logs_timestamp_idx ON security_logs(timestamp DESC);
CREATE INDEX security_logs_user_id_idx ON security_logs(user_id);
CREATE INDEX security_logs_event_idx ON security_logs(event);

-- Function to check for suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity(
  user_id uuid,
  ip_address text,
  user_agent text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  suspicious boolean := false;
  recent_ips text[];
  login_count integer;
BEGIN
  -- Check for multiple IPs in short time period
  SELECT ARRAY_AGG(DISTINCT ip_address)
  INTO recent_ips
  FROM security_logs
  WHERE user_id = check_suspicious_activity.user_id
    AND event = 'login'
    AND timestamp > now() - interval '24 hours';
    
  -- Check for rapid login attempts
  SELECT COUNT(*)
  INTO login_count
  FROM security_logs
  WHERE ip_address = check_suspicious_activity.ip_address
    AND event = 'login_attempt'
    AND timestamp > now() - interval '10 minutes';
    
  -- Determine if activity is suspicious
  IF (recent_ips IS NOT NULL AND array_length(recent_ips, 1) > 3) OR login_count > 10 THEN
    suspicious := true;
    
    -- Log suspicious activity
    INSERT INTO security_logs (
      event,
      details,
      ip_address,
      user_id
    )
    VALUES (
      'suspicious_activity',
      jsonb_build_object(
        'reason', CASE
          WHEN recent_ips IS NOT NULL AND array_length(recent_ips, 1) > 3 THEN 'multiple_ips'
          WHEN login_count > 10 THEN 'rapid_login_attempts'
          ELSE 'unknown'
        END,
        'recent_ips', recent_ips,
        'login_count', login_count,
        'user_agent', user_agent
      ),
      check_suspicious_activity.ip_address,
      check_suspicious_activity.user_id
    );
  END IF;
  
  RETURN suspicious;
END;
$$;

-- Add additional RLS policies for content tables
DO $$ 
BEGIN
  -- Ensure RLS is enabled on all content tables
  ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE books ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
  
  -- Add more restrictive policies for content modification
  DROP POLICY IF EXISTS "Creators can update their own articles" ON articles;
  CREATE POLICY "Creators can update their own articles"
    ON articles
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = author_id AND
      NOT EXISTS (
        SELECT 1 FROM security_logs
        WHERE user_id = auth.uid()
          AND event = 'suspicious_activity'
          AND timestamp > now() - interval '24 hours'
      )
    );
    
  -- Repeat for other content tables
  DROP POLICY IF EXISTS "Creators can update their own books" ON books;
  CREATE POLICY "Creators can update their own books"
    ON books
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = author_id AND
      NOT EXISTS (
        SELECT 1 FROM security_logs
        WHERE user_id = auth.uid()
          AND event = 'suspicious_activity'
          AND timestamp > now() - interval '24 hours'
      )
    );
    
  DROP POLICY IF EXISTS "Creators can update their own audiobooks" ON audiobooks;
  CREATE POLICY "Creators can update their own audiobooks"
    ON audiobooks
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = author_id AND
      NOT EXISTS (
        SELECT 1 FROM security_logs
        WHERE user_id = auth.uid()
          AND event = 'suspicious_activity'
          AND timestamp > now() - interval '24 hours'
      )
    );
    
  DROP POLICY IF EXISTS "Creators can update their own episodes" ON podcast_episodes;
  CREATE POLICY "Creators can update their own episodes"
    ON podcast_episodes
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = author_id AND
      NOT EXISTS (
        SELECT 1 FROM security_logs
        WHERE user_id = auth.uid()
          AND event = 'suspicious_activity'
          AND timestamp > now() - interval '24 hours'
      )
    );
END $$;

-- Add view_duration column to content_views if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_views' 
    AND column_name = 'view_duration'
  ) THEN
    ALTER TABLE content_views ADD COLUMN view_duration interval;
  END IF;
END $$;