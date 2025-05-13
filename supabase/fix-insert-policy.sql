-- First, let's drop the existing insert policy that has issues
DROP POLICY IF EXISTS "Allow individual insert access" ON public.profiles;

-- Create a new insert policy that allows authenticated users to insert their own profile
CREATE POLICY "Allow individual insert access" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also create a policy that allows the service role to insert any profile
-- This is important for the trigger function to work properly
DROP POLICY IF EXISTS "Allow service role to insert profiles" ON public.profiles;
CREATE POLICY "Allow service role to insert profiles" 
ON public.profiles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Let's also create a policy that allows new signups to create their profile
DROP POLICY IF EXISTS "Allow new signups to create profile" ON public.profiles;
CREATE POLICY "Allow new signups to create profile" 
ON public.profiles 
FOR INSERT 
TO anon
WITH CHECK (auth.uid() = id);

-- Let's verify the policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'profiles'
ORDER BY
  policyname;
