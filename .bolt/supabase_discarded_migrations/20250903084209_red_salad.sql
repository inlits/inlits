/*
  # Add Reading Status System

  1. New Tables
    - `reading_status`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `content_id` (uuid, content identifier)
      - `content_type` (text, type of content)
      - `status` (text, reading status)
      - `progress` (integer, completion percentage)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reading_status` table
    - Add policies for users to manage their own reading status

  3. Functions
    - Function to automatically update completion status
    - Function to get reading statistics
*/

-- Create reading_status table
CREATE TABLE IF NOT EXISTS reading_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
  status text NOT NULL CHECK (status IN ('want_to_consume', 'consuming', 'completed', 'paused', 'dropped')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id, content_type)
);

-- Enable RLS
ALTER TABLE reading_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own reading status"
  ON reading_status
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_status_user_id ON reading_status(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_status_content ON reading_status(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_reading_status_status ON reading_status(status);
CREATE INDEX IF NOT EXISTS idx_reading_status_user_status ON reading_status(user_id, status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_reading_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Auto-set timestamps based on status changes
  IF NEW.status = 'consuming' AND OLD.status != 'consuming' THEN
    NEW.started_at = COALESCE(NEW.started_at, now());
  END IF;
  
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
    NEW.progress = 100;
  END IF;
  
  -- Auto-complete when progress reaches 100%
  IF NEW.progress = 100 AND NEW.status != 'completed' THEN
    NEW.status = 'completed';
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reading_status_updated_at
  BEFORE UPDATE ON reading_status
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_status_updated_at();

-- Function to get user's reading statistics
CREATE OR REPLACE FUNCTION get_user_reading_stats(p_user_id uuid)
RETURNS TABLE (
  total_content integer,
  want_to_consume integer,
  consuming integer,
  completed integer,
  paused integer,
  dropped integer,
  articles_read integer,
  books_read integer,
  audiobooks_listened integer,
  podcasts_listened integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_content,
    COUNT(*) FILTER (WHERE status = 'want_to_consume')::integer as want_to_consume,
    COUNT(*) FILTER (WHERE status = 'consuming')::integer as consuming,
    COUNT(*) FILTER (WHERE status = 'completed')::integer as completed,
    COUNT(*) FILTER (WHERE status = 'paused')::integer as paused,
    COUNT(*) FILTER (WHERE status = 'dropped')::integer as dropped,
    COUNT(*) FILTER (WHERE content_type = 'article' AND status = 'completed')::integer as articles_read,
    COUNT(*) FILTER (WHERE content_type = 'book' AND status = 'completed')::integer as books_read,
    COUNT(*) FILTER (WHERE content_type = 'audiobook' AND status = 'completed')::integer as audiobooks_listened,
    COUNT(*) FILTER (WHERE content_type = 'podcast' AND status = 'completed')::integer as podcasts_listened
  FROM reading_status
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update reading status based on content views
CREATE OR REPLACE FUNCTION auto_update_reading_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if there's a viewer_id (authenticated user)
  IF NEW.viewer_id IS NOT NULL THEN
    -- Check if user already has a reading status for this content
    INSERT INTO reading_status (user_id, content_id, content_type, status, progress)
    VALUES (NEW.viewer_id, NEW.content_id, NEW.content_type, 'consuming', 0)
    ON CONFLICT (user_id, content_id, content_type) 
    DO UPDATE SET
      status = CASE 
        WHEN reading_status.status = 'want_to_consume' THEN 'consuming'
        ELSE reading_status.status
      END,
      started_at = CASE 
        WHEN reading_status.started_at IS NULL THEN now()
        ELSE reading_status.started_at
      END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update reading status on content views
DROP TRIGGER IF EXISTS auto_update_reading_status_trigger ON content_views;
CREATE TRIGGER auto_update_reading_status_trigger
  AFTER INSERT ON content_views
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_reading_status();