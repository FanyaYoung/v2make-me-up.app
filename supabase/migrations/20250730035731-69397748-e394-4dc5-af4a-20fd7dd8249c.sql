-- Create skin tone references table
CREATE TABLE public.skin_tone_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hex_color TEXT NOT NULL,
  name TEXT NOT NULL,
  undertone TEXT NOT NULL CHECK (undertone IN ('warm', 'cool', 'neutral', 'olive')),
  depth TEXT NOT NULL CHECK (depth IN ('fair', 'light', 'medium', 'deep', 'very-deep')),
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.skin_tone_references ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (no authentication required)
CREATE POLICY "allow_public_read" ON public.skin_tone_references
FOR SELECT
TO public
USING (true);

-- Create policy for authenticated inserts/updates (for admin purposes)
CREATE POLICY "allow_authenticated_write" ON public.skin_tone_references
FOR ALL
TO authenticated
USING (true);

-- Insert the existing skin tone reference data
INSERT INTO public.skin_tone_references (hex_color, name, undertone, depth, category, source) VALUES
-- Fair Tones
('#FED48D', 'Light Peach Rose', 'warm', 'fair', 'fair', 'palette_1'),
('#F9D6BE', 'Fair Warm', 'warm', 'fair', 'fair', 'palette_1'),
('#FAD6BD', 'Fair Neutral', 'neutral', 'fair', 'fair', 'palette_1'),
('#FCD6BE', 'Fair Cool', 'cool', 'fair', 'fair', 'palette_1'),
('#F5D5B8', 'Fair Olive', 'olive', 'fair', 'fair', 'palette_1'),
-- Light Tones
('#F3C9A2', 'Light Warm', 'warm', 'light', 'light', 'palette_1'),
('#F1CAA4', 'Light Neutral', 'neutral', 'light', 'light', 'palette_1'),
('#F0C8A1', 'Light Cool', 'cool', 'light', 'light', 'palette_1'),
('#EFC89F', 'Light Olive', 'olive', 'light', 'light', 'palette_1'),
('#E8C29B', 'Light Medium Warm', 'warm', 'light', 'light', 'palette_1'),
-- Medium Tones
('#E2B794', 'Medium Light', 'warm', 'medium', 'medium', 'palette_1'),
('#DFB491', 'Medium Neutral', 'neutral', 'medium', 'medium', 'palette_1'),
('#DCB18E', 'Medium Cool', 'cool', 'medium', 'medium', 'palette_1'),
('#D9AE8B', 'Medium Olive', 'olive', 'medium', 'medium', 'palette_1'),
('#D4A884', 'Medium Warm', 'warm', 'medium', 'medium', 'palette_1'),
('#CFA37D', 'Medium Deep Neutral', 'neutral', 'medium', 'medium', 'palette_1'),
('#CA9D76', 'Medium Deep Cool', 'cool', 'medium', 'medium', 'palette_1'),
('#C5986F', 'Medium Deep Olive', 'olive', 'medium', 'medium', 'palette_1'),
-- Deep Tones
('#C19268', 'Deep Light', 'warm', 'deep', 'deep', 'palette_1'),
('#BC8D61', 'Deep Neutral', 'neutral', 'deep', 'deep', 'palette_1'),
('#B7875A', 'Deep Cool', 'cool', 'deep', 'deep', 'palette_1'),
('#B28253', 'Deep Olive', 'olive', 'deep', 'deep', 'palette_1'),
('#AD7C4C', 'Deep Warm', 'warm', 'deep', 'deep', 'palette_1'),
('#A87645', 'Deep Medium', 'neutral', 'deep', 'deep', 'palette_1'),
('#A3713E', 'Deep Medium Cool', 'cool', 'deep', 'deep', 'palette_1'),
('#9E6B37', 'Deep Medium Olive', 'olive', 'deep', 'deep', 'palette_1'),
-- Very Deep Tones
('#996530', 'Very Deep Light', 'warm', 'very-deep', 'very_deep', 'palette_1'),
('#946029', 'Very Deep Neutral', 'neutral', 'very-deep', 'very_deep', 'palette_1'),
('#8F5A22', 'Very Deep Cool', 'cool', 'very-deep', 'very_deep', 'palette_1'),
('#8A541B', 'Very Deep Olive', 'olive', 'very-deep', 'very_deep', 'palette_1'),
('#854F14', 'Very Deep Warm', 'warm', 'very-deep', 'very_deep', 'palette_1'),
('#80490D', 'Very Deep 1', 'neutral', 'very-deep', 'very_deep', 'palette_1'),
('#7D4921', 'Very Deep 2', 'warm', 'very-deep', 'very_deep', 'palette_1');

-- Create an index for faster queries
CREATE INDEX idx_skin_tone_references_undertone ON public.skin_tone_references(undertone);
CREATE INDEX idx_skin_tone_references_depth ON public.skin_tone_references(depth);
CREATE INDEX idx_skin_tone_references_category ON public.skin_tone_references(category);