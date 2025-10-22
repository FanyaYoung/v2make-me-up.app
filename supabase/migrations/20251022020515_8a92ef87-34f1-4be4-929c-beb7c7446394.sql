-- Add zip_code to profiles table for location-based pricing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS zip_code text;

-- Add index for zip code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_zip_code 
ON public.profiles(zip_code);

COMMENT ON COLUMN public.profiles.zip_code IS 'User zip code for location-based product pricing and availability';