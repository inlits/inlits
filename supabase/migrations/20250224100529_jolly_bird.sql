-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username text;
  user_role text;
BEGIN
  -- Get username and role from metadata, with fallbacks
  username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'consumer'
  );

  -- Ensure username is unique by appending numbers if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE profiles.username = username) LOOP
    username := username || floor(random() * 1000)::text;
  END LOOP;

  -- Create profile with retry logic
  BEGIN
    INSERT INTO public.profiles (
      id,
      username,
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      username,
      user_role,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    -- If we hit a race condition, try one more time with a random suffix
    username := username || floor(random() * 1000)::text;
    INSERT INTO public.profiles (
      id,
      username,
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      username,
      user_role,
      NOW(),
      NOW()
    );
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);