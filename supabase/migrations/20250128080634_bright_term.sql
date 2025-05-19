-- Create comments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'comments'
  ) THEN
    CREATE TABLE comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      content_id uuid NOT NULL,
      content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
      parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
      content text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can manage their own comments"
      ON comments
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Anyone can view comments"
      ON comments
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'comments' 
    AND indexname = 'comments_content_idx'
  ) THEN
    CREATE INDEX comments_content_idx ON comments(content_id, content_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'comments' 
    AND indexname = 'comments_parent_idx'
  ) THEN
    CREATE INDEX comments_parent_idx ON comments(parent_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'comments' 
    AND indexname = 'comments_user_idx'
  ) THEN
    CREATE INDEX comments_user_idx ON comments(user_id);
  END IF;
END $$;