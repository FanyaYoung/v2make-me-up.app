// Advanced HEX-based shade matching system
// Integrates with the comprehensive shade database and matching engine

import { supabase } from '@/integrations/supabase/client';

export interface ShadeMatch {
  brand: string;
  product_name: string;
  shade_name: string;
  shade_hex: string;
  delta_e_distance: number;
  match_score: number;
  undertone_match: boolean;
}

export interface SkinToneHex {
  hex_color: string;
  lab_l: number;
  lab_a: number;
  lab_b: number;
  undertone: string;
  depth_category: string;
}

export interface HexShadeMatch {
  hex: string;
  brand: string;
  product: string;
  shade: string;
  deltaE76: number;
  undertone: 'Cool' | 'Neutral' | 'Warm' | 'Olive';
  depth: number; // L* value from Lab
  adjustedScore: number; // Final score with undertone penalty
}

export interface SkinHexAnalysis {
  hex: string;
  lab: {
    l: number;
    a: number;
    b: number;
  };
  undertone: 'Cool' | 'Neutral' | 'Warm' | 'Olive';
  depth: number;
}

// Convert HEX to Lab color space for accurate color difference calculations
export function hexToLab(hex: string): { l: number; a: number; b: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Convert RGB to XYZ
  const rLinear = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  const gLinear = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  const bLinear = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Observer = 2°, Illuminant = D65
  const x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
  const y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750;
  const z = rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041;

  // Normalize for D65 illuminant
  const xn = x / 0.95047;
  const yn = y / 1.00000;
  const zn = z / 1.08883;

  // Convert XYZ to Lab
  const fx = xn > 0.008856 ? Math.pow(xn, 1/3) : (7.787 * xn + 16/116);
  const fy = yn > 0.008856 ? Math.pow(yn, 1/3) : (7.787 * yn + 16/116);
  const fz = zn > 0.008856 ? Math.pow(zn, 1/3) : (7.787 * zn + 16/116);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bValue = 200 * (fy - fz);

  return { l, a, b: bValue };
}

