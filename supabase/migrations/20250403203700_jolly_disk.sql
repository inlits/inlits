-- Create custom_shelves table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'custom_shelves'
  ) THEN
    CREATE TABLE custom_shelves (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name text NOT NULL,
      description text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create shelf_items table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'shelf_items'
  ) THEN
    CREATE TABLE shelf_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      shelf_id uuid REFERENCES custom_shelves(id) ON DELETE CASCADE NOT NULL,
      content_id uuid NOT NULL,
      content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
      added_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'custom_shelves' 
    AND indexname = 'custom_shelves_user_idx'
  ) THEN
    CREATE INDEX custom_shelves_user_idx ON custom_shelves(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'shelf_items' 
    AND indexname = 'shelf_items_shelf_idx'
  ) THEN
    CREATE INDEX shelf_items_shelf_idx ON shelf_items(shelf_id);
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  -- For custom_shelves
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'custom_shelves' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE custom_shelves ENABLE ROW LEVEL SECURITY;
  END IF;

  -- For shelf_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'shelf_items' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE shelf_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  -- For custom_shelves
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'custom_shelves' 
    AND policyname = 'Users can manage their own shelves'
  ) THEN
    CREATE POLICY "Users can manage their own shelves"
      ON custom_shelves
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- For shelf_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shelf_items' 
    AND policyname = 'Users can manage items in their own shelves'
  ) THEN
    CREATE POLICY "Users can manage items in their own shelves"
      ON shelf_items
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM custom_shelves
        WHERE id = shelf_id
        AND user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM custom_shelves
        WHERE id = shelf_id
        AND user_id = auth.uid()
      ));
  END IF;
END $$;