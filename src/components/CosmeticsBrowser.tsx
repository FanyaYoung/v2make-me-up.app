import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star } from 'lucide-react';
import { calculatePigmentMatch, createPigmentColor } from '@/lib/pigmentMixing';
import { describeSkinTone } from '@/lib/skinToneDescription';
import { supabase } from '@/integrations/supabase/client';
import { normalizeProductPrice } from '@/lib/productMetadata';

interface CosmeticsProduct {
  id: string;
  brand: string;
  name: string;
  price?: number;
  image_link?: string;
  product_link?: string;
  website_link?: string;
  rating?: number;
  category?: string;
  product_type?: string;
  hexCandidates?: string[];
  relevanceScore?: number;
  source?: string;
}

const PLACEHOLDER_IMAGE = '/placeholder.svg';
const MAX_CARDS = 120;
const SUPABASE_SOURCES = [
  'full_pricing_website_photos',
  'cosmetics_products',
  'foundation_products',
  'productsandshadeswithimages',
  'sephoraproductsbyskintone',
] as const;

const parseCsvRow = (row: string): string[] => {
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

const getValueFromRow = (row: Record<string, unknown>, keys: string[]) => {
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

const normalizeKey = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ');
const toProductKey = (brand: string, name: string) => `${normalizeKey(brand)}|${normalizeKey(name)}`;

const parseRowToProduct = (row: Record<string, unknown>, source: string): CosmeticsProduct | null => {
  let brand = getValueFromRow(row, ['brand', 'brand_name', 'manufacturer']);
  const nestedBrand = row.brands as any;
  if (!brand && nestedBrand && typeof nestedBrand === 'object') {
    brand = String(nestedBrand.name || '').trim();
  }

  const name = getValueFromRow(row, [
    'name',
    'product',
    'product_name',
    'title',
    'shade_name',
  ]);
  if (!brand || !name || isCorruptProductName(name)) return null;

  const price = normalizeProductPrice(getValueFromRow(row, ['price', 'cost', 'msrp']));
  const product_link = getValueFromRow(row, ['product_link', 'product_url', 'url', 'buy_url']);
  const website_link = getValueFromRow(row, ['website_link', 'website', 'store_url']);
  const imageRaw = getValueFromRow(row, ['image_link', 'image_url', 'imgsrc', 'photo', 'photo_url', 'image']);
  const image_link = normalizeImageUrl(imageRaw, product_link || website_link);
  const ratingRaw = getValueFromRow(row, ['rating', 'score']);
  const category = getValueFromRow(row, ['category', 'dataset_name']);
  const product_type = getValueFromRow(row, ['product_type', 'type', 'subcategory']);
  const ratingParsed = Number(ratingRaw.replace(/[^0-9.]/g, ''));
  const id = getValueFromRow(row, ['id']) || `${brand}-${name}`;

  return {
    id,
    brand,
    name,
    price,
    image_link: image_link || undefined,
    product_link: product_link || undefined,
    website_link: website_link || undefined,
    rating: Number.isFinite(ratingParsed) ? ratingParsed : undefined,
    category: category || undefined,
    product_type: product_type || undefined,
    source,
  };
};

const SOURCE_PRIORITY: Record<string, number> = {
  full_pricing_website_photos: 100,
  cosmetics_products: 80,
  foundation_products: 70,
  productsandshadeswithimages: 60,
  sephoraproductsbyskintone: 50,
  output_csv: 40,
};

const chooseByPriority = <T,>(
  existingValue: T | undefined,
  incomingValue: T | undefined,
  existingSource: string | undefined,
  incomingSource: string
): T | undefined => {
  if (incomingValue === undefined || incomingValue === null || incomingValue === '') return existingValue;
  if (existingValue === undefined || existingValue === null || existingValue === '') return incomingValue;
  const existingPriority = existingSource ? (SOURCE_PRIORITY[existingSource] || 0) : 0;
  const incomingPriority = SOURCE_PRIORITY[incomingSource] || 0;
  return incomingPriority >= existingPriority ? incomingValue : existingValue;
};

const isCorruptProductName = (name: string) => {
  if (!name) return true;
  const n = name.trim();
  if (!n) return true;
  if (n.length > 140) return true;
  if (n.includes('http://') || n.includes('https://')) return true;
  if (n.includes('api_featured_images') || n.includes('makeup-api.herokuapp.com')) return true;
  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(n)) return true;
  if (n.split(',').length > 6) return true;
  return false;
};

const normalizeImageUrl = (imgSrc?: string, productUrl?: string) => {
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

const getStoreFromUrl = (url?: string) => {
  if (!url) return 'Retailer';
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('ulta')) return 'Ulta Beauty';
    if (host.includes('sephora')) return 'Sephora';
    if (host.includes('nordstrom')) return 'Nordstrom';
    if (host.includes('clinique')) return 'Clinique';
    if (host.includes('chanel')) return 'Chanel';
    if (host.includes('maccosmetics') || host.includes('mac-cosmetics')) return 'MAC Cosmetics';
    if (host.includes('amazon')) return 'Amazon';
    if (host.includes('walmart')) return 'Walmart';
    return host.replace('www.', '');
  } catch {
    return 'Retailer';
  }
};

