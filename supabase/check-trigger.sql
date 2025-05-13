-- Check if the trigger function exists
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM 
  information_schema.routines 
WHERE 
  routine_name = 'handle_new_user' 
  AND routine_schema = 'public';

-- Check if the trigger is properly attached to the auth.users table
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM 
  information_schema.triggers 
WHERE 
  event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- Let's also check the function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
