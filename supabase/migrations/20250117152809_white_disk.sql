/*
  # Create profiles table and setup auth handling

  1. New Tables
    - `profiles`
      - `id` (uuid, matches auth.users.id)
      - `username` (text, unique)
      - `role` (text, either 'creator' or 'consumer')
      - `updated_at` (timestamp)
      - `name` (text)
      - `avatar_url` (text)
      - `bio` (text)
      - `expertise` (text array, for creators)
      - `reading_preferences` (text array, for consumers)

  2. Security
    - Enable RLS
    - Add policies for profile access
    - Create trigger to create profile on signup
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL CHECK (char_length(username) >= 3),
  role text NOT NULL CHECK (role IN ('creator', 'consumer')),
  name text,
  avatar_url text,
  bio text,
  expertise text[],
  reading_preferences text[],
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_]+$')
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();