/*
  # Fix profiles table RLS policy

  1. Security Updates
    - Drop existing INSERT policy that uses incorrect uid() function
    - Create new INSERT policy using correct auth.uid() function
    - Ensure policy allows users to insert their own profile during registration

  2. Changes
    - Replace uid() with auth.uid() in INSERT policy
    - Maintain existing UPDATE and SELECT policies
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create new INSERT policy with correct auth.uid() function
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also update other policies to use auth.uid() for consistency
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);