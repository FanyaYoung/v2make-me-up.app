-- Create premium account for fanya.uxd@gmail.com
-- First, check if user already exists, if not create the user
DO $$
DECLARE
    user_exists boolean;
    user_uuid uuid;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'fanya.uxd@gmail.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create user in auth.users table
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'fanya.uxd@gmail.com',
            crypt('testtest', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO user_uuid;
        
        -- Create profile for the user
        INSERT INTO public.profiles (id, email, first_name, last_name)
        VALUES (user_uuid, 'fanya.uxd@gmail.com', 'Fanya', 'UXD');
    ELSE
        -- Get existing user ID
        SELECT id FROM auth.users WHERE email = 'fanya.uxd@gmail.com' INTO user_uuid;
    END IF;
    
    -- Create or update subscriber record for premium access
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
    )
    ON CONFLICT (user_id) DO UPDATE SET
        subscribed = true,
        subscription_tier = 'yearly',
        subscription_end = NOW() + INTERVAL '1 year',
        updated_at = NOW();
        
END $$;