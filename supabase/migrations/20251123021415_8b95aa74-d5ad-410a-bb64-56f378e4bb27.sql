-- Ensure triggers exist for OAuth user creation
-- This handles automatic profile creation and superadmin role assignment

-- Drop existing triggers if they exist to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_superadmin ON auth.users;

-- Create trigger to automatically create profile for new OAuth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to automatically assign superadmin role for specific emails
CREATE TRIGGER on_auth_user_created_superadmin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_superadmin_role();

-- Ensure all new OAuth users get a default 'user' role if not superadmin
CREATE OR REPLACE FUNCTION public.ensure_default_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only add default role if user doesn't already have any role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for default role assignment (runs after superadmin check)
DROP TRIGGER IF EXISTS on_auth_user_default_role ON auth.users;
CREATE TRIGGER on_auth_user_default_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_default_user_role();