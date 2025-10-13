// color.ts - OKLab color conversions and lighting adjustments
export type OKLab = { L: number; a: number; b: number };

export function hexToRGB01(hex: string): [number, number, number] {
  let hs = hex.trim().replace(/^#/, "");
  if (hs.length === 3) hs = hs.split("").map(c => c + c).join("");
  const r = parseInt(hs.slice(0, 2), 16) / 255;
  const g = parseInt(hs.slice(2, 4), 16) / 255;
  const b = parseInt(hs.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgb01ToLinear(rgb: [number, number, number]): [number, number, number] {
  return [srgbToLinear(rgb[0]), srgbToLinear(rgb[1]), srgbToLinear(rgb[2])];
}

export function hexToOKLab(hex: string): OKLab {
  const [r, g, b] = rgb01ToLinear(hexToRGB01(hex));
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  return { L, a, b: b2 };
}

export function oklabDistance(x: OKLab, y: OKLab): number {
  return Math.sqrt((x.L - y.L) ** 2 + (x.a - y.a) ** 2 + (x.b - y.b) ** 2);
}

export function lightingAdjustmentVector(cct_k: number, cri: number): OKLab {
  const delta_k = (cct_k - 6500.0) / 6500.0;
  const cri_penalty = (100 - Math.max(0, Math.min(100, cri))) / 100;
  const a_shift = -0.02 * delta_k;
  const b_shift = -0.03 * delta_k;
  const scale = 0.5 * cri_penalty + 0.2;
  return { L: 0.0, a: a_shift * scale, b: b_shift * scale };
}

export function adjustOKLabForLighting(ok: OKLab, cct_k: number, cri: number): OKLab {
  const d = lightingAdjustmentVector(cct_k, cri);
  return { L: ok.L + d.L, a: ok.a + d.a, b: ok.b + d.b };
}

export function undertoneFromOKLab(ok: OKLab): "cool" | "neutral" | "warm" {
  if (ok.a > 0.005 && ok.b > 0.005) return "warm";
  if (ok.a < -0.005 && ok.b < -0.005) return "cool";
  return "neutral";
}