// Calculate ΔE76 color difference between two Lab colors
export function calculateDeltaE76(lab1: { l: number; a: number; b: number }, lab2: { l: number; a: number; b: number }): number {
  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

// Classify undertone based on a* and b* values
export function classifyUndertone(a: number, b: number): 'Cool' | 'Neutral' | 'Warm' | 'Olive' {
  // Thresholds for undertone classification
  const aThreshold = 2;
  const bThreshold = 5;
  const oliveThreshold = 3;

  if (a < -aThreshold && Math.abs(b) < oliveThreshold) {
    return 'Olive';
  } else if (a < -aThreshold) {
    return 'Cool';
  } else if (a > aThreshold && b > bThreshold) {
    return 'Warm';
  } else {
    return 'Neutral';
  }
}

// Analyze skin HEX to extract undertone and depth
export function analyzeSkinHex(hex: string): SkinHexAnalysis {
  const lab = hexToLab(hex);
  const undertone = classifyUndertone(lab.a, lab.b);
  
  return {
    hex: hex.toUpperCase(),
    lab,
    undertone,
    depth: lab.l
  };
}

// Calculate undertone compatibility penalty
export function calculateUndertoneCompatibility(userUndertone: string, shadeUndertone: string): number {
  if (userUndertone === shadeUndertone) return 1.0;
  
  // Neutral works well with most undertones
  if (userUndertone === 'Neutral' || shadeUndertone === 'Neutral') return 0.9;
  
  // Cool and Warm are least compatible
  if ((userUndertone === 'Cool' && shadeUndertone === 'Warm') ||
      (userUndertone === 'Warm' && shadeUndertone === 'Cool')) return 0.7;
  
  // Olive has moderate compatibility with others
  return 0.8;
}

// Find best shade matches using ΔE76 and undertone compatibility
export function findHexShadeMatches(
  userHex: string,
  shadeDatabase: Array<{
    hex: string;
    brand: string;
    product: string;
    shade: string;
  }>,
  maxResults: number = 10
): HexShadeMatch[] {
  const userAnalysis = analyzeSkinHex(userHex);
  const matches: HexShadeMatch[] = [];

  for (const shade of shadeDatabase) {
    const shadeAnalysis = analyzeSkinHex(shade.hex);
    const deltaE76 = calculateDeltaE76(userAnalysis.lab, shadeAnalysis.lab);
    const undertoneCompatibility = calculateUndertoneCompatibility(
      userAnalysis.undertone,
      shadeAnalysis.undertone
    );
    
    // Adjusted score: lower ΔE76 is better, higher undertone compatibility is better
    const adjustedScore = deltaE76 * (2 - undertoneCompatibility);

    matches.push({
      hex: shade.hex,
      brand: shade.brand,
      product: shade.product,
      shade: shade.shade,
      deltaE76,
      undertone: shadeAnalysis.undertone,
      depth: shadeAnalysis.depth,
      adjustedScore
    });
  }

  // Sort by adjusted score (lower is better)
  matches.sort((a, b) => a.adjustedScore - b.adjustedScore);
  
  return matches.slice(0, maxResults);
}

// Create shade ladders (light to dark) for a specific brand/product
export function createShadeLadder(
  shades: Array<{
    hex: string;
    brand: string;
    product: string;
    shade: string;
  }>,
  brand: string,
  product?: string
): Array<{ hex: string; shade: string; depth: number }> {
  let filteredShades = shades.filter(s => s.brand === brand);
  
  if (product) {
    filteredShades = filteredShades.filter(s => s.product === product);
  }

  const ladder = filteredShades
    .map(shade => {
      const lab = hexToLab(shade.hex);
      return {
        hex: shade.hex,
        shade: shade.shade,
        depth: lab.l
      };
    })
    .sort((a, b) => a.depth - b.depth); // Sort light to dark

  return ladder;
}

// Extract unique HEX values from raw data
export function extractUniqueHexValues(rawData: string): string[] {
  return rawData
    .split(/\s+/)
    .filter((s) => /^#[0-9A-Fa-f]{6}$/.test(s))
    .map((s) => s.toUpperCase())
    .filter((hex, index, arr) => arr.indexOf(hex) === index); // Remove duplicates
}

// Supabase integration functions
export async function findClosestShades(userHex: string, limit: number = 10): Promise<ShadeMatch[]> {
  try {
    const { data, error } = await supabase
      .rpc('find_closest_shade_matches', {
        user_hex: userHex,
        match_limit: limit
      });

    if (error) {
      console.error('Error finding shade matches:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error calling find_closest_shade_matches:', error);
    return [];
  }
}

export async function getSkinToneReferences(): Promise<SkinToneHex[]> {
  try {
    const { data, error } = await supabase
      .from('skin_tone_hex_references')
      .select('*')
      .order('lab_l', { ascending: true });

    if (error) {
      console.error('Error fetching skin tone references:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching skin tone references:', error);
    return [];
  }
}

// Generate cross-brand recommendations for a user HEX
export function generateCrossBrandRecommendations(
  userHex: string,
  shadeDatabase: Array<{
    hex: string;
    brand: string;
    product: string;
    shade: string;
  }>
): Array<{
  brand: string;
  matches: HexShadeMatch[];
}> {
  const allMatches = findHexShadeMatches(userHex, shadeDatabase, 50);
  const brandGroups = new Map<string, HexShadeMatch[]>();

  // Group matches by brand
  for (const match of allMatches) {
    if (!brandGroups.has(match.brand)) {
      brandGroups.set(match.brand, []);
    }
    brandGroups.get(match.brand)!.push(match);
  }

  // Convert to array and sort brands by best match
  const recommendations = Array.from(brandGroups.entries())
    .map(([brand, matches]) => ({
      brand,
      matches: matches.slice(0, 3) // Top 3 matches per brand
    }))
    .sort((a, b) => a.matches[0].adjustedScore - b.matches[0].adjustedScore);

  return recommendations.slice(0, 10); // Top 10 brands
}