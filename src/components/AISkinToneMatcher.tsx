import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, Loader2, ShoppingCart, Eye, BookmarkPlus } from 'lucide-react';
import { createPigmentColor, createLightFromDark, calculatePigmentMatch, PigmentColor } from '@/lib/pigmentMixing';
import { describeSkinTone } from '@/lib/skinToneDescription';
import { optimizeImageForAnalysis } from '@/lib/imageOptimization';
import { loadProductMetadataMap, parseCsvRow, normalizeImageUrl, ProductMetadata, makeProductKey } from '@/lib/productMetadata';
import { PigmentColorDisplay } from './PigmentColorDisplay';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { refreshFoundationMatchesPricing } from '@/lib/livePricing';
import { trackUserActivity } from '@/lib/activityTracking';

const PLACEHOLDER_IMAGE = '/placeholder.svg';
const withFallbackImage = (src: string | undefined | null) => {
  return (src && src.trim()) || PLACEHOLDER_IMAGE;
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
    if (host.includes('walmart')) return 'Walmart';
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
  score: number;
  pigmentColor: PigmentColor;
  price?: number;
  store?: string;
  website?: string;
}

interface ShadeData {
  brand: string;
  product: string;
  url: string;
  description: string;
  imgSrc: string;
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

export const AISkinToneMatcher = () => {
  const { toast } = useToast();
  const { addToCart } = useCart();
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
  const [selectedProduct, setSelectedProduct] = useState<FoundationMatch | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load CSV database on mount
  React.useEffect(() => {
    loadShadeDatabase();
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

  const loadShadeDatabase = async () => {
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
        const resolvedImg = enriched?.imageUrl || normalizeImageUrl(baseImg, resolvedUrl);

        return {
          brand,
          product,
          url: resolvedUrl,
          description: values[idx.description] || values[3] || '',
          imgSrc: resolvedImg || '',
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
    } catch (error) {
      console.error('Failed to load shade database:', error);
      toast({
        title: "Database Load Error",
        description: "Could not load foundation database. Some features may not work.",
        variant: "destructive"
      });
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
        score: 100 - (match.distance / 441.67) * 100,
        pigmentColor: productPigmentColor,
        price: match.price,
        store: getStoreFromUrl(match.url),
        website: getWebsiteFromUrl(match.url),
      };

      foundationMatches.push(baseMatch);
    }

    return foundationMatches;
  };

  const findBrandPairs = async (lightHex: string, darkHex: string, limit: number = 4): Promise<Array<{ light: FoundationMatch; dark: FoundationMatch }>> => {
    if (shadeDatabase.length === 0) return [];

    const brandGroups = shadeDatabase.reduce((acc, shade) => {
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
          score: 100 - (bestLight.distance / 441.67) * 100,
          pigmentColor: lightPigmentColor,
          price: lightMatch.price,
          store: getStoreFromUrl(lightMatch.url),
          website: getWebsiteFromUrl(lightMatch.url),
        };

        const dark: FoundationMatch = {
          brand: darkMatch.brand,
          product: darkMatch.product,
          shade_name: darkMatch.name || darkMatch.description,
          hex: darkMatch.hex,
          undertone: '',
          url: darkMatch.url,
          img: withFallbackImage(darkMatch.imgSrc),
          score: 100 - (bestDark.distance / 441.67) * 100,
          pigmentColor: darkPigmentColor,
          price: darkMatch.price,
          store: getStoreFromUrl(darkMatch.url),
          website: getWebsiteFromUrl(darkMatch.url),
        };

        const avgDistance = (bestLight.distance + bestDark.distance) / 2;
        pairs.push({ light, dark, avgDistance });
      }
    }

    return pairs.sort((a, b) => a.avgDistance - b.avgDistance).slice(0, limit);
  };

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
        score: 100 - (alternates[0].distance / 441.67) * 100,
        pigmentColor: createPigmentColor(best.hex),
        price: best.price,
        store: best.retailer || getStoreFromUrl(best.url),
        website: getWebsiteFromUrl(best.url),
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
    let h = 0, s = 0, l = (max + min) / 2;

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

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamera(false);
  };

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
      const { data, error } = await withTimeout(
        supabase.functions.invoke('analyze-skin-tone', {
          body: { imageBase64: optimizedImage, analysisType: 'image' }
        }),
        ANALYSIS_TIMEOUT_MS
      );

      if (error) throw error;

      const [rDark, gDark, bDark] = hexToRgb(data.darkest_hex);
      
      // Create dark color first, then derive light from it
      const darkPigmentColor = createPigmentColor(data.darkest_hex);
      const lightPigmentColor = createLightFromDark(darkPigmentColor);
      const midPigmentColor = createMidTone(lightPigmentColor, darkPigmentColor);
      
