-- Check if tables already exist before creating them
DO $$ 
BEGIN
  -- Check if custom_shelves table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'custom_shelves'
  ) THEN
    -- Create custom_shelves table
    CREATE TABLE custom_shelves (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name text NOT NULL,
      description text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE custom_shelves ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY "Users can manage their own shelves"
      ON custom_shelves
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
      
    -- Create index
    CREATE INDEX custom_shelves_user_idx ON custom_shelves(user_id);
  END IF;

  -- Check if shelf_items table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'shelf_items'
  ) THEN
    -- Create shelf_items table
    CREATE TABLE shelf_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      shelf_id uuid REFERENCES custom_shelves(id) ON DELETE CASCADE NOT NULL,
      content_id uuid NOT NULL,
      content_type text NOT NULL CHECK (content_type IN ('article', 'book', 'audiobook', 'podcast')),
      added_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE shelf_items ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
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
      
    -- Create index
    CREATE INDEX shelf_items_shelf_idx ON shelf_items(shelf_id);
  END IF;
END $$;