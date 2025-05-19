/*
  # Fix Missing Profile Migration

  1. New Functions
    - create_missing_profile: Creates a profile for a user if it doesn't exist
    - ensure_profile_exists: Trigger function to ensure profile creation on user signup
    - fix_missing_profiles: Fixes existing users without profiles

  2. Changes
    - Adds new trigger for profile creation
    - Runs fix for existing users
*/

-- Function to create missing profile
CREATE OR REPLACE FUNCTION create_missing_profile(
  user_id uuid,
  username text,
  role text DEFAULT 'consumer'
)
RETURNS void 
LANGUAGE plpgsql SECURITY DEFINER 
AS $func$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RETURN;
  END IF;

  -- Insert new profile
  INSERT INTO profiles (
    id,
    username,
    role,
    created_at
  )
  VALUES (
    user_id,
    username,
    role,
    now()
  );
END
$func$;

-- Function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS trigger 
LANGUAGE plpgsql SECURITY DEFINER 
AS $func$
BEGIN
  -- Try to create profile if it doesn't exist
  INSERT INTO profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END
$func$;

-- Create trigger to ensure profile exists
DROP TRIGGER IF EXISTS ensure_profile_exists_trigger ON auth.users;
CREATE TRIGGER ensure_profile_exists_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_exists();

-- Create function to fix existing users without profiles
CREATE OR REPLACE FUNCTION fix_missing_profiles()
RETURNS void 
LANGUAGE plpgsql SECURITY DEFINER 
AS $func$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT 
      au.id,
      COALESCE(au.raw_user_meta_data->>'username', au.email) as username,
      COALESCE(au.raw_user_meta_data->>'role', 'consumer') as role
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    PERFORM create_missing_profile(
      user_record.id,
      user_record.username,
      user_record.role
    );
  END LOOP;
END
$func$;

-- Run fix for existing users
SELECT fix_missing_profiles();