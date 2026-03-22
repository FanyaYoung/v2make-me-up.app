import { supabase } from '@/integrations/supabase/client';

export interface ProductMetadata {
  brand: string;
  product: string;
  price?: number;
  productUrl?: string;
  imageUrl?: string;
  websiteLink?: string;
  retailer?: string;
}

export const makeProductKey = (brand: string, product: string) =>
  `${brand}`.toLowerCase().trim().replace(/\s+/g, ' ') + '|' +
  `${product}`.toLowerCase().trim().replace(/\s+/g, ' ');

export const parseCsvRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    const next = row[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  result.push(current.trim());
  return result;
};

export const normalizeImageUrl = (imgSrc?: string, productUrl?: string) => {
  if (!imgSrc || !imgSrc.trim()) return '';
  const src = imgSrc.trim();
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) {
    try {
      const origin = productUrl ? new URL(productUrl).origin : '';
      return origin ? `${origin}${src}` : '';
    } catch {
      return '';
    }
  }
  return '';
};

export const normalizeProductPrice = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) return undefined;
    if (value > 500 && value <= 50000) return value / 100;
    if (value > 500) return undefined;
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(parsed)) return undefined;
    if (parsed <= 0) return undefined;
    if (parsed > 500 && parsed <= 50000) return parsed / 100; // likely cents imported as dollars
    if (parsed > 500) return undefined; // unrealistic for single makeup item
    return parsed;
  }
  return undefined;
};

const getValue = (row: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const foundKey = Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase());
    if (!foundKey) continue;
    const value = row[foundKey];
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return '';
};

const parseMetadataRow = (row: Record<string, unknown>): ProductMetadata | null => {
  const brand = getValue(row, ['brand']);
  const product = getValue(row, ['name', 'product', 'product_name']);
  if (!brand || !product) return null;

  const productUrl = getValue(row, ['product_link', 'product_url', 'url']);
  const websiteLink = getValue(row, ['website_link', 'website', 'store_url']);
  const imageRaw = getValue(row, ['image_link', 'image_url', 'imgsrc', 'image']);
  const imageUrl = normalizeImageUrl(imageRaw, productUrl || websiteLink);
  const price = normalizeProductPrice(getValue(row, ['price', 'cost', 'msrp']));
  const retailer = getValue(row, ['retailer', 'store', 'product_type', 'category']);

  return {
    brand,
    product,
    price,
    productUrl,
    imageUrl: imageUrl || undefined,
    websiteLink,
    retailer: retailer || undefined,
  };
};

const loadCsvMetadata = async () => {
  const map = new Map<string, ProductMetadata>();
  try {
    const response = await fetch('/data/output.csv');
    if (!response.ok) return map;
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase());
    const idx = {
      brand: headers.indexOf('brand'),
      name: headers.indexOf('name'),
      price: headers.indexOf('price'),
      productLink: headers.indexOf('product_link'),
      imageLink: headers.indexOf('image_link'),
      websiteLink: headers.indexOf('website_link'),
      productType: headers.indexOf('product_type'),
    };

    for (const line of lines.slice(1)) {
      const values = parseCsvRow(line);
      const brand = (values[idx.brand] || '').trim();
      const product = (values[idx.name] || '').trim();
      if (!brand || !product) continue;

      const productUrl = (values[idx.productLink] || '').trim();
      const websiteLink = (values[idx.websiteLink] || '').trim();
      const imageUrl = normalizeImageUrl(values[idx.imageLink], productUrl || websiteLink);
      const price = normalizeProductPrice(values[idx.price]);
      const retailer = (values[idx.productType] || '').trim();

      map.set(makeProductKey(brand, product), {
        brand,
        product,
        price,
        productUrl,
        imageUrl: imageUrl || undefined,
        websiteLink,
        retailer: retailer || undefined,
      });
    }
  } catch (error) {
    console.warn('Could not load CSV product metadata', error);
  }
  return map;
};

const loadSupabasePricingMetadata = async () => {
  const map = new Map<string, ProductMetadata>();
  try {
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await (supabase as any)
        .from('full_pricing_website_photos')
        .select('*')
        .range(from, from + pageSize - 1);

      if (error) {
        console.warn('Could not query full_pricing_website_photos', error);
        break;
      }

      const rows = (data || []) as Record<string, unknown>[];
      for (const row of rows) {
        const parsed = parseMetadataRow(row);
        if (!parsed) continue;
        map.set(makeProductKey(parsed.brand, parsed.product), parsed);
      }

      if (rows.length < pageSize) break;
      from += pageSize;
    }
  } catch (error) {
    console.warn('Failed loading Supabase pricing metadata', error);
  }
  return map;
};

export const loadProductMetadataMap = async (): Promise<Map<string, ProductMetadata>> => {
  const csvMap = await loadCsvMetadata();
  const supabaseMap = await loadSupabasePricingMetadata();
  const merged = new Map<string, ProductMetadata>();

  // Baseline from CSV.
  for (const [key, value] of csvMap.entries()) {
    merged.set(key, value);
  }
  // Override with newly uploaded Supabase pricing/photo/website rows.
  for (const [key, value] of supabaseMap.entries()) {
    const existing = merged.get(key);
    merged.set(key, { ...(existing || value), ...value });
  }

  return merged;
};
