/*
  # Audio Content Tables

  1. New Tables
    - `audiobooks`
      - Basic audiobook information (title, description, cover, price, etc.)
      - References author profile
    - `audiobook_chapters`
      - Individual chapters with audio files
      - References parent audiobook
    - `podcast_episodes`
      - Individual podcast episodes
      - References author profile

  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
    - Authors can manage their own content
    - Published content viewable by everyone

  3. Triggers
    - Add updated_at triggers for all tables
*/

-- Create audiobooks table
CREATE TABLE IF NOT EXISTS audiobooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_url text,
  price numeric DEFAULT 0,
  narrator text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audiobook chapters table
CREATE TABLE IF NOT EXISTS audiobook_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id uuid REFERENCES audiobooks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  audio_url text NOT NULL,
  duration text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create podcast episodes table
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_url text,
  audio_url text NOT NULL,
  duration text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiobook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for audiobooks
CREATE POLICY "Creators can insert their own audiobooks"
  ON audiobooks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Creators can update their own audiobooks"
  ON audiobooks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Creators can delete their own audiobooks"
  ON audiobooks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Published audiobooks are viewable by everyone"
  ON audiobooks
  FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Create policies for audiobook chapters
CREATE POLICY "Creators can manage chapters of their own audiobooks"
  ON audiobook_chapters
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM audiobooks
    WHERE audiobooks.id = audiobook_id
    AND audiobooks.author_id = auth.uid()
  ));

CREATE POLICY "Users can view chapters of published audiobooks"
  ON audiobook_chapters
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM audiobooks
    WHERE audiobooks.id = audiobook_id
    AND (audiobooks.status = 'published' OR audiobooks.author_id = auth.uid())
  ));

-- Create policies for podcast episodes
CREATE POLICY "Creators can insert their own episodes"
  ON podcast_episodes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Creators can update their own episodes"
  ON podcast_episodes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Creators can delete their own episodes"
  ON podcast_episodes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Published episodes are viewable by everyone"
  ON podcast_episodes
  FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Create updated_at triggers
CREATE TRIGGER update_audiobooks_updated_at
  BEFORE UPDATE ON audiobooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audiobook_chapters_updated_at
  BEFORE UPDATE ON audiobook_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_podcast_episodes_updated_at
  BEFORE UPDATE ON podcast_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();