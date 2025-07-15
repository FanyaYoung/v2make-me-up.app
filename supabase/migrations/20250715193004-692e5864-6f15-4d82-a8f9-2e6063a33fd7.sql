-- Clean up the manually created user and create properly
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Get the user ID if it exists
    SELECT id FROM auth.users WHERE email = 'fanya.uxd@gmail.com' INTO user_uuid;
    
    -- Clean up existing records
    IF user_uuid IS NOT NULL THEN
        DELETE FROM public.subscribers WHERE user_id = user_uuid;
        DELETE FROM public.profiles WHERE id = user_uuid;
        DELETE FROM auth.users WHERE id = user_uuid;
    END IF;
    
    -- Create new user using proper Supabase auth method
    -- We'll insert the user with email_confirmed_at set to allow immediate login
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        is_sso_user,
        deleted_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'fanya.uxd@gmail.com',
        '$2a$10$7KWj7kK.9N6x6pLW2QKQVeYm6QN6yy6JYg1OvYrP7rqO8HzY8zI1C', -- bcrypt hash for 'testtest'
        NOW(), -- Email confirmed immediately
        NOW(),
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"email": "fanya.uxd@gmail.com"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        false,
        NULL
    ) RETURNING id INTO user_uuid;
    
    -- Create profile
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (user_uuid, 'fanya.uxd@gmail.com', 'Fanya', 'UXD');
    
    -- Create premium subscriber record
    INSERT INTO public.subscribers (
        user_id,
        email,
        subscribed,
        subscription_tier,
        stripe_customer_id,
        subscription_end,
        created_at,
        updated_at
    ) VALUES (
        user_uuid,
        'fanya.uxd@gmail.com',
        true,
        'yearly',
        'cus_premium_' || substr(user_uuid::text, 1, 8),
        NOW() + INTERVAL '1 year',
        NOW(),
        NOW()
    );
    
END $$;