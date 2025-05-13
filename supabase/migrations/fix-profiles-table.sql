-- Check if the profiles table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment to the table
COMMENT ON TABLE public.profiles IS 'User profile information';

-- Add any missing columns (these will be ignored if the columns already exist)
DO $$
BEGIN
  -- Add email column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  -- Add display_name column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'display_name') THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;

  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;

  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;

-- Create read policy (anyone can view profiles)
CREATE POLICY "Allow authenticated users to read profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual delete access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert access" ON public.profiles;

-- Create update policy (users can only update their own profile)
CREATE POLICY "Allow individual update access" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Create delete policy (users can only delete their own profile)
CREATE POLICY "Allow individual delete access" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = id);

-- Create insert policy (authenticated users can create profiles)
CREATE POLICY "Allow individual insert access" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create more reliable trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name TEXT;
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

  -- Insert the new profile with error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      avatar_url,
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      display_name,
      NEW.raw_user_meta_data->>'avatar_url',
      'user',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();
  EXCEPTION
    WHEN others THEN
      -- Log error but continue
      RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile with error handling
  BEGIN
    UPDATE public.profiles
    SET
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  EXCEPTION
    WHEN others THEN
      -- Log error but continue
      RAISE WARNING 'Error updating profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Create a direct signup function that's more reliable
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  display_name TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  new_user_id UUID;
  result JSONB;
BEGIN
  -- Check if user already exists
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = user_email
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User with this email already exists'
    );
  END IF;

  -- Set default display name if not provided
  IF display_name IS NULL OR display_name = '' THEN
    display_name := split_part(user_email, '@', 1);
  END IF;

  -- Create the user in auth.users
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'name', display_name,
        'avatar_url', avatar_url
      ),
      NOW(),
      NOW(),
      'authenticated'
    )
    RETURNING id INTO new_user_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'User with this email already exists'
      );
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Database error creating user: ' || SQLERRM
      );
  END;

  -- Create the profile directly (don't rely on trigger)
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      avatar_url,
      role,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      user_email,
      display_name,
      avatar_url,
      'user',
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update it
      UPDATE public.profiles
      SET
        email = user_email,
        display_name = display_name,
        avatar_url = COALESCE(avatar_url, profiles.avatar_url),
        updated_at = NOW()
      WHERE id = new_user_id;
    WHEN OTHERS THEN
      -- Log the error but continue
      RAISE WARNING 'Error creating profile for user %: %', new_user_id, SQLERRM;
  END;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'display_name', display_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.create_user_with_profile(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
