-- Update existing user password and ensure premium subscription
DO $$
DECLARE
    user_uuid uuid := 'b0426f39-0b83-404e-ae3e-96e2bc7cdb05';
    subscriber_exists boolean;
BEGIN
    -- Update the user's password with proper bcrypt hash and confirm email
    UPDATE auth.users SET
        encrypted_password = '$2a$10$7KWj7kK.9N6x6pLW2QKQVeYm6QN6yy6JYg1OvYrP7rqO8HzY8zI1C', -- bcrypt hash for 'testtest'
        email_confirmed_at = CASE 
            WHEN email_confirmed_at IS NULL THEN NOW()
            ELSE email_confirmed_at
        END,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Update profile
    UPDATE public.profiles SET
        first_name = 'Fanya',
        last_name = 'UXD',
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Check if subscriber record exists
    SELECT EXISTS(SELECT 1 FROM public.subscribers WHERE user_id = user_uuid) INTO subscriber_exists;
    
    IF NOT subscriber_exists THEN
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
    ELSE
        -- Update existing subscriber to premium
        UPDATE public.subscribers SET
            subscribed = true,
            subscription_tier = 'yearly',
            subscription_end = NOW() + INTERVAL '1 year',
            updated_at = NOW()
        WHERE user_id = user_uuid;
    END IF;
    
END $$;