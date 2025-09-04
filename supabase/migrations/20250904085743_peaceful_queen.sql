/*
  # Add dual profile system

  1. Schema Changes
    - Add `consumer_profile` and `creator_profile` columns to profiles table
    - Add `active_profile_type` to track which profile is currently active
    - Update existing data to maintain compatibility

  2. New Features
    - Support for dual profiles (consumer and creator)
    - Profile switching functionality
    - Separate profile data for each role

  3. Data Migration
    - Migrate existing profiles to new structure
    - Set default active profile based on current role
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add consumer_profile column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consumer_profile'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consumer_profile JSONB DEFAULT '{
      "bio": null,
      "avatar_url": null,
      "cover_url": null,
      "reading_preferences": [],
      "expertise": [],
      "social_links": {}
    }'::jsonb;
  END IF;

  -- Add creator_profile column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'creator_profile'
  ) THEN
    ALTER TABLE profiles ADD COLUMN creator_profile JSONB DEFAULT '{
      "bio": null,
      "avatar_url": null,
      "cover_url": null,
      "expertise": [],
      "social_links": {}
    }'::jsonb;
  END IF;

  -- Add active_profile_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'active_profile_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active_profile_type TEXT DEFAULT 'consumer';
  END IF;

  -- Add can_create_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'can_create_content'
  ) THEN
    ALTER TABLE profiles ADD COLUMN can_create_content BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Migrate existing profile data to new structure
UPDATE profiles SET
  consumer_profile = jsonb_build_object(
    'bio', COALESCE(bio, ''),
    'avatar_url', avatar_url,
    'cover_url', cover_url,
    'reading_preferences', COALESCE(reading_preferences, '[]'::jsonb),
    'expertise', COALESCE(expertise, '[]'::jsonb),
    'social_links', COALESCE(social_links, '{}'::jsonb)
  ),
  creator_profile = jsonb_build_object(
    'bio', COALESCE(bio, ''),
    'avatar_url', avatar_url,
    'cover_url', cover_url,
    'expertise', COALESCE(expertise, '[]'::jsonb),
    'social_links', COALESCE(social_links, '{}'::jsonb)
  ),
  active_profile_type = CASE 
    WHEN role = 'creator' THEN 'creator'
    ELSE 'consumer'
  END,
  can_create_content = CASE 
    WHEN role = 'creator' THEN true
    ELSE false
  END
WHERE consumer_profile IS NULL OR creator_profile IS NULL;

-- Add constraint for active_profile_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_active_profile_type_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_active_profile_type_check 
    CHECK (active_profile_type IN ('consumer', 'creator'));
  END IF;
END $$;

-- Create function to switch profile type
CREATE OR REPLACE FUNCTION switch_profile_type(
  p_user_id UUID,
  p_new_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Validate input
  IF p_new_type NOT IN ('consumer', 'creator') THEN
    RAISE EXCEPTION 'Invalid profile type. Must be consumer or creator.';
  END IF;

  -- Check if user can switch to creator (must have can_create_content = true)
  IF p_new_type = 'creator' THEN
    SELECT can_create_content INTO v_profile
    FROM profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Profile not found.';
    END IF;
    
    IF NOT v_profile.can_create_content THEN
      RAISE EXCEPTION 'User does not have creator permissions.';
    END IF;
  END IF;

  -- Update active profile type
  UPDATE profiles 
  SET 
    active_profile_type = p_new_type,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return updated profile data
  SELECT 
    id,
    username,
    name,
    role,
    active_profile_type,
    can_create_content,
    CASE 
      WHEN p_new_type = 'consumer' THEN consumer_profile
      ELSE creator_profile
    END as active_profile_data,
    consumer_profile,
    creator_profile,
    verified,
    created_at,
    updated_at
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  RETURN row_to_json(v_profile);
END;
$$;

-- Create function to enable creator mode for existing users
CREATE OR REPLACE FUNCTION enable_creator_mode(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable creator capabilities
  UPDATE profiles 
  SET 
    can_create_content = true,
    role = 'creator',
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;