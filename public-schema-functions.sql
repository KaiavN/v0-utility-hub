-- Create functions in the public schema as a fallback
-- Run this in the Supabase SQL Editor if you continue to have issues

BEGIN;

-- Create a safe email check function in the public schema
CREATE OR REPLACE FUNCTION public.safe_check_email_exists(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM auth.users WHERE email = check_email);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in safe_check_email_exists: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.safe_check_email_exists(TEXT) TO service_role;

-- Create a function to safely create users in the public schema
CREATE OR REPLACE FUNCTION public.safe_create_user(
  user_email TEXT,
  user_password TEXT,
  user_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  new_user_id UUID;
  result JSONB;
BEGIN
  -- Check if email exists first
  IF EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User with this email already exists',
      'code', 'EMAIL_EXISTS'
    );
  END IF;
  
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
      (SELECT instance_id FROM auth.instances LIMIT 1),
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      user_metadata,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_user_id;
    
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
GRANT EXECUTE ON FUNCTION public.safe_create_user(TEXT, TEXT, JSONB) TO service_role;

COMMIT;
