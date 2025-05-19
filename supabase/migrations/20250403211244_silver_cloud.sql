/*
  # Create Learning Goals Table

  1. New Tables
    - `learning_goals` - For tracking user learning goals
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `author` (text)
      - `cover_url` (text)
      - `book_id` (uuid, optional reference to books)
      - `status` (text, enum: 'not_started', 'in_progress', 'completed')
      - `target_completion_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for users to manage their own learning goals
*/

-- Create learning_goals table
CREATE TABLE IF NOT EXISTS learning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  cover_url text,
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  target_completion_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own learning goals"
  ON learning_goals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX learning_goals_user_id_idx ON learning_goals(user_id);

-- Create function to get user's learning goals
CREATE OR REPLACE FUNCTION get_learning_goals(user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  cover_url text,
  book_id uuid,
  status text,
  target_completion_date date,
  created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    lg.id,
    lg.title,
    lg.author,
    lg.cover_url,
    lg.book_id,
    lg.status,
    lg.target_completion_date,
    lg.created_at
  FROM learning_goals lg
  WHERE lg.user_id = get_learning_goals.user_id
  ORDER BY 
    CASE 
      WHEN lg.status = 'not_started' THEN 1
      WHEN lg.status = 'in_progress' THEN 2
      WHEN lg.status = 'completed' THEN 3
    END,
    lg.created_at DESC;
END;
$$;