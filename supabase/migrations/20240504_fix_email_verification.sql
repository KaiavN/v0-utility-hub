-- This migration fixes issues with email verification and user creation
-- Wrapped in a transaction to ensure all changes are applied atomically
BEGIN;

-- 1. Check and fix any broken triggers on auth.users table
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  -- Check if triggers exist before attempting to drop them
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_updated' 
    AND tgrelid = 'auth.users'::regclass
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
  END IF;
  
  -- Check if functions exist before attempting to replace them
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    -- Recreate the handle_new_user function with better error handling
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Add extensive error handling
      BEGIN
        -- Only insert if email is not null to prevent constraint violations
        IF NEW.email IS NOT NULL THEN
          INSERT INTO public.profiles (id, email, display_name, created_at)
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(
              NEW.raw_user_meta_data->>'display_name', 
              NEW.raw_user_meta_data->>'full_name',
              split_part(NEW.email, '@', 1)
            ),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            updated_at = NOW();
        END IF;
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the transaction
          RAISE WARNING 'Error in handle_new_user trigger: %, Detail: %', SQLERRM, SQLSTATE;
          RETURN NEW;
      END;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  ELSE
    -- Create the function if it doesn't exist
    CREATE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Add extensive error handling
      BEGIN
        -- Only insert if email is not null to prevent constraint violations
        IF NEW.email IS NOT NULL THEN
          INSERT INTO public.profiles (id, email, display_name, created_at)
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(
              NEW.raw_user_meta_data->>'display_name', 
              NEW.raw_user_meta_data->>'full_name',
              split_part(NEW.email, '@', 1)
            ),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            updated_at = NOW();
        END IF;
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the transaction
          RAISE WARNING 'Error in handle_new_user trigger: %, Detail: %', SQLERRM, SQLSTATE;
          RETURN NEW;
      END;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
  
  -- Recreate the trigger with a more reliable approach
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
    
  -- Create a safer user update function
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_user_update') THEN
    CREATE OR REPLACE FUNCTION public.handle_user_update()
    RETURNS TRIGGER AS $$
    BEGIN
      BEGIN
        -- Only update if the email has changed and is not null
        IF NEW.email IS NOT NULL AND (OLD.email IS NULL OR NEW.email <> OLD.email) THEN
          UPDATE public.profiles
          SET 
            email = NEW.email,
            updated_at = NOW()
          WHERE id = NEW.id;
        END IF;
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the transaction
          RAISE WARNING 'Error in handle_user_update trigger: %, Detail: %', SQLERRM, SQLSTATE;
          RETURN NEW;
      END;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  ELSE
    CREATE FUNCTION public.handle_user_update()
    RETURNS TRIGGER AS $$
    BEGIN
      BEGIN
        -- Only update if the email has changed and is not null
        IF NEW.email IS NOT NULL AND (OLD.email IS NULL OR NEW.email <> OLD.email) THEN
          UPDATE public.profiles
          SET 
            email = NEW.email,
            updated_at = NOW()
          WHERE id = NEW.id;
        END IF;
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the transaction
          RAISE WARNING 'Error in handle_user_update trigger: %, Detail: %', SQLERRM, SQLSTATE;
          RETURN NEW;
      END;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
  
  -- Recreate the update trigger
  CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_user_update();
END
$$;

-- 2. Create a safe email check function that won't fail
-- First drop if exists to avoid errors
DROP FUNCTION IF EXISTS auth.safe_check_email_exists(TEXT);

