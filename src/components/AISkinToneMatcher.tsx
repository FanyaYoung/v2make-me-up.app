import React, { useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Camera, Upload, Loader2, ExternalLink, Eye, BookmarkPlus } from 'lucide-react';
import { createPigmentColor, createLightFromDark, calculatePigmentMatch, PigmentColor } from '@/lib/pigmentMixing';
import { describeSkinTone } from '@/lib/skinToneDescription';
import { optimizeImageForAnalysis } from '@/lib/imageOptimization';
import { loadProductMetadataMap, parseCsvRow, normalizeImageUrl, ProductMetadata, makeProductKey } from '@/lib/productMetadata';
import { PigmentColorDisplay } from './PigmentColorDisplay';
import { useAuth } from '@/hooks/useAuth';
import { refreshFoundationMatchesPricing, getProductPricingSnapshot } from '@/lib/livePricing';
import { PriceFreshness, type PriceSource } from '@/components/PriceFreshness';
import { trackUserActivity } from '@/lib/activityTracking';
import { openExternalUrl } from '@/lib/externalNavigation';
import { inferAffiliateProvider } from '@/lib/affiliate';

const PLACEHOLDER_IMAGE = '/placeholder.svg';
const RETAILER_OPTIONS = ['Amazon', 'Ulta Beauty', 'Sephora', 'MAC', "Macy's", 'Walmart', 'Nordstrom', 'Target'] as const;
const withFallbackImage = (src: string | undefined | null) => {
  return (src && src.trim()) || PLACEHOLDER_IMAGE;
};
const normalizeImageCandidates = (candidates: Array<string | undefined | null>) =>
  [...new Set(candidates.map((candidate) => candidate?.trim()).filter((candidate): candidate is string => !!candidate && candidate !== PLACEHOLDER_IMAGE))];

const buildImageCandidates = (
  imageSources: Array<string | undefined | null>,
  productUrls: Array<string | undefined | null>,
) => {
  const candidates: string[] = [];

  imageSources.forEach((imageSource) => {
    productUrls.forEach((productUrl) => {
      const normalized = normalizeImageUrl(imageSource || undefined, productUrl || undefined);
      if (normalized) candidates.push(normalized);
    });

    if (imageSource?.startsWith('http://') || imageSource?.startsWith('https://')) {
      candidates.push(imageSource);
    }
  });

  return normalizeImageCandidates(candidates);
};

const advanceImageFallback = (img: HTMLImageElement, candidates?: string[]) => {
  const normalizedCandidates = normalizeImageCandidates(candidates || []);
  const currentIndex = Number(img.dataset.imageIndex || '0');
  const nextIndex = currentIndex + 1;

  if (nextIndex < normalizedCandidates.length) {
    img.dataset.imageIndex = String(nextIndex);
    img.src = normalizedCandidates[nextIndex];
    return true;
  }

  img.dataset.imageIndex = '0';
  img.src = PLACEHOLDER_IMAGE;
  return false;
};

const ANALYSIS_TIMEOUT_MS = 45000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Analysis timed out. Please try a clearer, smaller photo.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const getStoreFromUrl = (url?: string) => {
  if (!url) return 'Retailer';
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('ulta')) return 'Ulta Beauty';
    if (host.includes('sephora')) return 'Sephora';
    if (host.includes('amazon')) return 'Amazon';
    if (host.includes('maccosmetics')) return 'MAC';
    if (host.includes('macys')) return "Macy's";
    if (host.includes('walmart')) return 'Walmart';
    if (host.includes('nordstrom')) return 'Nordstrom';
    if (host.includes('target')) return 'Target';
    return host.replace('www.', '');
  } catch {
    return 'Retailer';
  }
};

const getWebsiteFromUrl = (url?: string) => {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
};

const resolveShopDestinationUrl = (product: {
  affiliateUrl?: string;
  url?: string;
}) => {
  const candidates = [product.url, product.affiliateUrl];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const value = candidate.trim();

    try {
      return new URL(value).toString();
    } catch {
      if (value.startsWith('//')) return `https:${value}`;
    }
  }

  return '';
};

const formatAvailabilityStatus = (value?: string) => {
  if (!value) return 'Availability not confirmed';
  switch (value.toLowerCase()) {
    case 'in_stock':
      return 'In stock online';
    case 'available':
      return 'Available online';
    case 'out_of_stock':
      return 'Currently out of stock';
    case 'unknown':
      return 'Availability not confirmed';
    default:
      return value.replace(/_/g, ' ');
  }
};

const matchesPreferredRetailer = (
  shade: { url?: string; retailer?: string; brand?: string; product?: string },
  selectedRetailers: string[],
) => {
  if (!selectedRetailers.length) return true;
  const retailer = (shade.retailer || getStoreFromUrl(shade.url)).toLowerCase();
  const context = `${shade.brand || ''} ${shade.product || ''}`.toLowerCase();

  return selectedRetailers.some((selected) => {
    const normalized = selected.toLowerCase();
    if (retailer === normalized) return true;
    if (retailer.includes(normalized) || normalized.includes(retailer)) return true;
    if (normalized === 'mac' && (retailer.includes('mac') || context.includes('mac'))) return true;
    return false;
  });
};

interface PigmentMix {
  White: number;
  CadmiumRed: number;
  CadmiumYellow: number;
  UltramarineBlue: number;
  BurntUmber: number;
}

interface ColorAnalysis {
  h: number;
  s: number;
  l: number;
  mix: PigmentMix;
}

