import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SkinToneReference {
  id: string;
  hex_color: string;
  name: string;
  undertone: 'warm' | 'cool' | 'neutral' | 'olive';
  depth: 'fair' | 'light' | 'medium' | 'deep' | 'very-deep';
  category: string;
  source: string;
}

export const useSkinToneReferences = () => {
  const [skinToneReferences, setSkinToneReferences] = useState<SkinToneReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkinToneReferences = async () => {
      try {
        const { data, error } = await supabase
          .from('skin_tone_references')
          .select('*')
          .order('depth, undertone');

        if (error) throw error;
        
        setSkinToneReferences((data || []) as SkinToneReference[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch skin tone references');
      } finally {
        setLoading(false);
      }
    };

    fetchSkinToneReferences();
  }, []);

  const skinToneByCategory = {
    fair: skinToneReferences.filter(tone => tone.depth === 'fair'),
    light: skinToneReferences.filter(tone => tone.depth === 'light'),
    medium: skinToneReferences.filter(tone => tone.depth === 'medium'),
    deep: skinToneReferences.filter(tone => tone.depth === 'deep'),
    'very-deep': skinToneReferences.filter(tone => tone.depth === 'very-deep')
  };

  const skinToneByUndertone = {
    warm: skinToneReferences.filter(tone => tone.undertone === 'warm'),
    cool: skinToneReferences.filter(tone => tone.undertone === 'cool'),
    neutral: skinToneReferences.filter(tone => tone.undertone === 'neutral'),
    olive: skinToneReferences.filter(tone => tone.undertone === 'olive')
  };

  return {
    skinToneReferences,
    skinToneByCategory,
    skinToneByUndertone,
    loading,
    error
  };
};

// Utility function to find the closest skin tone reference
export const findClosestSkinTone = (targetHex: string, references: SkinToneReference[]): SkinToneReference => {
  if (references.length === 0) {
    // Return a default reference if no references are available
    return {
      id: 'default',
      hex_color: targetHex,
      name: 'Custom',
      undertone: 'neutral',
      depth: 'medium',
      category: 'medium',
      source: 'user'
    };
  }

  const targetRgb = hexToRgb(targetHex);
  let closestTone = references[0];
  let minDistance = Infinity;

  references.forEach(tone => {
    const toneRgb = hexToRgb(tone.hex_color);
    const distance = calculateColorDistance(targetRgb, toneRgb);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestTone = tone;
    }
  });

  return closestTone;
};

// Helper function to convert hex to RGB
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
};

// Helper function to calculate color distance
export const calculateColorDistance = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number => {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
};