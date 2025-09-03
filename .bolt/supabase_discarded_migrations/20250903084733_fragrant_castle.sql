/*
  # Create reading status system for library functionality

  1. New Tables
    - `reading_status`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `content_id` (uuid, content identifier)
      - `content_type` (text, type of content)
      - `status` (text, reading status)
      - `progress` (integer, completion percentage)
      - `started_at` (timestamp, when started)
      - `completed_at` (timestamp, when completed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reading_status` table
    - Add policies for users to manage their own reading status

  3. Indexes
    - Add index for user_id and content lookups
    - Add unique constraint for user/content combination

  4. Triggers
    - Auto-update `updated_at` timestamp
    - Auto-set completion timestamps
*/

-- Create reading_status table
CREATE TABLE IF NOT EXISTS reading_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('book', 'audiobook', 'article', 'podcast')),
  status text NOT NULL DEFAULT 'want_to_experience' CHECK (status IN ('want_to_experience', 'currently_experiencing', 'experienced', 'paused', 'dropped')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id, content_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_status_user_id ON reading_status(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_status_content ON reading_status(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_reading_status_status ON reading_status(status);

-- Enable RLS
ALTER TABLE reading_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own reading status"
  ON reading_status
  FOR ALL
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reading_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Auto-set started_at when status changes to currently_experiencing
  IF OLD.status != 'currently_experiencing' AND NEW.status = 'currently_experiencing' AND NEW.started_at IS NULL THEN
    NEW.started_at = now();
  END IF;
  
  -- Auto-set completed_at when status changes to experienced
  IF OLD.status != 'experienced' AND NEW.status = 'experienced' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
  END IF;
  
  -- Auto-set status to experienced when progress reaches 100%
  IF NEW.progress = 100 AND OLD.progress < 100 THEN
    NEW.status = 'experienced';
    NEW.completed_at = COALESCE(NEW.completed_at, now());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_reading_status_timestamps
  BEFORE UPDATE ON reading_status
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_status_updated_at();

-- Add foreign key constraint to users table
ALTER TABLE reading_status 
ADD CONSTRAINT reading_status_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;