const CosmeticsBrowser = () => {
  const [allProducts, setAllProducts] = useState<CosmeticsProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceSummary, setSourceSummary] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [retailerFilter, setRetailerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [analysisHex, setAnalysisHex] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('latest_skin_tone_analysis');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { midHex?: string; lightHex?: string; darkHex?: string };
      const preferredHex = parsed.midHex || parsed.lightHex || parsed.darkHex || null;
      if (preferredHex && /^#[0-9A-F]{6}$/i.test(preferredHex)) {
        setAnalysisHex(preferredHex);
      }
    } catch (error) {
      console.warn('Could not read latest skin tone analysis', error);
    }
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const sourceCounts: Record<string, number> = {};
        const mergedMap = new Map<string, CosmeticsProduct>();

        for (const source of SUPABASE_SOURCES) {
          try {
            const pageSize = 1000;
            let from = 0;
            let totalForSource = 0;
            while (true) {
              const { data, error } = await (supabase as any)
                .from(source)
                .select('*')
                .range(from, from + pageSize - 1);

              if (error) {
                console.warn(`Could not query ${source}`, error);
                break;
              }

              const rows = (data || []) as Record<string, unknown>[];
              for (const row of rows) {
                const parsed = parseRowToProduct(row, source);
                if (!parsed) continue;
                const key = toProductKey(parsed.brand, parsed.name);
                const existing = mergedMap.get(key);
                if (!existing) {
                  mergedMap.set(key, parsed);
                  totalForSource += 1;
                  continue;
                }

                const chosenSource = existing.source || 'output_csv';
                const merged: CosmeticsProduct = {
                  ...existing,
                  id: chooseByPriority(existing.id, parsed.id, chosenSource, source) || existing.id,
                  price: chooseByPriority(existing.price, parsed.price, chosenSource, source),
                  image_link: chooseByPriority(existing.image_link, parsed.image_link, chosenSource, source),
                  product_link: chooseByPriority(existing.product_link, parsed.product_link, chosenSource, source),
                  website_link: chooseByPriority(existing.website_link, parsed.website_link, chosenSource, source),
                  rating: chooseByPriority(existing.rating, parsed.rating, chosenSource, source),
                  category: chooseByPriority(existing.category, parsed.category, chosenSource, source),
                  product_type: chooseByPriority(existing.product_type, parsed.product_type, chosenSource, source),
                  source: SOURCE_PRIORITY[source] >= (SOURCE_PRIORITY[chosenSource] || 0) ? source : chosenSource,
                };
                mergedMap.set(key, merged);
              }

              if (rows.length < pageSize) break;
              from += pageSize;
            }
            sourceCounts[source] = totalForSource;
          } catch (error) {
            console.warn(`Failed loading source table ${source}`, error);
          }
        }

        let productsFromSource = Array.from(mergedMap.values());

        // Fallback source: local CSV dataset.
        if (productsFromSource.length === 0) {
          const response = await fetch('/data/output.csv');
          const csvText = await response.text();
          const lines = csvText.trim().split('\n');
          const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase());
          const idx = {
            id: headers.indexOf('id'),
            brand: headers.indexOf('brand'),
            name: headers.indexOf('name'),
            price: headers.indexOf('price'),
            imageLink: headers.indexOf('image_link'),
            productLink: headers.indexOf('product_link'),
            websiteLink: headers.indexOf('website_link'),
            rating: headers.indexOf('rating'),
            category: headers.indexOf('category'),
            productType: headers.indexOf('product_type'),
          };
          const parsed = lines
            .slice(1)
            .map((line) => {
              const values = parseCsvRow(line);
              const brand = (values[idx.brand] || '').trim();
              const name = (values[idx.name] || '').trim();
              const productLink = (values[idx.productLink] || '').trim();
              const websiteLink = (values[idx.websiteLink] || '').trim();
              const image_link = normalizeImageUrl(values[idx.imageLink], productLink) || '';
              const price = normalizeProductPrice(values[idx.price]);
              const rating = Number((values[idx.rating] || '').replace(/[^0-9.]/g, ''));
              return {
                id: (values[idx.id] || '').trim() || `${brand}-${name}`,
                brand,
                name,
                price,
                image_link,
                product_link: productLink,
                website_link: websiteLink,
                rating: Number.isFinite(rating) ? rating : undefined,
                category: (values[idx.category] || '').trim(),
                product_type: (values[idx.productType] || '').trim(),
                source: 'output_csv',
              } as CosmeticsProduct;
            })
            .filter((p) => p.brand && p.name && !isCorruptProductName(p.name));
          productsFromSource = parsed;
          sourceCounts.output_csv = parsed.length;
        }

        const shadeResponse = await fetch('/data/allShades.csv');
        const shadesCsvText = await shadeResponse.text();
        const shadeLines = shadesCsvText.trim().split('\n');
        const shadeHeaders = parseCsvRow(shadeLines[0]).map(h => h.toLowerCase());

        const getShadeIdx = (...keys: string[]) => {
          for (const key of keys) {
            const idx = shadeHeaders.findIndex(h => h === key || h.includes(key));
            if (idx >= 0) return idx;
          }
          return -1;
        };

        const sIdx = {
          brand: getShadeIdx('brand'),
          product: getShadeIdx('product'),
          hex: getShadeIdx('hex'),
        };

        const shadeMap = new Map<string, string[]>();
        shadeLines.slice(1).forEach((line) => {
          const values = parseCsvRow(line);
          const brand = (values[sIdx.brand] || '').trim();
          const product = (values[sIdx.product] || '').trim();
          const hex = (values[sIdx.hex] || '').trim();
          if (!brand || !product || !/^#[0-9A-F]{6}$/i.test(hex)) return;
          const key = toProductKey(brand, product);
          const existing = shadeMap.get(key) || [];
          existing.push(hex);
          shadeMap.set(key, existing);
        });

        const finalProducts = productsFromSource.map((p) => ({
            ...p,
            hexCandidates: shadeMap.get(toProductKey(p.brand, p.name)) || [],
          }));
        setAllProducts(finalProducts);
        setSourceSummary(sourceCounts);
      } catch (error) {
        console.error('Failed to load cosmetics dataset', error);
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const retailers = [
    { value: 'all', label: 'All Retailers' },
    { value: 'ulta', label: 'Ulta Beauty' },
    { value: 'sephora', label: 'Sephora' },
    { value: 'nordstrom', label: 'Nordstrom' },
    { value: 'clinique', label: 'Clinique' },
    { value: 'chanel', label: 'Chanel' },
    { value: 'maccosmetics', label: 'MAC Cosmetics' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'other', label: 'Other Stores' },
  ];

  const categories = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.product_type) set.add(p.product_type);
    });
    return Array.from(set).sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let data = [...allProducts];
    const userPigment = analysisHex ? createPigmentColor(analysisHex) : null;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter((p) =>
        p.brand.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (p.product_type || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      data = data.filter((p) => (p.product_type || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    if (retailerFilter !== 'all') {
      data = data.filter((p) => {
        const url = `${p.product_link || ''} ${p.website_link || ''}`.toLowerCase();
        if (retailerFilter === 'other') {
          return !url.includes('ulta') &&
            !url.includes('sephora') &&
            !url.includes('amazon') &&
            !url.includes('nordstrom') &&
            !url.includes('clinique') &&
            !url.includes('chanel') &&
            !url.includes('maccosmetics') &&
            !url.includes('mac-cosmetics');
        }
        if (retailerFilter === 'maccosmetics') {
          return url.includes('maccosmetics') || url.includes('mac-cosmetics');
        }
        return url.includes(retailerFilter);
      });
    }

    if (userPigment) {
      const scored = data
        .map((p) => {
          const candidates = p.hexCandidates || [];
          if (candidates.length === 0) {
            return { ...p, relevanceScore: 0 };
          }
          let bestScore = 0;
          for (const hex of candidates) {
            const score = calculatePigmentMatch(userPigment, createPigmentColor(hex));
            if (score > bestScore) bestScore = score;
          }
          return { ...p, relevanceScore: bestScore };
        })
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      // If there are no shade-linked matches, keep original results.
      if (scored.length > 0) {
        data = scored;
      }
    }

    switch (sortBy) {
      case 'price_low':
        data.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
        break;
      case 'price_high':
        data.sort((a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY));
        break;
      case 'rating':
        data.sort((a, b) => (b.rating ?? Number.NEGATIVE_INFINITY) - (a.rating ?? Number.NEGATIVE_INFINITY));
        break;
      case 'name':
      default:
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    if (userPigment) {
      // Keep relevance as primary; apply selected sort only as a tiebreaker.
      data.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    return data.slice(0, MAX_CARDS);
  }, [allProducts, searchTerm, categoryFilter, retailerFilter, sortBy, analysisHex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading cosmetics products...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={retailerFilter} onValueChange={setRetailerFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Retailer" />
          </SelectTrigger>
          <SelectContent>
            {retailers.map((retailer) => (
              <SelectItem key={retailer.value} value={retailer.value}>
                {retailer.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline" className="flex items-center justify-center">
          {filteredProducts.length} shown (max {MAX_CARDS})
        </Badge>
      </div>

      {Object.keys(sourceSummary).length > 0 && (
        <div className="text-xs text-muted-foreground">
          Sources: {Object.entries(sourceSummary).map(([k, v]) => `${k}: ${v}`).join(' | ')}
        </div>
      )}

      {analysisHex && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 rounded border" style={{ backgroundColor: analysisHex }} />
          <span>Showing most relevant products for your analysis: {describeSkinTone(analysisHex).name}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <Card key={`${product.id}-${product.name}`} className="group bg-white shadow hover:shadow-xl transition-all duration-300 overflow-hidden border-0">
            <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src={product.image_link || PLACEHOLDER_IMAGE}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
              {product.product_type && (
                <Badge className="absolute top-2 left-2 bg-white/90 text-gray-800 text-xs backdrop-blur-sm">
                  {product.product_type}
                </Badge>
              )}
            </div>

            <CardContent className="p-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium truncate">{product.brand}</div>
                <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                <p className="text-xs text-muted-foreground">Store: {getStoreFromUrl(product.product_link || product.website_link)}</p>
                {analysisHex && typeof product.relevanceScore === 'number' && product.relevanceScore > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Match relevance: {Math.round(product.relevanceScore)}%
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  {typeof product.price === 'number' ? (
                    <div className="text-base font-bold">${product.price.toFixed(2)}</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Price unavailable</div>
                  )}
                  {typeof product.rating === 'number' && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-muted-foreground">{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full mt-2"
                  variant="outline"
                  disabled
                >
                  External links disabled
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
};

export default CosmeticsBrowser;