CREATE FUNCTION auth.safe_check_email_exists(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate input to prevent SQL injection
  IF check_email IS NULL OR check_email = '' THEN
    RETURN FALSE;
  END IF;

  -- Normalize email for case-insensitive comparison
  RETURN EXISTS(
    SELECT 1 FROM auth.users 
    WHERE LOWER(email) = LOWER(check_email)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in safe_check_email_exists: %, Detail: %', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth.safe_check_email_exists(TEXT) TO authenticated, anon, service_role;

-- 3. Ensure RLS doesn't block the email verification process
-- Check if RLS is enabled before attempting to disable
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::regclass INTO rls_enabled;
  
  IF rls_enabled THEN
    -- Temporarily disable RLS on profiles table for service_role
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY FOR service_role;
    
    -- Create or replace the RLS policy for authenticated users
    DROP POLICY IF EXISTS profiles_policy ON public.profiles;
    
    CREATE POLICY profiles_policy ON public.profiles
      USING (id = auth.uid() OR auth.role() = 'service_role')
      WITH CHECK (id = auth.uid() OR auth.role() = 'service_role');
  END IF;
END
$$;

-- 4. Create a more reliable signup function that bypasses potential issues
DROP FUNCTION IF EXISTS auth.reliable_signup(TEXT, TEXT, JSONB);

CREATE FUNCTION auth.reliable_signup(
  user_email TEXT,
  user_password TEXT,
  user_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  new_user_id UUID;
  result JSONB;
  instance_id UUID;
  email_normalized TEXT;
BEGIN
  -- Input validation
  IF user_email IS NULL OR user_email = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email cannot be empty',
      'code', 'INVALID_EMAIL'
    );
  END IF;
  
  IF user_password IS NULL OR user_password = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Password cannot be empty',
      'code', 'INVALID_PASSWORD'
    );
  END IF;
  
  -- Normalize email for case-insensitive comparison
  email_normalized := LOWER(user_email);
  
  -- Get instance_id safely
  BEGIN
    SELECT id INTO instance_id FROM auth.instances LIMIT 1;
    
    IF instance_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Auth instance not found',
        'code', 'INSTANCE_NOT_FOUND'
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Error accessing auth instance: ' || SQLERRM,
        'code', 'INSTANCE_ERROR'
      );
  END;
  
  -- Check if email exists first using a safe method
  BEGIN
    IF EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = email_normalized) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'User with this email already exists',
        'code', 'EMAIL_EXISTS'
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If the check fails, we'll try to create the user anyway
      RAISE WARNING 'Error checking if email exists: %, Detail: %', SQLERRM, SQLSTATE;
  END;
  
  -- Try to insert the user
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      instance_id,
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      user_metadata,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_user_id;
    
    -- Try to create the profile directly
    BEGIN
      INSERT INTO public.profiles (
        id, 
        email, 
        display_name, 
        created_at
      )
      VALUES (
        new_user_id,
        user_email,
        COALESCE(
          user_metadata->>'display_name', 
          user_metadata->>'full_name',
          split_part(user_email, '@', 1)
        ),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile: %, Detail: %', SQLERRM, SQLSTATE;
    END;
    
    result := jsonb_build_object(
      'success', true,
      'user_id', new_user_id,
      'email', user_email
    );
  EXCEPTION
    WHEN unique_violation THEN
      result := jsonb_build_object(
        'success', false,
        'error', 'User with this email already exists',
        'code', 'EMAIL_EXISTS'
      );
    WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'code', 'UNKNOWN_ERROR'
      );
  END;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth.reliable_signup(TEXT, TEXT, JSONB) TO service_role;

-- 5. Create a function to fix broken profiles
CREATE OR REPLACE FUNCTION public.fix_missing_profiles()
RETURNS TABLE(fixed_count INT, errors TEXT[]) AS $$
DECLARE
  fixed INT := 0;
  error_messages TEXT[] := '{}';
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.profiles (
        id, 
        email, 
        display_name, 
        created_at
      )
      VALUES (
        user_record.id,
        user_record.email,
        COALESCE(
          user_record.raw_user_meta_data->>'display_name', 
          user_record.raw_user_meta_data->>'full_name',
          split_part(user_record.email, '@', 1)
        ),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
      
      fixed := fixed + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_messages := array_append(error_messages, 
          'Error fixing profile for user ' || user_record.id || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN QUERY SELECT fixed, error_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.fix_missing_profiles() TO service_role;

-- 6. Create a function to check and repair database integrity
CREATE OR REPLACE FUNCTION public.check_auth_integrity()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  missing_profiles INT;
  orphaned_profiles INT;
  fixed_count INT;
  errors TEXT[];
BEGIN
  -- Check for users without profiles
  SELECT COUNT(*) INTO missing_profiles
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  -- Check for profiles without users
  SELECT COUNT(*) INTO orphaned_profiles
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  WHERE u.id IS NULL;
  
  -- Fix missing profiles
  IF missing_profiles > 0 THEN
    SELECT f.fixed_count, f.errors 
    INTO fixed_count, errors
    FROM public.fix_missing_profiles() f;
  ELSE
    fixed_count := 0;
    errors := '{}';
  END IF;
  
  result := jsonb_build_object(
    'missing_profiles', missing_profiles,
    'orphaned_profiles', orphaned_profiles,
    'fixed_profiles', fixed_count,
    'errors', errors
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_auth_integrity() TO service_role;

-- 7. Create a function to normalize emails in the database
CREATE OR REPLACE FUNCTION public.normalize_user_emails()
RETURNS TABLE(updated_count INT, errors TEXT[]) AS $$
DECLARE
  updated INT := 0;
  error_messages TEXT[] := '{}';
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email <> LOWER(email)
  LOOP
    BEGIN
      UPDATE auth.users
      SET email = LOWER(email)
      WHERE id = user_record.id;
      
      updated := updated + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_messages := array_append(error_messages, 
          'Error normalizing email for user ' || user_record.id || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN QUERY SELECT updated, error_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.normalize_user_emails() TO service_role;

-- Run integrity check to fix any existing issues
DO $$
DECLARE
  integrity_result JSONB;
BEGIN
  SELECT public.check_auth_integrity() INTO integrity_result;
  RAISE NOTICE 'Auth integrity check result: %', integrity_result;
END
$$;

COMMIT;
