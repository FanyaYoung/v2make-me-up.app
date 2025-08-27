// Dual-point skin tone analysis for accurate shade matching
// Analyzes both primary (front) and secondary (shadow) tones for comprehensive recommendations

import { supabase } from '@/integrations/supabase/client';
import { hexToLab, calculateDeltaE76, classifyUndertone, calculateUndertoneCompatibility } from './hexShadeMatching';

export interface DualPointAnalysis {
  primaryTone: {
    hex: string;
    lab: { l: number; a: number; b: number };
    undertone: 'Cool' | 'Neutral' | 'Warm' | 'Olive';
    depth: number;
    confidence: number;
  };
  secondaryTone: {
    hex: string;
    lab: { l: number; a: number; b: number };
    undertone: 'Cool' | 'Neutral' | 'Warm' | 'Olive';
    depth: number;
    confidence: number;
  };
  toneDifference: number; // ΔE between primary and secondary
  undertoneConsistency: boolean;
}

export interface PairedShadeMatch {
  primaryMatch: {
    brand: string;
    product_name: string;
    shade_name: string;
    shade_hex: string;
    delta_e_distance: number;
    match_score: number;
  };
  secondaryMatch: {
    brand: string;
    product_name: string;
    shade_name: string;
    shade_hex: string;
    delta_e_distance: number;
    match_score: number;
  };
  overallScore: number;
  brandConsistency: boolean;
  productConsistency: boolean;
}

export interface RecommendationGroup {
  brand: string;
  productLine: string;
  pairedMatches: PairedShadeMatch[];
  groupScore: number;
  coverageType: 'light' | 'medium' | 'full';
}

// Calculate shade matches using foundation products from new database structure
function calculateShadeMatches(userHex: string, foundationProducts: any[], limit: number = 20) {
  const matches: any[] = [];
  
  for (const product of foundationProducts) {
    if (!product.foundation_shades || product.foundation_shades.length === 0) continue;
    
    for (const shade of product.foundation_shades) {
      if (!shade.hex_color) continue;
      
      const userLab = hexToLab(userHex);
      const shadeLab = hexToLab(shade.hex_color);
      const deltaE = calculateDeltaE76(userLab, shadeLab);
      
      // Calculate match score (lower delta E = higher score)
      const matchScore = Math.max(0, 100 - deltaE * 2);
      
      matches.push({
        brand: product.brands?.name || 'Unknown Brand',
        product_name: product.name,
        shade_name: shade.shade_name,
        shade_hex: shade.hex_color,
        delta_e_distance: deltaE,
        match_score: matchScore,
      });
    }
  }
  
  // Sort by match score and return top matches
  matches.sort((a, b) => b.match_score - a.match_score);
  return matches.slice(0, limit);
}

// Analyze dual-point skin tone from two hex colors
export function analyzeDualPointSkinTone(
  primaryHex: string,
  secondaryHex: string,
  primaryConfidence: number = 0.9,
  secondaryConfidence: number = 0.85
): DualPointAnalysis {
  const primaryLab = hexToLab(primaryHex);
  const secondaryLab = hexToLab(secondaryHex);
  
  const primaryUndertone = classifyUndertone(primaryLab.a, primaryLab.b);
  const secondaryUndertone = classifyUndertone(secondaryLab.a, secondaryLab.b);
  
  const toneDifference = calculateDeltaE76(primaryLab, secondaryLab);
  const undertoneConsistency = primaryUndertone === secondaryUndertone;

  return {
    primaryTone: {
      hex: primaryHex.toUpperCase(),
      lab: primaryLab,
      undertone: primaryUndertone,
      depth: primaryLab.l,
      confidence: primaryConfidence
    },
    secondaryTone: {
      hex: secondaryHex.toUpperCase(),
      lab: secondaryLab,
      undertone: secondaryUndertone,
      depth: secondaryLab.l,
      confidence: secondaryConfidence
    },
    toneDifference,
    undertoneConsistency
  };
}

