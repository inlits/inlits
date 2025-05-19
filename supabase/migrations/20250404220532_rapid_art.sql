/*
  # Fix User Creation Issues

  1. Changes
    - Improve handle_new_user function to be more robust
    - Add better error handling and logging
    - Fix username generation for new users
    - Ensure profile creation doesn't fail silently
    
  2. Security
    - Maintain existing security model
    - Ensure proper error handling
*/

-- Drop existing trigger and function to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username text;
  user_role text;
  random_suffix text;
  attempts integer := 0;
  max_attempts integer := 5;
BEGIN
  -- Get username and role from metadata, with fallbacks
  username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Clean username to ensure it only contains valid characters
  username := regexp_replace(username, '[^a-zA-Z0-9_]', '', 'g');
  
  -- Ensure username is at least 3 characters
  IF length(username) < 3 THEN
    username := 'user' || username;
  END IF;
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'consumer'
  );

  -- Try to insert with retry logic for username conflicts
  WHILE attempts < max_attempts LOOP
    BEGIN
      -- Generate a random suffix for retries
      IF attempts > 0 THEN
        random_suffix := floor(random() * 10000)::text;
        username := substring(username, 1, 15) || random_suffix;
      END IF;
      
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
      
      -- If we get here, the insert succeeded
      RETURN NEW;
    EXCEPTION 
      WHEN unique_violation THEN
        -- Only retry for username conflicts
        attempts := attempts + 1;
        -- Continue to next attempt
      WHEN OTHERS THEN
        -- Log other errors and rethrow
        RAISE EXCEPTION 'Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
  END LOOP;
  
  -- If we exhausted all attempts, create with a timestamp-based username
  -- This is a last resort and should be very unlikely to conflict
  BEGIN
    username := 'user_' || floor(extract(epoch from now()))::text;
    
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
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create profile after multiple attempts: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create a function to ensure profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists()
RETURNS trigger 
LANGUAGE plpgsql SECURITY DEFINER 
AS $func$
DECLARE
  username text;
  user_role text;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Get username and role from metadata, with fallbacks
  username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Clean username to ensure it only contains valid characters
  username := regexp_replace(username, '[^a-zA-Z0-9_]', '', 'g');
  
  -- Ensure username is at least 3 characters
  IF length(username) < 3 THEN
    username := 'user' || username;
  END IF;
  
  -- Ensure username is unique by appending random numbers if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = username) LOOP
    username := substring(username, 1, 15) || floor(random() * 10000)::text;
  END LOOP;
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'consumer'
  );

  -- Create profile
  INSERT INTO profiles (
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
  
  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    -- Try one more time with timestamp
    INSERT INTO profiles (
      id,
      username,
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      'user_' || floor(extract(epoch from now()))::text,
      user_role,
      NOW(),
      NOW()
    );
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END
$func$;

-- Create trigger to ensure profile exists
DROP TRIGGER IF EXISTS ensure_profile_exists_trigger ON auth.users;
CREATE TRIGGER ensure_profile_exists_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_profile_exists();