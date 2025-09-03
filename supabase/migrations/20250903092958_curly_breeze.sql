/*
  # Create reading_status table

  1. New Tables
    - `reading_status`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `content_id` (uuid)
      - `content_type` (text, check constraint)
      - `status` (text, check constraint)
      - `progress` (integer, 0-100)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `reading_status` table
    - Add policies for authenticated users to manage their own reading status

  3. Features
    - Unique constraint on user_id, content_id, content_type
    - Indexes for performance
    - Trigger to auto-update updated_at column
*/

-- Create reading_status table
CREATE TABLE IF NOT EXISTS reading_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
  status text NOT NULL DEFAULT 'want_to_consume' CHECK (status IN ('want_to_consume', 'consuming', 'completed', 'paused', 'dropped')),
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
CREATE POLICY "Users can view their own reading status"
  ON reading_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading status"
  ON reading_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading status"
  ON reading_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading status"
  ON reading_status
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_status_user_id ON reading_status(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_status_content ON reading_status(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_reading_status_status ON reading_status(status);
CREATE INDEX IF NOT EXISTS idx_reading_status_user_status ON reading_status(user_id, status);

-- Create trigger for updated_at
CREATE TRIGGER update_reading_status_updated_at
  BEFORE UPDATE ON reading_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();