interface FoundationMatch {
  brand: string;
  product: string;
  shade_name: string;
  hex: string;
  undertone: string;
  url: string;
  img: string;
  imageCandidates?: string[];
  score: number;
  pigmentColor: PigmentColor;
  price?: number;
  store?: string;
  website?: string;
  affiliateUrl?: string;
  priceCheckedAt?: string;
  priceSource?: PriceSource;
  availabilityStatus?: string;
}

interface ShadeData {
  brand: string;
  product: string;
  url: string;
  description: string;
  imgSrc: string;
  imageCandidates: string[];
  imgAlt: string;
  name: string;
  specific: string;
  hex: string;
  hue: string;
  sat: string;
  lightness: string;
  price?: number;
  retailer?: string;
}

type BrandPair = { light: FoundationMatch; dark: FoundationMatch };

export const AISkinToneMatcher = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [lightestResult, setLightestResult] = useState<{ hex: string; rgb: [number, number, number]; analysis: ColorAnalysis; pigmentColor: PigmentColor } | null>(null);
  const [midResult, setMidResult] = useState<{ hex: string; rgb: [number, number, number]; analysis: ColorAnalysis; pigmentColor: PigmentColor } | null>(null);
  const [darkestResult, setDarkestResult] = useState<{ hex: string; rgb: [number, number, number]; analysis: ColorAnalysis; pigmentColor: PigmentColor } | null>(null);
  const [showDarkest, setShowDarkest] = useState(true);
  const [brandPairs, setBrandPairs] = useState<Array<{ light: FoundationMatch; dark: FoundationMatch }>>([]);
  const [shadeDatabase, setShadeDatabase] = useState<ShadeData[]>([]);
  const [shadeDatabaseLoading, setShadeDatabaseLoading] = useState(false);
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load CSV database on mount
  React.useEffect(() => {
    void loadShadeDatabase();
  }, []);

  React.useEffect(() => {
    if (!user) return;
    void trackUserActivity(user.id, 'alpha_app_opened', {
      surface: 'ai_skin_tone_matcher',
    });
  }, [user]);

  // Setup video stream when camera is started
  React.useEffect(() => {
    if (stream && videoRef.current && isCamera) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        toast({
          title: "Camera Error",
          description: "Failed to start video playback",
          variant: "destructive"
        });
        stopCamera();
      });
    }
  }, [stream, isCamera]);

  const isValidHexColor = (value: unknown): value is string =>
    typeof value === 'string' && /^#?[0-9A-Fa-f]{6}$/.test(value);

  const normalizeHexColor = (value: string) =>
    value.startsWith('#') ? value.toUpperCase() : `#${value.toUpperCase()}`;

  const loadShadeDatabase = useCallback(async () => {
    setShadeDatabaseLoading(true);
    try {
      const productMetadataMap = await loadProductMetadataMap();

      const response = await fetch('/data/allShades.csv');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase());
      const getIdx = (...keys: string[]) => {
        for (const k of keys) {
          const idx = headers.findIndex(h => h === k || h.includes(k));
          if (idx >= 0) return idx;
        }
        return -1;
      };
      const idx = {
        brand: getIdx('brand'),
        product: getIdx('product'),
        url: getIdx('url', 'product_url'),
        description: getIdx('description'),
        imgSrc: getIdx('imgsrc', 'image_url', 'image'),
        imgAlt: getIdx('imgalt'),
        name: getIdx('name', 'shade_name'),
        specific: getIdx('specific'),
        hex: getIdx('hex'),
        hue: getIdx('hue'),
        sat: getIdx('sat'),
        lightness: getIdx('lightness'),
        price: getIdx('price', 'cost'),
        retailer: getIdx('retailer', 'store'),
      };
      
      const shades: ShadeData[] = lines.slice(1).map(line => {
        const values = parseCsvRow(line);
        const parsedPrice = idx.price >= 0 ? Number(String(values[idx.price] || '').replace(/[^0-9.]/g, '')) : NaN;
        const brand = values[idx.brand] || values[0] || '';
        const product = values[idx.product] || values[1] || '';
        const metadataKey = makeProductKey(brand, product);
        const enriched = productMetadataMap.get(metadataKey);
        const baseUrl = values[idx.url] || values[2] || '';
        const enrichedUrl = enriched?.productUrl || '';
        const resolvedUrl = enrichedUrl || baseUrl;
        const baseImg = values[idx.imgSrc] || values[4] || '';
        const imageCandidates = buildImageCandidates(
          [enriched?.imageUrl, baseImg],
          [resolvedUrl, baseUrl, enriched?.websiteLink],
        );
        const resolvedImg = imageCandidates[0] || '';

        return {
          brand,
          product,
          url: resolvedUrl,
          description: values[idx.description] || values[3] || '',
          imgSrc: resolvedImg || '',
          imageCandidates,
          imgAlt: values[idx.imgAlt] || values[5] || '',
          name: values[idx.name] || values[6] || '',
          specific: values[idx.specific] || values[7] || '',
          hex: values[idx.hex] || values[9] || '',
          hue: values[idx.hue] || values[10] || '',
          sat: values[idx.sat] || values[11] || '',
          lightness: values[idx.lightness] || values[12] || '',
          price: Number.isFinite(parsedPrice) ? parsedPrice : enriched?.price,
          retailer: values[idx.retailer] || enriched?.retailer,
        };
      }).filter(shade => shade.hex && shade.hex.startsWith('#'));
      
      setShadeDatabase(shades);
      console.log(`Loaded ${shades.length} shades from database`);
      return shades;
    } catch (error) {
      console.error('Failed to load shade database:', error);
      toast({
        title: "Database Load Error",
        description: "Could not load foundation database. Some features may not work.",
        variant: "destructive"
      });
      return [];
    } finally {
      setShadeDatabaseLoading(false);
    }
  }, [toast]);

  const analyzeImageLocally = async (imageDataUrl: string) => {
    const image = new Image();
    image.src = imageDataUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not read the selected image.'));
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Image analysis is not available in this browser.');
    }

    const maxDimension = 500;
    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if (width > height && width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    const { data } = ctx.getImageData(0, 0, width, height);
    const pixels: Array<{ hex: string; lightness: number }> = [];
    const sampleSize = 1000;
    const totalPixels = width * height;
    const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / sampleSize)));

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        if (index + 3 >= data.length) continue;

        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];

        if (a < 200) continue;
        if (g > r * 1.2 && g > b * 1.2 && g > 80) continue;
        if (b > r * 1.2 && b > g * 1.2 && b > 80) continue;

        const [h, s, l] = rgbToHsl(r, g, b);
        if (s < 8 || l < 8 || l > 96) continue;
        if (h < 0 || h > 50) continue;

        pixels.push({
          hex: rgbToHex(r, g, b),
          lightness: l,
        });
      }
    }

    if (pixels.length < 10) {
      throw new Error('Try a clearer, well-lit photo with more visible skin.');
    }

    pixels.sort((a, b) => a.lightness - b.lightness);
    const outlierCount = Math.min(Math.floor(pixels.length * 0.05), Math.floor(pixels.length / 4));
    const relevantPixels = pixels.slice(outlierCount, pixels.length - outlierCount);
    if (relevantPixels.length === 0) {
      throw new Error('Try a clearer, well-lit photo with more visible skin.');
    }

    const darkest = relevantPixels[Math.max(0, Math.floor(relevantPixels.length * 0.05))];
    const lightest = relevantPixels[Math.min(relevantPixels.length - 1, Math.floor(relevantPixels.length * 0.95))];

    return {
      lightest_hex: lightest.hex,
      darkest_hex: darkest.hex,
      source: 'local' as const,
    };
  };

  const resolveSkinToneAnalysis = async (optimizedImage: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('analyze-skin-tone', {
          body: { imageBase64: optimizedImage, analysisType: 'image' }
        }),
        ANALYSIS_TIMEOUT_MS
      );

      if (error) throw error;

      const lightestHex = isValidHexColor(data?.lightest_hex) ? normalizeHexColor(data.lightest_hex) : null;
      const darkestHex = isValidHexColor(data?.darkest_hex) ? normalizeHexColor(data.darkest_hex) : null;

      if (!lightestHex || !darkestHex) {
        throw new Error('Skin analysis returned invalid color data.');
      }

      return {
        lightest_hex: lightestHex,
        darkest_hex: darkestHex,
        source: 'edge' as const,
      };
    } catch (error) {
      console.warn('Falling back to local skin tone analysis', error);
      const localResult = await analyzeImageLocally(optimizedImage);
      toast({
        title: "Using Local Analysis",
        description: "The cloud skin analysis service was unavailable, so the app used on-device analysis instead."
      });
      return localResult;
    }
  };

  const colorDistance = (hex1: string, hex2: string): number => {
    // Use pigment-based match (subtractive model) instead of plain RGB distance.
    // Lower "distance" is better.
    const toneA = createPigmentColor(hex1);
    const toneB = createPigmentColor(hex2);
    return 100 - calculatePigmentMatch(toneA, toneB);
  };

  const findMatchingShades = async (targetHex: string, limit: number = 5): Promise<FoundationMatch[]> => {
    if (shadeDatabase.length === 0) return [];

    const matches = shadeDatabase.map(shade => ({
      ...shade,
      distance: colorDistance(targetHex, shade.hex)
    })).sort((a, b) => a.distance - b.distance).slice(0, limit);

    const foundationMatches: FoundationMatch[] = [];

    for (const match of matches) {
      const productPigmentColor = createPigmentColor(match.hex);
      const baseMatch: FoundationMatch = {
        brand: match.brand,
        product: match.product,
        shade_name: match.name || match.description,
        hex: match.hex,
        undertone: '',
        url: match.url,
        img: withFallbackImage(match.imgSrc),
        imageCandidates: match.imageCandidates,
        score: 100 - (match.distance / 441.67) * 100,
        pigmentColor: productPigmentColor,
        price: match.price,
        store: getStoreFromUrl(match.url),
        website: getWebsiteFromUrl(match.url),
        affiliateUrl: undefined,
      };

      foundationMatches.push(baseMatch);
    }

    return foundationMatches;
  };

  const hydrateBrandPairs = async (pairs: BrandPair[]): Promise<BrandPair[]> => {
    if (!pairs.length) return pairs;

    try {
      const flattened = pairs.flatMap((pair) => [pair.light, pair.dark]);
      const refreshed = await refreshFoundationMatchesPricing(
        flattened.map((product) => ({
          id: `${product.brand}-${product.shade_name}`,
          brand: product.brand,
          product: product.product,
          shade: product.shade_name,
          price: product.price ?? 0,
          rating: 0,
          reviewCount: 0,
          availability: {
            online: true,
            inStore: false,
            readyForPickup: false,
            nearbyStores: [],
          },
          matchPercentage: Math.round(product.score),
          undertone: product.undertone || 'neutral',
          coverage: 'unknown',
          finish: 'unknown',
          imageUrl: product.img || PLACEHOLDER_IMAGE,
          productUrl: product.url,
          retailer: product.store,
        }))
      );

      const refreshedPairs: BrandPair[] = [];
      for (let index = 0; index < pairs.length; index++) {
        const light = refreshed[index * 2];
        const dark = refreshed[index * 2 + 1];
        const currentPair = pairs[index];
        if (!light || !dark) {
          refreshedPairs.push(currentPair);
          continue;
        }

        refreshedPairs.push({
          light: {
            ...currentPair.light,
            img: buildImageCandidates(
              [light.imageUrl, currentPair.light.img, ...(currentPair.light.imageCandidates || [])],
              [light.productUrl, currentPair.light.url],
            )[0] || currentPair.light.img,
            imageCandidates: buildImageCandidates(
              [light.imageUrl, currentPair.light.img, ...(currentPair.light.imageCandidates || [])],
              [light.productUrl, currentPair.light.url],
            ),
            url: light.productUrl || currentPair.light.url,
            affiliateUrl: light.affiliateUrl || currentPair.light.affiliateUrl,
            price: typeof light.price === 'number' && light.price > 0 ? light.price : currentPair.light.price,
            store: light.retailer || currentPair.light.store,
            website: getWebsiteFromUrl(light.productUrl || currentPair.light.url),
            availabilityStatus: light.availabilityStatus || currentPair.light.availabilityStatus,
            priceCheckedAt: light.priceCheckedAt || currentPair.light.priceCheckedAt,
            priceSource: light.priceSource || currentPair.light.priceSource,
          },
          dark: {
            ...currentPair.dark,
            img: buildImageCandidates(
              [dark.imageUrl, currentPair.dark.img, ...(currentPair.dark.imageCandidates || [])],
              [dark.productUrl, currentPair.dark.url],
            )[0] || currentPair.dark.img,
            imageCandidates: buildImageCandidates(
              [dark.imageUrl, currentPair.dark.img, ...(currentPair.dark.imageCandidates || [])],
              [dark.productUrl, currentPair.dark.url],
            ),
            url: dark.productUrl || currentPair.dark.url,
            affiliateUrl: dark.affiliateUrl || currentPair.dark.affiliateUrl,
            price: typeof dark.price === 'number' && dark.price > 0 ? dark.price : currentPair.dark.price,
            store: dark.retailer || currentPair.dark.store,
            website: getWebsiteFromUrl(dark.productUrl || currentPair.dark.url),
            availabilityStatus: dark.availabilityStatus || currentPair.dark.availabilityStatus,
            priceCheckedAt: dark.priceCheckedAt || currentPair.dark.priceCheckedAt,
            priceSource: dark.priceSource || currentPair.dark.priceSource,
          },
        });
      }

      return refreshedPairs;
    } catch (error) {
      console.warn('Could not hydrate recommendation pairs with live pricing', error);
      return pairs;
    }
  };

  const findBrandPairs = async (lightHex: string, darkHex: string, limit: number = 4): Promise<BrandPair[]> => {
    if (shadeDatabase.length === 0) return [];

    const candidateShades = shadeDatabase.filter((shade) => matchesPreferredRetailer(shade, selectedRetailers));

    const brandGroups = candidateShades.reduce((acc, shade) => {
      if (!acc[shade.brand]) acc[shade.brand] = [];
      acc[shade.brand].push(shade);
      return acc;
    }, {} as Record<string, ShadeData[]>);

    const pairs: Array<{ light: FoundationMatch; dark: FoundationMatch; avgDistance: number }> = [];

    for (const [brand, shades] of Object.entries(brandGroups)) {
      if (shades.length < 2) continue;

      const lightMatches = shades
        .map(shade => ({
          shade,
          distance: colorDistance(lightHex, shade.hex)
        }))
        .sort((a, b) => a.distance - b.distance);

      const darkMatches = shades
        .map(shade => ({
          shade,
          distance: colorDistance(darkHex, shade.hex)
        }))
        .sort((a, b) => a.distance - b.distance);

      const bestLight = lightMatches.find(m => m.shade.imgSrc) ?? lightMatches[0];
      const bestDark = darkMatches.find(m => m.shade.imgSrc) ?? darkMatches[0];

      if (bestLight && bestDark) {
        const darkMatch = bestDark.shade;
        
        // Create dark color first, then derive light from it
        const darkPigmentColor = createPigmentColor(darkMatch.hex);
        const lightPigmentColor = createLightFromDark(darkPigmentColor);
        
        const lightMatch = bestLight.shade;

        // If either side has no usable image URL, skip this pair and try other brands.
        if (!lightMatch.imgSrc || !darkMatch.imgSrc) continue;

        // Use CSV image URLs as base
        const light: FoundationMatch = {
          brand: lightMatch.brand,
          product: lightMatch.product,
          shade_name: lightMatch.name || lightMatch.description,
          hex: lightMatch.hex,
          undertone: '',
          url: lightMatch.url,
          img: withFallbackImage(lightMatch.imgSrc),
          imageCandidates: lightMatch.imageCandidates,
          score: 100 - (bestLight.distance / 441.67) * 100,
          pigmentColor: lightPigmentColor,
          price: lightMatch.price,
          store: getStoreFromUrl(lightMatch.url),
          website: getWebsiteFromUrl(lightMatch.url),
          affiliateUrl: undefined,
          availabilityStatus: undefined,
        };

        const dark: FoundationMatch = {
          brand: darkMatch.brand,
          product: darkMatch.product,
          shade_name: darkMatch.name || darkMatch.description,
          hex: darkMatch.hex,
          undertone: '',
          url: darkMatch.url,
          img: withFallbackImage(darkMatch.imgSrc),
          imageCandidates: darkMatch.imageCandidates,
          score: 100 - (bestDark.distance / 441.67) * 100,
          pigmentColor: darkPigmentColor,
          price: darkMatch.price,
          store: getStoreFromUrl(darkMatch.url),
          website: getWebsiteFromUrl(darkMatch.url),
          affiliateUrl: undefined,
          availabilityStatus: undefined,
        };

        const avgDistance = (bestLight.distance + bestDark.distance) / 2;
        pairs.push({ light, dark, avgDistance });
      }
    }

    const selectedPairs = pairs
      .sort((a, b) => a.avgDistance - b.avgDistance)
      .slice(0, limit)
      .map(({ light, dark }) => ({ light, dark }));

    return hydrateBrandPairs(selectedPairs);
  };

  const applyPricingSnapshot = async (match: FoundationMatch): Promise<FoundationMatch> => {
    try {
      const snapshot = await getProductPricingSnapshot(match.brand, match.product);
      return {
        ...match,
        price: snapshot.price ?? match.price,
        priceCheckedAt: snapshot.checkedAt,
        priceSource: snapshot.source as PriceSource,
      };
    } catch (error) {
      console.warn('Pricing snapshot failed', error);
      return { ...match, priceSource: match.price ? 'catalog' : 'unavailable' };
    }
  };

  const hydratePairsWithLivePricing = async (
    pairs: Array<{ light: FoundationMatch; dark: FoundationMatch; avgDistance?: number }>
  ) =>
    Promise.all(
      pairs.map(async (pair) => ({
        ...pair,
        light: await applyPricingSnapshot(pair.light),
        dark: await applyPricingSnapshot(pair.dark),
      }))
    );

  const replacePairShadeWithAlternate = (pairIndex: number, side: 'light' | 'dark', targetHex: string) => {
    setBrandPairs(prev => {
      const current = prev[pairIndex];
      if (!current) return prev;

      const currentShade = side === 'light' ? current.light : current.dark;
      const alternates = shadeDatabase
        .filter(s => s.brand === currentShade.brand && s.hex !== currentShade.hex && !!s.imgSrc)
        .map(s => ({ shade: s, distance: colorDistance(targetHex, s.hex) }))
        .sort((a, b) => a.distance - b.distance);

      const best = alternates[0]?.shade;
      if (!best) return prev;

      const replacement: FoundationMatch = {
        brand: best.brand,
        product: best.product,
        shade_name: best.name || best.description,
        hex: best.hex,
        undertone: '',
        url: best.url,
        img: withFallbackImage(best.imgSrc),
        imageCandidates: best.imageCandidates,
        score: 100 - (alternates[0].distance / 441.67) * 100,
        pigmentColor: createPigmentColor(best.hex),
        price: best.price,
        store: best.retailer || getStoreFromUrl(best.url),
        website: getWebsiteFromUrl(best.url),
        affiliateUrl: undefined,
        priceCheckedAt: currentShade.priceCheckedAt,
        priceSource: currentShade.priceSource,
        availabilityStatus: currentShade.availabilityStatus,
      };

      const updated = [...prev];
      updated[pairIndex] = side === 'light'
        ? { ...current, light: replacement }
        : { ...current, dark: replacement };
      return updated;
    });
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const createMidTone = (light: PigmentColor, dark: PigmentColor): PigmentColor => {
    const [lr, lg, lb] = light.rgb;
    const [dr, dg, db] = dark.rgb;
    const mr = Math.round((lr + dr) / 2);
    const mg = Math.round((lg + dg) / 2);
    const mb = Math.round((lb + db) / 2);
    return createPigmentColor(rgbToHex(mr, mg, mb));
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  };

  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  const getPigmentMix = (r: number, g: number, b: number): ColorAnalysis => {
    const [h, s, l] = rgbToHsl(r, g, b);
    const mix: PigmentMix = { White: 0, CadmiumRed: 0, CadmiumYellow: 0, UltramarineBlue: 0, BurntUmber: 0 };
    
    // For darker tones (below beige ~50%), establish depth with burnt umber FIRST
    // Then add chromatic colors, and white LAST to lighten
    const isDark = l < 50;
    
    // Step 1: Establish base depth with burnt umber (for darker tones)
    if (isDark) {
      // Darker tones need burnt umber as foundation
      mix.BurntUmber = 100 - (l * 1.8); // More umber for darker tones
    } else {
      // Lighter tones use less umber
      mix.BurntUmber = (100 - l) * 0.4;
    }
    
    // Step 2: Add chromatic pigments (red/yellow for warmth, blue for cooling)
    const hueStrength = s * 0.8;
    let redComponent = 0;
    let yellowComponent = 0;

    if (h >= 0 && h <= 45) {
      redComponent = (45 - h) / 45 * hueStrength;
      yellowComponent = h / 45 * hueStrength;
    } else if (h > 315) {
      redComponent = ((360 - h) / 45) * hueStrength;
    }
    
    mix.CadmiumRed = redComponent * 0.7;
    mix.CadmiumYellow = yellowComponent * 0.7;
    mix.UltramarineBlue = (100 - s) * 0.25; // Blue to mute/cool
    
    // Step 3: Add white LAST to lighten (minimal for dark tones)
    if (isDark) {
      // For dark tones, add white sparingly at the end
      mix.White = l * 0.4;
    } else {
      // For light tones, white is more prominent
      mix.White = l * 1.2;
    }

    // Normalize to 100%
    const maxVal = Math.max(...Object.values(mix));
    if (maxVal > 0) {
      for (const key in mix) {
        mix[key as keyof PigmentMix] = (mix[key as keyof PigmentMix] / maxVal) * 100;
      }
    } else if (l === 0) {
      mix.BurntUmber = 100;
    } else if (l === 100) {
      mix.White = 100;
    }

    return { h, s, l, mix };
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamera(false);
  }, [stream]);

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      console.log('Starting camera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      console.log('Camera permission granted, setting stream...');
      setStream(mediaStream);
      setIsCamera(true);
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please ensure permissions are granted.",
        variant: "destructive"
      });
    } finally {
      setCameraLoading(false);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      setCurrentImage(imageData);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    optimizeImageForAnalysis(file)
      .then((optimized) => {
        setCurrentImage(optimized);
        stopCamera();
      })
      .catch((error) => {
        console.error('Failed to process image upload:', error);
        toast({
          title: "Image Error",
          description: "Could not process this photo. Please try another image.",
          variant: "destructive"
        });
      });
  };

  const analyzeImage = async () => {
    if (!currentImage) {
      toast({
        title: "No Image",
        description: "Please upload or capture an image first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setLoadingMessage("AI is analyzing the photo...");
    setShowDarkest(true);
    setBrandPairs([]);

    try {
      const optimizedImage = await optimizeImageForAnalysis(currentImage);
      const analysisResult = await resolveSkinToneAnalysis(optimizedImage);
      const lightestHex = analysisResult.lightest_hex;
      const darkestHex = analysisResult.darkest_hex;

      const availableShades = shadeDatabase.length > 0 ? shadeDatabase : await loadShadeDatabase();
      if (availableShades.length === 0) {
        throw new Error('Foundation shade database is still loading or unavailable. Please try again.');
      }

      const [rLight, gLight, bLight] = hexToRgb(lightestHex);
      const [rDark, gDark, bDark] = hexToRgb(darkestHex);

      const lightPigmentColor = createPigmentColor(lightestHex);
      const darkPigmentColor = createPigmentColor(darkestHex);
      const midPigmentColor = createMidTone(lightPigmentColor, darkPigmentColor);
      const [rMid, gMid, bMid] = midPigmentColor.rgb;

      setLightestResult({
        hex: lightestHex,
        rgb: [rLight, gLight, bLight],
        analysis: getPigmentMix(rLight, gLight, bLight),
        pigmentColor: lightPigmentColor
      });

      setMidResult({
        hex: midPigmentColor.hex,
        rgb: [rMid, gMid, bMid],
        analysis: getPigmentMix(rMid, gMid, bMid),
        pigmentColor: midPigmentColor
      });

      setDarkestResult({
        hex: darkestHex,
        rgb: [rDark, gDark, bDark],
        analysis: getPigmentMix(rDark, gDark, bDark),
        pigmentColor: darkPigmentColor
      });

      try {
        localStorage.setItem(
          'latest_skin_tone_analysis',
          JSON.stringify({
            lightHex: lightestHex,
            midHex: midPigmentColor.hex,
            darkHex: darkestHex,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (storageError) {
        console.warn('Could not persist latest skin tone analysis to localStorage', storageError);
      }

      // Match to product database - find brand pairs
      setLoadingMessage("Finding matching foundation pairs from brands...");
      
      const pairs = await findBrandPairs(lightestHex, darkestHex, 4);
      setBrandPairs(await hydratePairsWithLivePricing(pairs));

      if (pairs.length === 0) {
        toast({
          title: "Analysis Complete",
          description: selectedRetailers.length
            ? `No matching shades were found for ${selectedRetailers.join(', ')}. Try clearing or changing your retailer filters.`
            : "Skin tones were detected, but no image-backed brand pairs were available for this result."
        });
        return;
      }

      toast({
        title: "Analysis Complete",
        description: "Found matching foundation products!"
      });
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : "Failed to analyze image";

      toast({
        title: "Analysis Failed",
        description,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveShadeMatch = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save your shade matches",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!lightestResult || !darkestResult || brandPairs.length === 0) {
      toast({
        title: "No Analysis to Save",
        description: "Please complete a shade analysis first",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.from('saved_shade_matches').insert([{
        user_id: user.id,
        lightest_hex: lightestResult.hex,
        lightest_rgb: lightestResult.rgb as unknown as Json,
        lightest_pigment_mix: lightestResult.pigmentColor.pigmentMix as unknown as Json,
        darkest_hex: darkestResult.hex,
        darkest_rgb: darkestResult.rgb as unknown as Json,
        darkest_pigment_mix: darkestResult.pigmentColor.pigmentMix as unknown as Json,
        matched_products: brandPairs as unknown as Json,
        photo_url: currentImage
      }]);

      if (error) throw error;

      toast({
        title: "Saved Successfully",
        description: "Your shade match has been saved to your account"
      });
    } catch (error: unknown) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save shade match",
        variant: "destructive"
      });
    }
  };


  const handleShopShade = async (product: FoundationMatch) => {
    const destinationUrl = resolveShopDestinationUrl(product);
    if (!destinationUrl) {
      toast({
        title: "Link unavailable",
        description: "No retailer link is available for this shade yet.",
        variant: "destructive"
      });
      return;
    }

    const provider = inferAffiliateProvider(destinationUrl);
    const retailer = product.store || getStoreFromUrl(product.url);

    try {
      if (user) {
        void trackUserActivity(user.id, 'shade_shop_redirect_started', {
          source: 'ai_skin_tone_matcher',
          retailer,
          shade_name: product.shade_name,
        });
      }

      void supabase.functions.invoke('track-affiliate-click', {
        body: {
          provider,
          offerId: `${product.brand}-${product.product}-${product.shade_name}`,
          clickUrl: destinationUrl,
          userId: user?.id,
        },
      }).catch(() => null);

      await openExternalUrl(destinationUrl, { preferSameTab: true });

      if (user) {
        void trackUserActivity(user.id, 'shade_shop_redirect_completed', {
          source: 'ai_skin_tone_matcher',
          retailer,
          shade_name: product.shade_name,
        });
      }
    } catch (error: unknown) {
      if (user) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        await trackUserActivity(user.id, 'shade_shop_redirect_failed', {
          source: 'ai_skin_tone_matcher',
          retailer: product.store || getStoreFromUrl(product.url),
          reason: message,
        });
      }
      toast({
        title: "Unable to open retailer",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  };

  const PigmentBar = ({ label, percentage, color }: { label: string; percentage: number; color: string }) => (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground">{label}: {Math.round(percentage)}%</p>
      <div className="h-3 bg-muted rounded-full overflow-hidden mt-1">
        <div 
          className="h-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
    </div>
  );

  const ColorResultCard = ({ 
    title, 
    result
  }: { 
    title: string; 
    result: { hex: string; rgb: [number, number, number]; analysis: ColorAnalysis } | null;
  }) => {
    const shadeInfo = result ? describeSkinTone(result.hex) : null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && shadeInfo ? (
            <>
              <div 
                className="h-16 rounded-lg border-2 border-border"
                style={{ backgroundColor: result.hex }}
              />
              <div className="space-y-1 text-sm">
                <p>
                  Shade: <span className="font-semibold">{shadeInfo.name}</span>
                </p>
                <p className="text-muted-foreground">{shadeInfo.analysis}</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Results will appear here</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">AI Skin Tone Pigment Analyzer</h1>
        <p className="text-muted-foreground">
          Analyze a photo, match your shades, and shop them at your preferred retailer
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferred Retailers</CardTitle>
          <CardDescription>
            Limit recommendations to specific stores. Leave all unselected to search everywhere.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {RETAILER_OPTIONS.map((retailer) => {
            const active = selectedRetailers.includes(retailer);
            return (
              <Button
                key={retailer}
                type="button"
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedRetailers((current) =>
                    current.includes(retailer)
                      ? current.filter((item) => item !== retailer)
                      : [...current, retailer]
                  );
                }}
              >
                {retailer}
              </Button>
            );
          })}
          {selectedRetailers.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRetailers([])}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="photo" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="photo">Analyze Face Photo</TabsTrigger>
        </TabsList>

        <TabsContent value="photo" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {!isCamera && !currentImage && (
                <Card className="bg-muted/50 border-2 border-dashed border-border">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Take a Face Photo</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Position your face in good lighting for accurate skin tone analysis
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={startCamera}
                          disabled={loading}
                          size="lg"
                          className="w-full"
                        >
                          <Camera className="mr-2 h-5 w-5" />
                          Take Face Photo
                        </Button>
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          variant="outline"
                          size="lg"
                          className="w-full"
                        >
                          <Upload className="mr-2 h-5 w-5" />
                          Upload Photo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {cameraLoading && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Initializing camera...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isCamera && !cameraLoading && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Position Your Face
                    </CardTitle>
                    <CardDescription>
                      Center your face in the frame with good lighting for best results
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <video 
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ transform: 'scaleX(-1)' }}
                        className="w-full rounded-lg border-2 border-border"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-80 border-4 border-primary/50 rounded-full" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={takeSnapshot}
                        className="flex-1"
                        size="lg"
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        Capture Photo
                      </Button>
                      <Button 
                        onClick={stopCamera}
                        variant="outline"
                        size="lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentImage && !isCamera && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Photo Captured</CardTitle>
                    <CardDescription>
                      Review your photo and analyze to find matching foundations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <img 
                      src={currentImage} 
                      alt="Captured face" 
                      className="w-full rounded-lg border-2 border-border shadow-md"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={analyzeImage}
                        disabled={loading || shadeDatabaseLoading}
                        className="flex-1"
                        size="lg"
                      >
                        {loading || shadeDatabaseLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {loadingMessage || (shadeDatabaseLoading ? "Loading shade database..." : "Analyzing...")}
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-5 w-5" />
                            Analyze Face Photo
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => {
                          setCurrentImage(null);
                          setLightestResult(null);
                          setMidResult(null);
                          setDarkestResult(null);
                          setBrandPairs([]);
                        }}
                        variant="outline"
                        size="lg"
                      >
                        Retake
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-muted-foreground">{loadingMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ColorResultCard 
          title="Lightest/Target Tone" 
          result={lightestResult}
        />
        <ColorResultCard
          title="Final Mid Tone Match"
          result={midResult}
        />
        {showDarkest && (
          <ColorResultCard 
            title="Darkest/Contour Tone" 
            result={darkestResult}
          />
        )}
      </div>

      {/* Save Match Button */}
      {lightestResult && darkestResult && brandPairs.length > 0 && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <Button 
              onClick={saveShadeMatch}
              variant="default"
              size="lg"
              className="w-full"
            >
              <BookmarkPlus className="mr-2 h-5 w-5" />
              Save This Shade Match to My Account
            </Button>
          </CardContent>
        </Card>
      )}

      {brandPairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Foundation Pairs by Brand</CardTitle>
            <CardDescription>Light and dark shades from the same brand for base and contour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {brandPairs.map((pair, idx) => (
                <Card key={idx} className="overflow-hidden border-2 hover:border-primary transition-all">
                  <CardContent className="p-0">
                    {/* Brand Header */}
                    <div className="bg-muted p-3 border-b">
                      <Badge variant="secondary" className="text-xs mb-1">{pair.light.brand}</Badge>
                      <h4 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{pair.light.product}</h4>
                    </div>

                    {/* Light Shade with Image */}
                    <div className="p-3 border-b bg-background">
                      <p className="text-xs font-semibold text-primary mb-2">LIGHT SHADE</p>
                      <div className="h-32 bg-gradient-to-br from-background to-muted rounded-lg mb-2 flex items-center justify-center p-2">
                        <img 
                          src={pair.light.img} 
                          alt={pair.light.shade_name}
                          className="max-h-full max-w-full object-contain"
                          data-image-index="0"
                          onError={(e) => {
                            if (advanceImageFallback(e.currentTarget, pair.light.imageCandidates)) return;
                            const fallbackTarget = lightestResult?.hex || pair.light.hex;
                            replacePairShadeWithAlternate(idx, 'light', fallbackTarget);
                          }}
                        />
                      </div>
                      <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem] mb-2">{pair.light.shade_name}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Brand: {pair.light.brand}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Store: {pair.light.store || getStoreFromUrl(pair.light.url)}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Website: {pair.light.website || getWebsiteFromUrl(pair.light.url) || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Availability: {formatAvailabilityStatus(pair.light.availabilityStatus)}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border-2 border-border"
                            style={{ backgroundColor: pair.light.hex }}
                          />
                          <span className="text-xs text-muted-foreground">{describeSkinTone(pair.light.hex).name}</span>
                        </div>
                        <span className="flex flex-col items-end">
                          <span className="text-sm font-bold text-primary">
                            {typeof pair.light.price === 'number' ? `$${pair.light.price.toFixed(2)}` : 'Price unavailable'}
                          </span>
                          <PriceFreshness
                            checkedAt={pair.light.priceCheckedAt}
                            source={pair.light.priceSource ?? (pair.light.price ? 'catalog' : 'unavailable')}
                          />
                        </span>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => void handleShopShade(pair.light)}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Shop Light Shade
                      </Button>
                    </div>

                    {/* Dark Shade with Image */}
                    <div className="p-3 border-b bg-background">
                      <p className="text-xs font-semibold text-primary mb-2">DARK SHADE (CONTOUR)</p>
                      <div className="h-32 bg-gradient-to-br from-background to-muted rounded-lg mb-2 flex items-center justify-center p-2">
                        <img 
                          src={pair.dark.img} 
                          alt={pair.dark.shade_name}
                          className="max-h-full max-w-full object-contain"
                          data-image-index="0"
                          onError={(e) => {
                            if (advanceImageFallback(e.currentTarget, pair.dark.imageCandidates)) return;
                            const fallbackTarget = darkestResult?.hex || pair.dark.hex;
                            replacePairShadeWithAlternate(idx, 'dark', fallbackTarget);
                          }}
                        />
                      </div>
                      <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem] mb-2">{pair.dark.shade_name}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Brand: {pair.dark.brand}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Store: {pair.dark.store || getStoreFromUrl(pair.dark.url)}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Website: {pair.dark.website || getWebsiteFromUrl(pair.dark.url) || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Availability: {formatAvailabilityStatus(pair.dark.availabilityStatus)}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border-2 border-border"
                            style={{ backgroundColor: pair.dark.hex }}
                          />
                          <span className="text-xs text-muted-foreground">{describeSkinTone(pair.dark.hex).name}</span>
                        </div>
                        <span className="flex flex-col items-end">
                          <span className="text-sm font-bold text-primary">
                            {typeof pair.dark.price === 'number' ? `$${pair.dark.price.toFixed(2)}` : 'Price unavailable'}
                          </span>
                          <PriceFreshness
                            checkedAt={pair.dark.priceCheckedAt}
                            source={pair.dark.priceSource ?? (pair.dark.price ? 'catalog' : 'unavailable')}
                          />
                        </span>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => void handleShopShade(pair.dark)}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Shop Dark Shade
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="p-3 space-y-2 bg-muted/50">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          navigate('/virtual-tryon', {
                            state: {
                              products: brandPairs.map(p => ({
                                brand: p.light.brand,
                                lightProduct: {
                                  brand: p.light.brand,
                                  product: p.light.product,
                                  shade: p.light.shade_name,
                                  hex: p.light.hex,
                                  imgSrc: p.light.img,
                                  imageUrl: p.light.img,
                                  imageCandidates: p.light.imageCandidates,
                                  url: p.light.url,
                                  price: p.light.price
                                },
                                darkProduct: {
                                  brand: p.dark.brand,
                                  product: p.dark.product,
                                  shade: p.dark.shade_name,
                                  hex: p.dark.hex,
                                  imgSrc: p.dark.img,
                                  imageUrl: p.dark.img,
                                  imageCandidates: p.dark.imageCandidates,
                                  url: p.dark.url,
                                  price: p.dark.price
                                }
                              }))
                            }
                          });
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Virtual Try-On
                      </Button>
                      <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                        Use the buttons above to visit each retailer directly. Referral tracking is applied when supported.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
