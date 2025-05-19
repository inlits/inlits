/*
  # Fix Bookmarks RLS Policy

  1. Changes
    - Drop existing RLS policy for bookmarks table
    - Create new RLS policy that properly allows authenticated users to manage their bookmarks
    
  2. Security
    - Ensure users can only access their own bookmarks
    - Allow authenticated users to insert, select, update, and delete their own bookmarks
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON bookmarks;

-- Create new policy with proper permissions
CREATE POLICY "Users can manage their own bookmarks"
  ON bookmarks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;