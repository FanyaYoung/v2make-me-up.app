-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'premium', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY 
     CASE role 
       WHEN 'superadmin' THEN 1
       WHEN 'admin' THEN 2  
       WHEN 'premium' THEN 3
       WHEN 'user' THEN 4
     END LIMIT 1),
    'user'::app_role
  )
$$;

-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'superadmin'::app_role)
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "SuperAdmins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_superadmin());

-- Trigger to auto-assign SuperAdmin role for specific emails
CREATE OR REPLACE FUNCTION public.assign_superadmin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user's email is in the superadmin list
  IF NEW.email IN ('fanya.uxd@gmail.com', 'e.fanya.young@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'superadmin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-assignment
CREATE TRIGGER assign_superadmin_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_superadmin_role();

-- Insert SuperAdmin roles for existing users with those emails (if they exist)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users
WHERE email IN ('fanya.uxd@gmail.com', 'e.fanya.young@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;