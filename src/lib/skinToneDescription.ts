type Undertone = 'warm' | 'cool' | 'neutral' | 'olive';

interface SkinToneDescriptionOptions {
  undertone?: string;
}

export interface SkinToneDescription {
  name: string;
  undertone: Undertone;
  depthLabel: string;
  analysis: string;
}

const UNDERTONE_NOTES: Record<Undertone, [string, string]> = {
  warm: ['golden', 'apricot'],
  cool: ['rose', 'blue'],
  neutral: ['beige', 'soft peach'],
  olive: ['green', 'golden'],
};

const UNDERTONE_PREFIXES: Record<Undertone, string[]> = {
  warm: ['Cashmere', 'Gilded', 'Sunlit'],
  cool: ['Rosy', 'Silk', 'Petal'],
  neutral: ['Velvet', 'Satin', 'Soft'],
  olive: ['Olive', 'Sage', 'Moss'],
};

const DEPTH_BASE_SHADE: Record<string, string[]> = {
  'Very Fair': ['Porcelain', 'Chantilly'],
  Fair: ['Ivory', 'Pearl'],
  Light: ['Linen', 'Nude'],
  Medium: ['Honey', 'Toffee'],
  Tan: ['Caramel', 'Bronze'],
  Deep: ['Chestnut', 'Mocha'],
  'Very Deep': ['Ebony', 'Onyx'],
};

const normalizeHex = (hex: string) => {
  if (!hex) return '#C8A27D';
  const clean = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#C8A27D';
  return `#${clean.toUpperCase()}`;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = normalizeHex(hex).replace('#', '');
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHslLightness = (r: number, g: number, b: number) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  return ((max + min) / 2) * 100;
};

const rgbToHue = (r: number, g: number, b: number) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue = 0;
  if (max === rn) {
    hue = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    hue = (bn - rn) / delta + 2;
  } else {
    hue = (rn - gn) / delta + 4;
  }

  return Math.round((hue * 60 + 360) % 360);
};

const getDepthLabel = (lightness: number) => {
  if (lightness >= 85) return 'Very Fair';
  if (lightness >= 74) return 'Fair';
  if (lightness >= 62) return 'Light';
  if (lightness >= 50) return 'Medium';
  if (lightness >= 38) return 'Tan';
  if (lightness >= 28) return 'Deep';
  return 'Very Deep';
};

const normalizeUndertone = (undertone?: string): Undertone | null => {
  if (!undertone) return null;
  const clean = undertone.toLowerCase();
  if (clean === 'warm' || clean === 'cool' || clean === 'neutral' || clean === 'olive') {
    return clean;
  }
  return null;
};

const inferUndertone = (r: number, g: number, b: number): Undertone => {
  if (g > r + 10 && g > b + 10) return 'olive';
  if (r - b >= 18) return 'warm';
  if (b - r >= 18) return 'cool';
  return 'neutral';
};

export const describeSkinTone = (
  hex: string,
  options: SkinToneDescriptionOptions = {}
): SkinToneDescription => {
  const [r, g, b] = hexToRgb(hex);
  const lightness = rgbToHslLightness(r, g, b);
  const hue = rgbToHue(r, g, b);
  const depthLabel = getDepthLabel(lightness);
  const undertone = normalizeUndertone(options.undertone) ?? inferUndertone(r, g, b);
  const prefixPool = UNDERTONE_PREFIXES[undertone];
  const basePool = DEPTH_BASE_SHADE[depthLabel];
  const variantIndex = hue % 2;
  const name = `${prefixPool[hue % prefixPool.length]} ${basePool[variantIndex]}`;
  const [noteOne, noteTwo] = UNDERTONE_NOTES[undertone];

  return {
    name,
    undertone,
    depthLabel,
    analysis: `Your shade, ${name}, is a ${depthLabel.toLowerCase()} tone with undertones of ${noteOne} and ${noteTwo}.`,
  };
};
