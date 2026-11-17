import { hexToRgb, rgbToXyz, xyzToLab } from './colorUtils';

/**
 * A safety check for depth errors in foundation shade recommendations.
 * This does not replace or change the proprietary pigment matching algorithm:
 * pigment similarity still ranks candidates after implausible depths are excluded.
 *
 * L* is CIELAB perceptual lightness (0 black, 100 white). Thresholds are
 * conservative initial safeguards, not a validated clinical or colorimetric fit.
 */
export const MAX_TOO_LIGHT_LSTAR = 18;
export const MAX_TOO_DARK_LSTAR = 22;
export const MAX_SKIN_ZONE_LSTAR_GAP = 30;

export const getPerceptualLightness = (hex: string): number | null => {
  const rgb = hexToRgb(hex);
  return rgb ? xyzToLab(rgbToXyz(rgb)).l : null;
};

/**
 * Never return a shade dramatically lighter or darker than the sampled skin.
 * In particular, ivory shades must not rank for a genuinely deep skin sample.
 */
export const isShadeDepthCompatible = (skinHex: string, shadeHex: string): boolean => {
  const skinLightness = getPerceptualLightness(skinHex);
  const shadeLightness = getPerceptualLightness(shadeHex);
  if (skinLightness === null || shadeLightness === null) return false;

  const difference = shadeLightness - skinLightness;
  return difference <= MAX_TOO_LIGHT_LSTAR && difference >= -MAX_TOO_DARK_LSTAR;
};

/**
 * Reject obviously inconsistent lightest/darkest face readings, which usually
 * indicate highlights, background contamination, or unreliable analysis.
 */
export const areSkinZoneDepthsPlausible = (lightHex: string, darkHex: string): boolean => {
  const lightness = getPerceptualLightness(lightHex);
  const darkness = getPerceptualLightness(darkHex);
  if (lightness === null || darkness === null) return false;
  const gap = lightness - darkness;
  return gap >= 0 && gap <= MAX_SKIN_ZONE_LSTAR_GAP;
};
