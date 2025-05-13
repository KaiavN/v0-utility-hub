-- Let's check the complete function definition first
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';

-- Now let's fix the trigger function to ensure it works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name TEXT;
  username TEXT;
BEGIN
  -- Extract display name from metadata or email
  display_name := NEW.raw_user_meta_data->>'name';
  IF display_name IS NULL THEN
    display_name := NEW.raw_user_meta_data->>'full_name';
  END IF;
  IF display_name IS NULL AND NEW.email IS NOT NULL THEN
    display_name := split_part(NEW.email, '@', 1);
  END IF;
  IF display_name IS NULL THEN
    display_name := 'User';
  END IF;
  
  -- Generate a username from email or random string
  IF NEW.email IS NOT NULL THEN
    username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    username := 'user_' || substr(md5(random()::text), 1, 10);
  END IF;
  
  -- Make sure username is unique by adding a random suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username) LOOP
    username := username || substr(md5(random()::text), 1, 5);
  END LOOP;

  -- Insert the new profile with detailed error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      username,
      avatar_url,
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      display_name,
      username,
      NEW.raw_user_meta_data->>'avatar_url',
      'user',
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error details but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create a trigger for user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
