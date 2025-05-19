/*
  # Add Series Table and Article Series Relationship

  1. New Tables
    - `series` - For organizing articles into series
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `author_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `series_id` to articles table
    
  3. Security
    - Enable RLS on series table
    - Add policies for series management
*/

-- Create series table
CREATE TABLE IF NOT EXISTS series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add series_id to articles
ALTER TABLE articles ADD COLUMN series_id uuid REFERENCES series(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

-- Create policies for series
CREATE POLICY "Creators can insert their own series"
  ON series
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Creators can update their own series"
  ON series
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Creators can delete their own series"
  ON series
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Series are viewable by everyone"
  ON series
  FOR SELECT
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_series_updated_at
  BEFORE UPDATE ON series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();