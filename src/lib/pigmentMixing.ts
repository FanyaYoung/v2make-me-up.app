// Pigment-based color mixing system for skin-tone matching.
// Uses an earth-pigment palette and keeps white as the final adjustment.

export interface PigmentMix {
  aquamarine: number;      // Mapped to Yellow Ochre-style earth pigment in UI
  burntUmber: number;      // Dark brown pigment
  cadmiumRed: number;      // Red pigment
  cadmiumYellow: number;   // Yellow pigment
  ultramarineBlue: number; // Blue pigment
  white: number;           // White (MUST be added last, never as base)
}

export interface PigmentColor {
  hex: string;
  rgb: [number, number, number];
  pigmentMix: PigmentMix;
  isRecreated: boolean;
}

// Base pigment colors in RGB
const PIGMENTS = {
  // Tuned toward real skin-friendly paint behavior:
  // less neon yellow/cyan, more earth pigments.
  aquamarine: [199, 153, 83] as [number, number, number],      // Yellow Ochre-like
  burntUmber: [102, 65, 44] as [number, number, number],
  cadmiumRed: [176, 74, 60] as [number, number, number],       // Burnt Sienna-like red
  cadmiumYellow: [239, 184, 96] as [number, number, number],   // Warm ochre yellow
  ultramarineBlue: [44, 60, 104] as [number, number, number],  // Muted ultramarine
  white: [255, 255, 255] as [number, number, number]
};

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}

/**
 * Analyze a target color and determine the best pigment mix
 * CRITICAL: Never use 100% of any single pigment. Always mix multiple pigments.
 * Use darker pigments for depth and lighter pigments for brightness.
 */
export function analyzePigmentMix(targetHex: string): PigmentMix {
  const target = hexToRgb(targetHex);
  const [r, g, b] = target;
  
  // Calculate luminance to determine darkness level
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Analyze undertone from RGB ratios
  const rRatio = r / 255;
  const gRatio = g / 255;
  const bRatio = b / 255;
  const warmth = Math.max(0, (rRatio - bRatio));
  const olive = Math.max(0, (gRatio - rRatio));
  
  // Start with minimum base amounts to ensure no pure pigments (10% minimum each)
  const MIN_PIGMENT = 0.10;
  let cadmiumRed = MIN_PIGMENT;
  let cadmiumYellow = MIN_PIGMENT;
  let ultramarineBlue = MIN_PIGMENT;
  let burntUmber = MIN_PIGMENT;
  let aquamarine = MIN_PIGMENT;
  
  // Depth foundation.
  burntUmber += 0.18 + Math.min(0.38, (1 - luminance) * 0.48);

  // Warmth/redness to avoid ashen output.
  cadmiumRed += 0.14 + (warmth * 0.26) + ((1 - luminance) * 0.08);

  // Yellow kept lower than before to avoid yellow cast.
  cadmiumYellow += 0.10 + (gRatio * 0.16) + (luminance * 0.06);

  // Blue mostly for cool correction; keep subtle.
  ultramarineBlue += 0.06 + Math.min(0.14, bRatio * 0.18);

  // Earth-olive adjustment for olive undertones.
  aquamarine += 0.08 + Math.min(0.12, olive * 0.20);
  
  // Normalize all pigments to sum to 1.0
  const totalSum = cadmiumRed + cadmiumYellow + ultramarineBlue + burntUmber + aquamarine;
  if (totalSum > 0) {
    const normalizer = 1.0 / totalSum;
    cadmiumRed *= normalizer;
    cadmiumYellow *= normalizer;
    ultramarineBlue *= normalizer;
    burntUmber *= normalizer;
    aquamarine *= normalizer;
  }
  
  // Enforce maximum caps to prevent any single pigment from dominating
  const MAX_SINGLE_PIGMENT = 0.45;
  burntUmber = Math.min(MAX_SINGLE_PIGMENT, burntUmber);
  ultramarineBlue = Math.min(MAX_SINGLE_PIGMENT, ultramarineBlue);
  cadmiumRed = Math.min(MAX_SINGLE_PIGMENT, cadmiumRed);
  cadmiumYellow = Math.min(MAX_SINGLE_PIGMENT, cadmiumYellow);
  aquamarine = Math.min(MAX_SINGLE_PIGMENT, aquamarine);
  
  // Re-normalize after capping
  const finalSum = cadmiumRed + cadmiumYellow + ultramarineBlue + burntUmber + aquamarine;
  if (finalSum > 0) {
    const finalNormalizer = 1.0 / finalSum;
    cadmiumRed *= finalNormalizer;
    cadmiumYellow *= finalNormalizer;
    ultramarineBlue *= finalNormalizer;
    burntUmber *= finalNormalizer;
    aquamarine *= finalNormalizer;
  }
  
  // White: minimal amount only for very light tones.
  const white = Math.min(0.10, Math.max(0, luminance - 0.75) * 0.22);
  
  return {
    aquamarine: Math.max(MIN_PIGMENT * 0.5, Math.min(1, aquamarine)),
    burntUmber: Math.max(MIN_PIGMENT * 0.5, Math.min(1, burntUmber)),
    cadmiumRed: Math.max(MIN_PIGMENT * 0.5, Math.min(1, cadmiumRed)),
    cadmiumYellow: Math.max(MIN_PIGMENT * 0.5, Math.min(1, cadmiumYellow)),
    ultramarineBlue: Math.max(MIN_PIGMENT * 0.5, Math.min(1, ultramarineBlue)),
    white: Math.max(0, Math.min(0.15, white))
  };
}

