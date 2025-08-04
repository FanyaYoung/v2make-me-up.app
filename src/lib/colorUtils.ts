// src/lib/colorUtils.ts

// Converts a HEX color string to an RGB object
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Converts RGB to XYZ color space
export function rgbToXyz(rgb: { r: number; g: number; b: number }): { x: number; y: number; z: number } {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  // D65 standard illuminant
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  return { x, y, z };
}

// Converts XYZ to CIELAB color space
export function xyzToLab(xyz: { x: number; y: number; z: number }): { L: number; a: number; b: number } {
  // D65 standard illuminant
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let x = xyz.x / refX;
  let y = xyz.y / refY;
  let z = xyz.z / refZ;

  x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

  const L = (116 * y) - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return { L, a, b };
}

// Calculates the Delta E 2000 color difference between two CIELAB colors
export function deltaE2000(
  lab1: { L: number; a: number; b: number },
  lab2: { L: number; a: number; b: number }
): number {
  const kL = 1;
  const kC = 1;
  const kH = 1;

  const dL = lab2.L - lab1.L;
  const L_ = (lab1.L + lab2.L) / 2;

  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const C_ = (C1 + C2) / 2;

  const a1_ = lab1.a + lab1.a / 2 * (1 - Math.sqrt(Math.pow(C_, 7) / (Math.pow(C_, 7) + Math.pow(25, 7))));
  const a2_ = lab2.a + lab2.a / 2 * (1 - Math.sqrt(Math.pow(C_, 7) / (Math.pow(C_, 7) + Math.pow(25, 7))));

  const C1_ = Math.sqrt(a1_ * a1_ + lab1.b * lab1.b);
  const C2_ = Math.sqrt(a2_ * a2_ + lab2.b * lab2.b);
  const dC_ = C2_ - C1_;

  let h1_ = Math.atan2(lab1.b, a1_);
  if (h1_ < 0) h1_ += 2 * Math.PI;
  let h2_ = Math.atan2(lab2.b, a2_);
  if (h2_ < 0) h2_ += 2 * Math.PI;

  const dh_ = (Math.abs(h1_ - h2_) <= Math.PI) ? h2_ - h1_ :
              (h2_ <= h1_) ? h2_ - h1_ + 2 * Math.PI : h2_ - h1_ - 2 * Math.PI;

  const dH_ = 2 * Math.sqrt(C1_ * C2_) * Math.sin(dh_ / 2);

  const H_ = (Math.abs(h1_ - h2_) <= Math.PI) ? (h1_ + h2_) / 2 :
             (h1_ + h2_ < 2 * Math.PI) ? (h1_ + h2_) / 2 + Math.PI : (h1_ + h2_) / 2 - Math.PI;

  const T = 1 - 0.17 * Math.cos(H_ - Math.PI / 6) + 0.24 * Math.cos(2 * H_) + 0.32 * Math.cos(3 * H_ + Math.PI / 30) - 0.20 * Math.cos(4 * H_ - 63 * Math.PI / 180);

  const SL = 1 + (0.015 * Math.pow(L_ - 50, 2)) / Math.sqrt(20 + Math.pow(L_ - 50, 2));
  const SC = 1 + 0.045 * C_;
  const SH = 1 + 0.015 * C_ * T;

  const RT = -2 * Math.sqrt(Math.pow(C_, 7) / (Math.pow(C_, 7) + Math.pow(25, 7))) * Math.sin(60 * Math.PI / 180 * Math.exp(-Math.pow((H_ * 180 / Math.PI - 275) / 25, 2)));

  const dE = Math.sqrt(
    Math.pow(dL / (kL * SL), 2) +
    Math.pow(dC_ / (kC * SC), 2) +
    Math.pow(dH_ / (kH * SH), 2) +
    RT * (dC_ / (kC * SC)) * (dH_ / (kH * SH))
  );

  return dE;
}