      const [rLight, gLight, bLight] = lightPigmentColor.rgb;
      const [rMid, gMid, bMid] = midPigmentColor.rgb;

      setLightestResult({
        hex: lightPigmentColor.hex,
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
        hex: data.darkest_hex,
        rgb: [rDark, gDark, bDark],
        analysis: getPigmentMix(rDark, gDark, bDark),
        pigmentColor: darkPigmentColor
      });

      try {
        localStorage.setItem(
          'latest_skin_tone_analysis',
          JSON.stringify({
            lightHex: lightPigmentColor.hex,
            midHex: midPigmentColor.hex,
            darkHex: data.darkest_hex,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (storageError) {
        console.warn('Could not persist latest skin tone analysis to localStorage', storageError);
      }

      // Match to product database - find brand pairs
      setLoadingMessage("Finding matching foundation pairs from brands...");
      
      const pairs = await findBrandPairs(lightPigmentColor.hex, data.darkest_hex, 4);
      setBrandPairs(pairs);

      toast({
        title: "Analysis Complete",
        description: "Found matching foundation products!"
      });
    } catch (error: any) {
      const status = error?.context?.status;
      const description = status === 404
        ? "Skin analysis service is not deployed for this Supabase project. Verify your project URL/keys and deploy the analyze-skin-tone Edge Function."
        : (error?.message || "Failed to analyze image");

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
        lightest_rgb: lightestResult.rgb as any,
        lightest_pigment_mix: lightestResult.pigmentColor.pigmentMix as any,
        darkest_hex: darkestResult.hex,
        darkest_rgb: darkestResult.rgb as any,
        darkest_pigment_mix: darkestResult.pigmentColor.pigmentMix as any,
        matched_products: brandPairs as any,
        photo_url: currentImage
      }]);

      if (error) throw error;

      toast({
        title: "Saved Successfully",
        description: "Your shade match has been saved to your account"
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save shade match",
        variant: "destructive"
      });
    }
  };


  const handleBuyNow = async (products: FoundationMatch[]) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase products",
        variant: "destructive"
      });
      // Redirect to auth page
      window.location.href = '/auth';
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Preparing checkout...");

      const refreshedProducts = await refreshFoundationMatchesPricing(
        products.map((product) => ({
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
          matchPercentage: product.score,
          undertone: product.undertone || 'unknown',
          coverage: 'unknown',
          finish: 'unknown',
          imageUrl: product.img || PLACEHOLDER_IMAGE,
          productUrl: product.url,
        }))
      );

      const productsWithPrice = refreshedProducts.filter(product => typeof product.price === 'number' && Number.isFinite(product.price) && product.price > 0);
      if (productsWithPrice.length === 0) {
        throw new Error('Price unavailable for selected product(s). Please choose items with listed prices.');
      }

      await trackUserActivity(user.id, 'checkout_started', {
        source: 'ai_skin_tone_matcher',
        item_count: productsWithPrice.length,
      });

      const cartItems = productsWithPrice.map(product => ({
        id: product.id,
        product: {
          id: product.id,
          brand: product.brand,
          product: product.product,
          shade: product.shade,
          price: product.price as number
        },
        quantity: 1,
        shadeName: product.shade
      }));

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          items: cartItems
        }
      });

      if (error) throw error;

      if (data?.checkout_url) {
        await trackUserActivity(user.id, 'checkout_redirected', {
          source: 'ai_skin_tone_matcher',
          item_count: cartItems.length,
        });
        window.location.href = data.checkout_url;
      }

      toast({
        title: "Redirecting to Checkout",
        description: "Taking you to secure payment..."
      });
    } catch (error: any) {
      await trackUserActivity(user.id, 'checkout_failed', {
        source: 'ai_skin_tone_matcher',
        reason: error.message || 'unknown_error',
      });
      toast({
        title: "Checkout Failed",
        description: error.message || "Unable to process checkout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          Analyze a photo or look up a foundation shade to calculate the pigment mix
        </p>
      </div>

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
                        disabled={loading}
                        className="flex-1"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {loadingMessage || "Analyzing..."}
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
                          onError={(e) => {
                            const fallbackTarget = lightestResult?.hex || pair.light.hex;
                            replacePairShadeWithAlternate(idx, 'light', fallbackTarget);
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
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
                      <p className="text-xs text-muted-foreground mb-2">
                        Website: {pair.light.website || getWebsiteFromUrl(pair.light.url) || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border-2 border-border"
                            style={{ backgroundColor: pair.light.hex }}
                          />
                          <span className="text-xs text-muted-foreground">{describeSkinTone(pair.light.hex).name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {typeof pair.light.price === 'number' ? `$${pair.light.price.toFixed(2)}` : 'Price unavailable'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mb-2"
                        disabled
                      >
                        External links disabled
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          if (typeof pair.light.price !== 'number') {
                            toast({
                              title: "Price unavailable",
                              description: "This product is missing a verified price.",
                              variant: "destructive"
                            });
                            return;
                          }
                          addToCart({
                            id: `${pair.light.brand}-${pair.light.shade_name}`,
                            brand: pair.light.brand,
                            product: pair.light.product,
                            shade: pair.light.shade_name,
                            price: pair.light.price,
                            hex: pair.light.hex,
                            imgSrc: pair.light.img
                          } as any);
                          toast({
                            title: "Added to Cart",
                            description: `${pair.light.shade_name} added to cart`
                          });
                        }}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Add Light
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
                          onError={(e) => {
                            const fallbackTarget = darkestResult?.hex || pair.dark.hex;
                            replacePairShadeWithAlternate(idx, 'dark', fallbackTarget);
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
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
                      <p className="text-xs text-muted-foreground mb-2">
                        Website: {pair.dark.website || getWebsiteFromUrl(pair.dark.url) || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border-2 border-border"
                            style={{ backgroundColor: pair.dark.hex }}
                          />
                          <span className="text-xs text-muted-foreground">{describeSkinTone(pair.dark.hex).name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {typeof pair.dark.price === 'number' ? `$${pair.dark.price.toFixed(2)}` : 'Price unavailable'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mb-2"
                        disabled
                      >
                        External links disabled
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          if (typeof pair.dark.price !== 'number') {
                            toast({
                              title: "Price unavailable",
                              description: "This product is missing a verified price.",
                              variant: "destructive"
                            });
                            return;
                          }
                          addToCart({
                            id: `${pair.dark.brand}-${pair.dark.shade_name}`,
                            brand: pair.dark.brand,
                            product: pair.dark.product,
                            shade: pair.dark.shade_name,
                            price: pair.dark.price,
                            hex: pair.dark.hex,
                            imgSrc: pair.dark.img
                          } as any);
                          toast({
                            title: "Added to Cart",
                            description: `${pair.dark.shade_name} added to cart`
                          });
                        }}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Add Dark
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
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full font-semibold"
                        onClick={() => {
                          if (typeof pair.light.price !== 'number' || typeof pair.dark.price !== 'number') {
                            toast({
                              title: "Price unavailable",
                              description: "One or both products are missing verified prices.",
                              variant: "destructive"
                            });
                            return;
                          }
                          addToCart({
                            id: `${pair.light.brand}-${pair.light.shade_name}`,
                            brand: pair.light.brand,
                            product: pair.light.product,
                            shade: pair.light.shade_name,
                            price: pair.light.price,
                            hex: pair.light.hex,
                            imgSrc: pair.light.img
                          } as any);
                          addToCart({
                            id: `${pair.dark.brand}-${pair.dark.shade_name}`,
                            brand: pair.dark.brand,
                            product: pair.dark.product,
                            shade: pair.dark.shade_name,
                            price: pair.dark.price,
                            hex: pair.dark.hex,
                            imgSrc: pair.dark.img
                          } as any);
                          toast({
                            title: "Added to Cart",
                            description: "Complete set added to cart"
                          });
                        }}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        {typeof pair.light.price === 'number' && typeof pair.dark.price === 'number'
                          ? `Add Set - $${(pair.light.price + pair.dark.price).toFixed(2)}`
                          : 'Add Set - Price unavailable'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {selectedProduct.img && (
                    <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                      <img 
                        src={selectedProduct.img} 
                        alt={selectedProduct.product}
                        className="max-h-full max-w-full object-contain p-4"
                      />
                    </div>
                  )}
                  <div 
                    className="h-16 rounded-lg border-2 border-border"
                    style={{ backgroundColor: selectedProduct.hex }}
                  />
                  <p className="text-sm text-center">{describeSkinTone(selectedProduct.hex).name}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">{selectedProduct.brand}</Badge>
                    <h3 className="text-xl font-semibold">{selectedProduct.product}</h3>
                    <p className="text-muted-foreground">{selectedProduct.shade_name}</p>
                  </div>
                  {selectedProduct.price && (
                    <div className="text-2xl font-bold text-primary">
                      ${selectedProduct.price.toFixed(2)}
                    </div>
                  )}
                  {!selectedProduct.price && (
                    <div className="text-sm text-muted-foreground">Price unavailable</div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Store: {selectedProduct.store || getStoreFromUrl(selectedProduct.url)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Website: {selectedProduct.website || getWebsiteFromUrl(selectedProduct.url) || 'N/A'}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Match Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${selectedProduct.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{selectedProduct.score.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => {
                        toast({
                          title: "Virtual Try-On",
                          description: "Feature coming soon!"
                        });
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Try-On
                    </Button>
                    <Button 
                      variant="default" 
                      size="lg"
                      onClick={() => {
                        setIsProductDialogOpen(false);
                        handleBuyNow([selectedProduct]);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
