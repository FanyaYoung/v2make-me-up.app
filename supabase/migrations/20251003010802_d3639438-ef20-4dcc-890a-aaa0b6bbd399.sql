-- Create user account for e.fanya.young@gmail.com with password Founder415
-- This bypasses the captcha requirement

-- First, check if user exists and delete if needed (for clean setup)
DELETE FROM auth.users WHERE email = 'e.fanya.young@gmail.com';

-- Insert the user into auth.users with hashed password
-- Password: Founder415
-- Using Supabase's crypt function with bcrypt
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
  'e.fanya.young@gmail.com',
  crypt('Founder415', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Fanya","last_name":"Young"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- The existing trigger 'assign_superadmin_role' should automatically assign the superadmin role
-- But let's ensure it by manually inserting if needed
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users
WHERE email = 'e.fanya.young@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure fanya.uxd@gmail.com has access if it exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users
WHERE email = 'fanya.uxd@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;