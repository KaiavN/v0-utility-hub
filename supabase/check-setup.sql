-- Check if the auth.users table exists and has records
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'auth' AND table_name = 'users'
) AS auth_users_exists;

-- Count users in auth.users
SELECT COUNT(*) AS user_count FROM auth.users;

-- Check if the profiles table exists and has records
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'profiles'
) AS profiles_exists;

-- Count profiles
SELECT COUNT(*) AS profile_count FROM public.profiles;

-- Check if the trigger exists
SELECT EXISTS (
  SELECT FROM pg_trigger
  WHERE tgname = 'on_auth_user_created'
) AS trigger_exists;

-- Check RLS policies on profiles table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
