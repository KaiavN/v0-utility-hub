-- Create a more reliable signup function that handles database errors
CREATE OR REPLACE FUNCTION public.reliable_signup(
  user_email TEXT,
  user_password TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS jsonb AS $$
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
      'code', 'EMAIL_EXISTS',
      'message', 'User with this email already exists'
    );
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
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change_token_current,
      aud,
      role
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      user_metadata,
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO new_user_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'EMAIL_EXISTS',
        'message', 'User with this email already exists'
      );
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'DATABASE_ERROR',
        'message', 'Database error creating user: ' || SQLERRM
      );
  END;

  -- Create the profile
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
        (user_metadata->>'display_name')::text,
        split_part(user_email, '@', 1)
      ),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, which is fine
      NULL;
    WHEN OTHERS THEN
      -- Log the error but continue
      RAISE WARNING 'Error creating profile for user %: %', new_user_id, SQLERRM;
  END;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.reliable_signup TO authenticated, anon;