/**
 * Recreate a color from pigment mix
 * Process: Mix base pigments first, then add white
 */
export function recreateColorFromPigments(mix: PigmentMix): [number, number, number] {
  // Step 1: Mix base pigments (without white)
  let baseR = 0, baseG = 0, baseB = 0;
  let baseTotal = 0;
  
  if (mix.aquamarine > 0) {
    baseR += PIGMENTS.aquamarine[0] * mix.aquamarine;
    baseG += PIGMENTS.aquamarine[1] * mix.aquamarine;
    baseB += PIGMENTS.aquamarine[2] * mix.aquamarine;
    baseTotal += mix.aquamarine;
  }
  
  if (mix.burntUmber > 0) {
    baseR += PIGMENTS.burntUmber[0] * mix.burntUmber;
    baseG += PIGMENTS.burntUmber[1] * mix.burntUmber;
    baseB += PIGMENTS.burntUmber[2] * mix.burntUmber;
    baseTotal += mix.burntUmber;
  }
  
  if (mix.cadmiumRed > 0) {
    baseR += PIGMENTS.cadmiumRed[0] * mix.cadmiumRed;
    baseG += PIGMENTS.cadmiumRed[1] * mix.cadmiumRed;
    baseB += PIGMENTS.cadmiumRed[2] * mix.cadmiumRed;
    baseTotal += mix.cadmiumRed;
  }
  
  if (mix.cadmiumYellow > 0) {
    baseR += PIGMENTS.cadmiumYellow[0] * mix.cadmiumYellow;
    baseG += PIGMENTS.cadmiumYellow[1] * mix.cadmiumYellow;
    baseB += PIGMENTS.cadmiumYellow[2] * mix.cadmiumYellow;
    baseTotal += mix.cadmiumYellow;
  }
  
  if (mix.ultramarineBlue > 0) {
    baseR += PIGMENTS.ultramarineBlue[0] * mix.ultramarineBlue;
    baseG += PIGMENTS.ultramarineBlue[1] * mix.ultramarineBlue;
    baseB += PIGMENTS.ultramarineBlue[2] * mix.ultramarineBlue;
    baseTotal += mix.ultramarineBlue;
  }
  
  // Normalize base color
  if (baseTotal > 0) {
    baseR /= baseTotal;
    baseG /= baseTotal;
    baseB /= baseTotal;
  }
  
  // Step 2: Add white AFTER base mix (critical requirement)
  const whiteAmount = mix.white;
  const baseAmount = 1 - whiteAmount;
  
  const finalR = baseR * baseAmount + PIGMENTS.white[0] * whiteAmount;
  const finalG = baseG * baseAmount + PIGMENTS.white[1] * whiteAmount;
  const finalB = baseB * baseAmount + PIGMENTS.white[2] * whiteAmount;
  
  return [
    Math.round(Math.max(0, Math.min(255, finalR))),
    Math.round(Math.max(0, Math.min(255, finalG))),
    Math.round(Math.max(0, Math.min(255, finalB)))
  ];
}

/**
 * Create a pigment-based color from hex
 */
export function createPigmentColor(hex: string): PigmentColor {
  const mix = analyzePigmentMix(hex);
  const sourceRgb = hexToRgb(hex);
  const sourceHex = rgbToHex(...sourceRgb);
  
  return {
    hex: sourceHex,
    rgb: sourceRgb,
    pigmentMix: mix,
    isRecreated: false
  };
}

/**
 * Create a light color from a dark base by adjusting pigment ratios
 * CRITICAL: Uses LIGHTER PIGMENTS (Yellow, Red) to brighten, NOT white
 * Reduces DARKER PIGMENTS (Burnt Umber, Ultramarine Blue) for lightness
 */