// Find paired shade matches for both primary and secondary tones
export async function findPairedShadeMatches(
  analysis: DualPointAnalysis,
  limit: number = 20
): Promise<PairedShadeMatch[]> {
  try {
    // Query the new skintone table and foundation products with shades
    const { data: skinToneRefs, error: skinError } = await supabase
      .from('skin_tone_references')
      .select('*');

    if (skinError) {
      console.error('Error fetching skin tone references:', skinError);
    }

    // Get foundation products with their shades from the new database structure
    const { data: foundationProducts, error: productsError } = await supabase
      .from('foundation_products')
      .select(`
        *,
        brands(name, logo_url),
        foundation_shades(*)
      `)
      .eq('is_active', true);

    if (productsError) {
      console.error('Error fetching foundation products:', productsError);
      return [];
    }

    if (!foundationProducts || foundationProducts.length === 0) {
      console.warn('No foundation products found');
      return [];
    }

    // Calculate matches for both primary and secondary tones
    const primary = calculateShadeMatches(analysis.primaryTone.hex, foundationProducts, limit * 2);
    const secondary = calculateShadeMatches(analysis.secondaryTone.hex, foundationProducts, limit * 2);

    // Create paired matches
    const pairedMatches: PairedShadeMatch[] = [];

    // Try to pair matches from the same brand/product first
    for (const pMatch of primary) {
      for (const sMatch of secondary) {
        const brandConsistency = pMatch.brand === sMatch.brand;
        const productConsistency = brandConsistency && pMatch.product_name === sMatch.product_name;
        
        // Calculate overall score considering both matches and pairing benefits
        const pairBonus = productConsistency ? 0.8 : (brandConsistency ? 0.9 : 1.0);
        const overallScore = ((pMatch.delta_e_distance + sMatch.delta_e_distance) / 2) * pairBonus;

        pairedMatches.push({
          primaryMatch: pMatch,
          secondaryMatch: sMatch,
          overallScore,
          brandConsistency,
          productConsistency
        });
      }
    }

    // Sort by overall score and prioritize same-brand matches
    pairedMatches.sort((a, b) => {
      // First prioritize product consistency, then brand consistency, then score
      if (a.productConsistency !== b.productConsistency) {
        return a.productConsistency ? -1 : 1;
      }
      if (a.brandConsistency !== b.brandConsistency) {
        return a.brandConsistency ? -1 : 1;
      }
      return a.overallScore - b.overallScore;
    });

    return pairedMatches.slice(0, limit);
  } catch (error) {
    console.error('Error finding paired shade matches:', error);
    return [];
  }
}

// Generate 4 recommendation groups from different brands
export function generateRecommendationGroups(
  pairedMatches: PairedShadeMatch[]
): RecommendationGroup[] {
  const brandGroups = new Map<string, PairedShadeMatch[]>();

  // Group matches by brand
  for (const match of pairedMatches) {
    const brand = match.primaryMatch.brand;
    if (!brandGroups.has(brand)) {
      brandGroups.set(brand, []);
    }
    brandGroups.get(brand)!.push(match);
  }

  // Create recommendation groups
  const groups: RecommendationGroup[] = [];
  
  for (const [brand, matches] of brandGroups.entries()) {
    // Group by product line within brand
    const productGroups = new Map<string, PairedShadeMatch[]>();
    
    for (const match of matches) {
      const productLine = match.primaryMatch.product_name;
      if (!productGroups.has(productLine)) {
        productGroups.set(productLine, []);
      }
      productGroups.get(productLine)!.push(match);
    }

    // Create groups for each product line
    for (const [productLine, productMatches] of productGroups.entries()) {
      const groupScore = productMatches.reduce((sum, m) => sum + m.overallScore, 0) / productMatches.length;
      const coverageType = determineCoverageType(productLine);

      groups.push({
        brand,
        productLine,
        pairedMatches: productMatches.slice(0, 3), // Top 3 pairs per product
        groupScore,
        coverageType
      });
    }
  }

  // Sort by group score and return top 4 different brands
  groups.sort((a, b) => a.groupScore - b.groupScore);
  
  // Ensure we get 4 different brands
  const uniqueBrands = new Set<string>();
  const finalGroups: RecommendationGroup[] = [];
  
  for (const group of groups) {
    if (!uniqueBrands.has(group.brand) && finalGroups.length < 4) {
      uniqueBrands.add(group.brand);
      finalGroups.push(group);
    }
  }

  return finalGroups;
}

