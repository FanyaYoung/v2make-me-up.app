// Color utility functions for CIELAB color space calculations and Delta E 2000

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

export interface Lab {
  l: number;
  a: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Convert RGB to XYZ color space
 */
export const rgbToXyz = (rgb: RGB): XYZ => {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  // Observer = 2°, Illuminant = D65
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  return { x, y, z };
};

/**
 * Convert XYZ to Lab color space
 */
export const xyzToLab = (xyz: XYZ): Lab => {
  // Reference white D65
  const xn = 95.047;
  const yn = 100.000;
  const zn = 108.883;

  let x = xyz.x / xn;
  let y = xyz.y / yn;
  let z = xyz.z / zn;

  const threshold = 216 / 24389;
  const m = 24389 / 27;

  x = x > threshold ? Math.pow(x, 1/3) : (m * x + 16) / 116;
  y = y > threshold ? Math.pow(y, 1/3) : (m * y + 16) / 116;
  z = z > threshold ? Math.pow(z, 1/3) : (m * z + 16) / 116;

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return { l, a, b };
};

/**
 * Calculate Delta E 2000 color difference
 */
export const deltaE2000 = (lab1: Lab, lab2: Lab): number => {
  const kL = 1;
  const kC = 1;
  const kH = 1;

  const deltaL = lab2.l - lab1.l;
  const l = (lab1.l + lab2.l) / 2;

  const c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const cBar = (c1 + c2) / 2;

  const a1Prime = lab1.a + (lab1.a / 2) * (1 - Math.sqrt(Math.pow(cBar, 7) / (Math.pow(cBar, 7) + Math.pow(25, 7))));
  const a2Prime = lab2.a + (lab2.a / 2) * (1 - Math.sqrt(Math.pow(cBar, 7) / (Math.pow(cBar, 7) + Math.pow(25, 7))));

  const c1Prime = Math.sqrt(a1Prime * a1Prime + lab1.b * lab1.b);
  const c2Prime = Math.sqrt(a2Prime * a2Prime + lab2.b * lab2.b);
  const cBarPrime = (c1Prime + c2Prime) / 2;
  const deltaC = c2Prime - c1Prime;

  const h1Prime = Math.atan2(lab1.b, a1Prime) * 180 / Math.PI;
  const h2Prime = Math.atan2(lab2.b, a2Prime) * 180 / Math.PI;

  let deltaH;
  if (Math.abs(h1Prime - h2Prime) <= 180) {
    deltaH = h2Prime - h1Prime;
  } else if (h2Prime - h1Prime > 180) {
    deltaH = h2Prime - h1Prime - 360;
  } else {
    deltaH = h2Prime - h1Prime + 360;
  }

  const deltaHPrime = 2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(deltaH * Math.PI / 360);

  let hBarPrime;
  if (Math.abs(h1Prime - h2Prime) > 180) {
    hBarPrime = (h1Prime + h2Prime + 360) / 2;
  } else {
    hBarPrime = (h1Prime + h2Prime) / 2;
  }

  const t = 1 - 0.17 * Math.cos((hBarPrime - 30) * Math.PI / 180) +
             0.24 * Math.cos(2 * hBarPrime * Math.PI / 180) +
             0.32 * Math.cos((3 * hBarPrime + 6) * Math.PI / 180) -
             0.20 * Math.cos((4 * hBarPrime - 63) * Math.PI / 180);

  const sL = 1 + (0.015 * Math.pow(l - 50, 2)) / Math.sqrt(20 + Math.pow(l - 50, 2));
  const sC = 1 + 0.045 * cBarPrime;
  const sH = 1 + 0.015 * cBarPrime * t;

  const deltaTheta = 30 * Math.exp(-Math.pow((hBarPrime - 275) / 25, 2));
  const rC = 2 * Math.sqrt(Math.pow(cBarPrime, 7) / (Math.pow(cBarPrime, 7) + Math.pow(25, 7)));
  const rT = -rC * Math.sin(2 * deltaTheta * Math.PI / 180);

  const deltaE = Math.sqrt(
    Math.pow(deltaL / (kL * sL), 2) +
    Math.pow(deltaC / (kC * sC), 2) +
    Math.pow(deltaHPrime / (kH * sH), 2) +
    rT * (deltaC / (kC * sC)) * (deltaHPrime / (kH * sH))
  );

  return deltaE;
};