export function createLightFromDark(darkPigmentColor: PigmentColor): PigmentColor {
  const darkMix = darkPigmentColor.pigmentMix;
  
  // Strategy: Reduce dark pigments, increase light pigments
  // Dark pigments: burntUmber, ultramarineBlue
  // Light pigments: cadmiumYellow, cadmiumRed
  
  const DARKEN_REDUCTION = 0.55; // Keep more depth for natural skin look
  const LIGHTEN_BOOST = 1.22;    // Gentle lift to avoid yellow cast
  
  // Create light mix by shifting pigment balance
  const lightMix: PigmentMix = {
    // Reduce dark pigments significantly
    burntUmber: darkMix.burntUmber * DARKEN_REDUCTION,
    ultramarineBlue: darkMix.ultramarineBlue * DARKEN_REDUCTION,
    
    // Increase warm pigments with red slightly favored over yellow.
    cadmiumYellow: darkMix.cadmiumYellow * (LIGHTEN_BOOST * 0.92),
    cadmiumRed: darkMix.cadmiumRed * (LIGHTEN_BOOST * 1.06),
    
    // Keep undertone earth pigment stable.
    aquamarine: darkMix.aquamarine * 0.95,
    
    // Minimal white, only if absolutely needed
    white: Math.min(0.06, darkMix.white * 1.25)
  };
  
  // Normalize to ensure sum = 1.0
  const sum = lightMix.aquamarine + lightMix.burntUmber + lightMix.cadmiumRed + 
              lightMix.cadmiumYellow + lightMix.ultramarineBlue + lightMix.white;
  
  if (sum > 0) {
    lightMix.aquamarine /= sum;
    lightMix.burntUmber /= sum;
    lightMix.cadmiumRed /= sum;
    lightMix.cadmiumYellow /= sum;
    lightMix.ultramarineBlue /= sum;
    lightMix.white /= sum;
  }
  
  // Enforce caps to prevent any single pigment dominating
  const MAX_PIGMENT = 0.45;
  lightMix.cadmiumYellow = Math.min(MAX_PIGMENT, lightMix.cadmiumYellow);
  lightMix.cadmiumRed = Math.min(MAX_PIGMENT, lightMix.cadmiumRed);
  lightMix.burntUmber = Math.min(MAX_PIGMENT, lightMix.burntUmber);
  lightMix.ultramarineBlue = Math.min(MAX_PIGMENT, lightMix.ultramarineBlue);
  lightMix.aquamarine = Math.min(MAX_PIGMENT, lightMix.aquamarine);
  lightMix.white = Math.min(0.10, lightMix.white);

  // Prevent yellow dominance in lighter tones.
  if (lightMix.cadmiumYellow > lightMix.cadmiumRed + 0.08) {
    const shift = (lightMix.cadmiumYellow - (lightMix.cadmiumRed + 0.08)) * 0.7;
    lightMix.cadmiumYellow -= shift;
    lightMix.cadmiumRed += shift * 0.55;
    lightMix.burntUmber += shift * 0.45;
  }
  
  // Final normalization after caps
  const finalSum = lightMix.aquamarine + lightMix.burntUmber + lightMix.cadmiumRed + 
                   lightMix.cadmiumYellow + lightMix.ultramarineBlue + lightMix.white;
  
  if (finalSum > 0) {
    lightMix.aquamarine /= finalSum;
    lightMix.burntUmber /= finalSum;
    lightMix.cadmiumRed /= finalSum;
    lightMix.cadmiumYellow /= finalSum;
    lightMix.ultramarineBlue /= finalSum;
    lightMix.white /= finalSum;
  }
  
  const recreatedRgb = recreateColorFromPigments(lightMix);
  const recreatedHex = rgbToHex(...recreatedRgb);
  
  return {
    hex: recreatedHex,
    rgb: recreatedRgb,
    pigmentMix: lightMix,
    isRecreated: true
  };
}

/**
 * Calculate color difference between two pigment colors
 */
export function calculatePigmentColorDistance(color1: PigmentColor, color2: PigmentColor): number {
  // Prioritize pigment-composition distance so matching is not purely light-based.
  const weights = {
    aquamarine: 0.9,
    burntUmber: 1.2,
    cadmiumRed: 1.1,
    cadmiumYellow: 1.0,
    ultramarineBlue: 1.0,
    white: 0.4,
  } as const;

  const mixA = color1.pigmentMix;
  const mixB = color2.pigmentMix;
  const weightedSum =
    weights.aquamarine * Math.pow(mixA.aquamarine - mixB.aquamarine, 2) +
    weights.burntUmber * Math.pow(mixA.burntUmber - mixB.burntUmber, 2) +
    weights.cadmiumRed * Math.pow(mixA.cadmiumRed - mixB.cadmiumRed, 2) +
    weights.cadmiumYellow * Math.pow(mixA.cadmiumYellow - mixB.cadmiumYellow, 2) +
    weights.ultramarineBlue * Math.pow(mixA.ultramarineBlue - mixB.ultramarineBlue, 2) +
    weights.white * Math.pow(mixA.white - mixB.white, 2);

  const maxDistance = Math.sqrt(
    weights.aquamarine +
    weights.burntUmber +
    weights.cadmiumRed +
    weights.cadmiumYellow +
    weights.ultramarineBlue +
    weights.white
  );

  const pigmentDistance = (Math.sqrt(weightedSum) / maxDistance) * 100;

  // Keep a small RGB component to avoid edge cases where very different colors
  // accidentally get similar pigment vectors.
  const [r1, g1, b1] = color1.rgb;
  const [r2, g2, b2] = color2.rgb;
  const rgbDistance = (
    Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)) / 441.67
  ) * 100;

  return Math.min(100, pigmentDistance * 0.85 + rgbDistance * 0.15);
}

/**
 * Calculate match percentage between two pigment colors
 */
export function calculatePigmentMatch(userSkinTone: PigmentColor, productShade: PigmentColor): number {
  const distance = calculatePigmentColorDistance(userSkinTone, productShade);
  // Convert distance to match percentage (closer = higher percentage)
  return Math.max(0, 100 - distance);
}