// Determine coverage type based on product name
function determineCoverageType(productName: string): 'light' | 'medium' | 'full' {
  const name = productName.toLowerCase();
  
  if (name.includes('sheer') || name.includes('tint') || name.includes('bb') || name.includes('cc')) {
    return 'light';
  } else if (name.includes('full') || name.includes('maximum') || name.includes('complete')) {
    return 'full';
  } else {
    return 'medium';
  }
}

// Extract hex colors from face regions
export function extractFaceRegionHexes(
  canvas: HTMLCanvasElement,
  faceRegions: {
    primary: { x: number; y: number; width: number; height: number };
    secondary: { x: number; y: number; width: number; height: number };
  }
): { primaryHex: string; secondaryHex: string } {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const getAverageHex = (region: { x: number; y: number; width: number; height: number }) => {
    let r = 0, g = 0, b = 0, count = 0;
    
    const startX = Math.max(0, Math.floor(region.x));
    const startY = Math.max(0, Math.floor(region.y));
    const endX = Math.min(canvas.width, Math.floor(region.x + region.width));
    const endY = Math.min(canvas.height, Math.floor(region.y + region.height));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = (y * canvas.width + x) * 4;
        r += imageData.data[index];
        g += imageData.data[index + 1];
        b += imageData.data[index + 2];
        count++;
      }
    }
    
    if (count === 0) return '#000000';

    const avgR = Math.round(r / count);
    const avgG = Math.round(g / count);
    const avgB = Math.round(b / count);

    return `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
  };

  return {
    primaryHex: getAverageHex(faceRegions.primary),
    secondaryHex: getAverageHex(faceRegions.secondary)
  };
}

// Define standard face regions for dual-point analysis
export function getStandardFaceRegions(
  width: number,
  height: number
): {
  primary: { x: number; y: number; width: number; height: number };
  secondary: { x: number; y: number; width: number; height: number };
} {
  return {
    // Primary region: center cheek area (most representative)
    primary: {
      x: width * 0.3,
      y: height * 0.4,
      width: width * 0.4,
      height: width * 0.2
    },
    // Secondary region: side of face (shadow area)
    secondary: {
      x: width * 0.1,
      y: height * 0.45,
      width: width * 0.2,
      height: width * 0.15
    }
  };
}

// Save virtual try-on session to the new virtual_try_on_sessions table
export async function saveVirtualTryOnSession(
  analysis: DualPointAnalysis,
  recommendationGroups: RecommendationGroup[],
  userId?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('virtual_try_on_sessions')
      .insert([
        {
          user_id: userId,
          analysis_data: {
            primary_tone: analysis.primaryTone,
            secondary_tone: analysis.secondaryTone,
            tone_difference: analysis.toneDifference,
            undertone_consistency: analysis.undertoneConsistency
          },
          recommendations: recommendationGroups,
          session_type: 'dual_point_analysis',
          created_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving virtual try-on session:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error saving virtual try-on session:', error);
    return null;
  }
}

// Track match usage in the new user_match_usage table
export async function trackMatchUsage(
  userId: string,
  matchType: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_match_usage')
      .insert([
        {
          user_id: userId,
          match_type: matchType,
          metadata,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error tracking match usage:', error);
    }
  } catch (error) {
    console.error('Error tracking match usage:', error);
  }
}