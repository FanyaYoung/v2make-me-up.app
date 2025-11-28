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
import { Camera, Upload, Loader2, ShoppingBag, ShoppingCart, Eye } from 'lucide-react';
import { createPigmentColor, createLightFromDark, calculatePigmentMatch, PigmentColor } from '@/lib/pigmentMixing';
import { PigmentColorDisplay } from './PigmentColorDisplay';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';

const PLACEHOLDER_IMAGE = '/placeholder.svg';
const withFallbackImage = (src: string | undefined | null) => {
  return (src && src.trim()) || PLACEHOLDER_IMAGE;
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
  rakutenData?: {
    id: string;
    name: string;
    imageUrl: string;
    salePrice: number;
    clickUrl: string;
    merchant: string;
  };
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
      const response = await fetch('/data/allShades.csv');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      const shades: ShadeData[] = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          brand: values[0] || '',
          product: values[1] || '',
          url: values[2] || '',
          description: values[3] || '',
          imgSrc: values[4] || '',
          imgAlt: values[5] || '',
          name: values[6] || '',
          specific: values[7] || '',
          hex: values[9] || '',
          hue: values[10] || '',
          sat: values[11] || '',
          lightness: values[12] || '',
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
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
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
        price: 39.99
      };

      try {
        const { data: rakutenData } = await supabase.functions.invoke('rakuten-offers', {
          body: { 
            keywords: `${match.brand} ${match.product} foundation`,
            limit: 1
          }
        });

        if (rakutenData?.offers && rakutenData.offers.length > 0) {
          const offer = rakutenData.offers[0];
          baseMatch.rakutenData = {
            id: offer.id,
            name: offer.name,
            imageUrl: offer.imageUrl,
            salePrice: offer.salePrice,
            clickUrl: offer.clickUrl,
            merchant: offer.merchant
          };
          baseMatch.price = offer.salePrice;
          if (offer.imageUrl) {
            baseMatch.img = offer.imageUrl;
          }
        }
      } catch (error) {
        console.log('Could not fetch Rakuten data for product:', match.brand, match.product);
      }

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

      if (lightMatches[0] && darkMatches[0]) {
        const darkMatch = darkMatches[0].shade;
        
        // Create dark color first, then derive light from it
        const darkPigmentColor = createPigmentColor(darkMatch.hex);
        const lightPigmentColor = createLightFromDark(darkPigmentColor);
        
        const lightMatch = lightMatches[0].shade;

        // Use CSV image URLs as base
        const light: FoundationMatch = {
          brand: lightMatch.brand,
          product: lightMatch.product,
          shade_name: lightMatch.name || lightMatch.description,
          hex: lightMatch.hex,
          undertone: '',
          url: lightMatch.url,
          img: withFallbackImage(lightMatch.imgSrc), // CSV image with fallback
          score: 100 - (lightMatches[0].distance / 441.67) * 100,
          pigmentColor: lightPigmentColor,
          price: 39.99
        };

        const dark: FoundationMatch = {
          brand: darkMatch.brand,
          product: darkMatch.product,
          shade_name: darkMatch.name || darkMatch.description,
          hex: darkMatch.hex,
          undertone: '',
          url: darkMatch.url,
          img: withFallbackImage(darkMatch.imgSrc), // CSV image with fallback
          score: 100 - (darkMatches[0].distance / 441.67) * 100,
          pigmentColor: darkPigmentColor,
          price: 45.99
        };

        // Try Rakuten Product Search for enhanced data (pricing and better images)
        // Search for the SPECIFIC matched shade, not just the product
        try {
          const lightShadeSearch = `${brand} ${lightMatch.product} ${lightMatch.name || lightMatch.description}`;
          const darkShadeSearch = `${brand} ${darkMatch.product} ${darkMatch.name || darkMatch.description}`;
          
          const { data: lightRakutenData, error: lightRakutenError } = await supabase.functions.invoke('rakuten-product-search', {
            body: { 
              keywords: lightShadeSearch,
              limit: 10
            }
          }).catch(() => ({ data: null, error: true }));

          const { data: darkRakutenData, error: darkRakutenError } = await supabase.functions.invoke('rakuten-product-search', {
            body: { 
              keywords: darkShadeSearch,
              limit: 10
            }
          }).catch(() => ({ data: null, error: true }));

          // Process light shade Rakuten data
          if (!lightRakutenError && lightRakutenData?.products && lightRakutenData.products.length > 0) {
            const inStockProducts = lightRakutenData.products.filter((p: any) => p.inStock);
            
            if (inStockProducts.length > 0) {
              const sortedByPrice = inStockProducts.sort((a: any, b: any) => {
                const priceA = a.salePrice || a.price || 999999;
                const priceB = b.salePrice || b.price || 999999;
                return priceA - priceB;
              });

              const bestProduct = sortedByPrice[0];
              
              if (bestProduct.salePrice || bestProduct.price) {
                light.price = bestProduct.salePrice || bestProduct.price;
              }
              
              if (bestProduct.imageUrl && (!light.img || light.img === PLACEHOLDER_IMAGE)) {
                light.img = withFallbackImage(bestProduct.imageUrl);
              }
              
              light.rakutenData = {
                id: bestProduct.id,
                name: bestProduct.name,
                imageUrl: bestProduct.imageUrl,
                salePrice: bestProduct.salePrice || bestProduct.price,
                clickUrl: bestProduct.productUrl,
                merchant: bestProduct.brand
              };
            }
          }

          // Process dark shade Rakuten data
          if (!darkRakutenError && darkRakutenData?.products && darkRakutenData.products.length > 0) {
            const inStockProducts = darkRakutenData.products.filter((p: any) => p.inStock);
            
            if (inStockProducts.length > 0) {
              const sortedByPrice = inStockProducts.sort((a: any, b: any) => {
                const priceA = a.salePrice || a.price || 999999;
                const priceB = b.salePrice || b.price || 999999;
                return priceA - priceB;
              });

              const bestProduct = sortedByPrice[0];
              
              if (bestProduct.salePrice || bestProduct.price) {
                dark.price = bestProduct.salePrice || bestProduct.price;
              }
              
              if (bestProduct.imageUrl && (!dark.img || dark.img === PLACEHOLDER_IMAGE)) {
                dark.img = withFallbackImage(bestProduct.imageUrl);
              }
              
              dark.rakutenData = {
                id: bestProduct.id,
                name: bestProduct.name,
                imageUrl: bestProduct.imageUrl,
                salePrice: bestProduct.salePrice || bestProduct.price,
                clickUrl: bestProduct.productUrl,
                merchant: bestProduct.brand
              };
            }
          }
        } catch (error) {
          // Silently continue with CSV data
        }

        const avgDistance = (lightMatches[0].distance + darkMatches[0].distance) / 2;
        pairs.push({ light, dark, avgDistance });
      }
    }

    return pairs.sort((a, b) => a.avgDistance - b.avgDistance).slice(0, limit);
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
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

    const reader = new FileReader();
    reader.onload = (event) => {
      setCurrentImage(event.target?.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
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
      const { data, error } = await supabase.functions.invoke('analyze-skin-tone', {
        body: { imageBase64: currentImage, analysisType: 'image' }
      });

      if (error) throw error;

      const [rDark, gDark, bDark] = hexToRgb(data.darkest_hex);
      
      // Create dark color first, then derive light from it
      const darkPigmentColor = createPigmentColor(data.darkest_hex);
      const lightPigmentColor = createLightFromDark(darkPigmentColor);
      
      const [rLight, gLight, bLight] = lightPigmentColor.rgb;

      setLightestResult({
        hex: lightPigmentColor.hex,
        rgb: [rLight, gLight, bLight],
        analysis: getPigmentMix(rLight, gLight, bLight),
        pigmentColor: lightPigmentColor
      });

      setDarkestResult({
        hex: data.darkest_hex,
        rgb: [rDark, gDark, bDark],
        analysis: getPigmentMix(rDark, gDark, bDark),
        pigmentColor: darkPigmentColor
      });

      // Match to product database - find brand pairs
      setLoadingMessage("Finding matching foundation pairs from brands...");
      
      const pairs = await findBrandPairs(data.lightest_hex, data.darkest_hex, 4);
      setBrandPairs(pairs);

      toast({
        title: "Analysis Complete",
        description: "Found matching foundation products!"
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze image",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

      const cartItems = products.map(product => ({
        id: `${product.brand}-${product.shade_name}`,
        product: {
          id: `${product.brand}-${product.shade_name}`,
          brand: product.brand,
          product: product.product,
          shade: product.shade_name,
          price: product.price || 39.99
        },
        quantity: 1,
        shadeName: product.shade_name
      }));

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          items: cartItems
        }
      });

      if (error) throw error;

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }

      toast({
        title: "Redirecting to Checkout",
        description: "Taking you to secure payment..."
      });
    } catch (error: any) {
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
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result ? (
          <>
            <div 
              className="h-16 rounded-lg border-2 border-border"
              style={{ backgroundColor: result.hex }}
            />
            <div className="space-y-1 text-sm">
              <p>HEX: <span className="font-mono font-semibold">{result.hex}</span></p>
              <p>RGB: R: {result.rgb[0]}, G: {result.rgb[1]}, B: {result.rgb[2]}</p>
              <p className="text-xs text-muted-foreground">
                HSL: H: {result.analysis.h}°, S: {result.analysis.s}%, L: {result.analysis.l}%
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm font-semibold mb-2">Pigment Mix:</p>
              <PigmentBar label="Titanium White" percentage={result.analysis.mix.White} color="linear-gradient(to right, #ffffff, #d1d5db)" />
              <PigmentBar label="Cadmium Yellow" percentage={result.analysis.mix.CadmiumYellow} color="#facc15" />
              <PigmentBar label="Cadmium Red" percentage={result.analysis.mix.CadmiumRed} color="#ef4444" />
              <PigmentBar label="Ultramarine Blue" percentage={result.analysis.mix.UltramarineBlue} color="#3b82f6" />
              <PigmentBar label="Burnt Umber" percentage={result.analysis.mix.BurntUmber} color="#654321" />
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Results will appear here</p>
        )}
      </CardContent>
    </Card>
  );

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ColorResultCard 
          title="Lightest/Target Tone" 
          result={lightestResult}
        />
        {showDarkest && (
          <ColorResultCard 
            title="Darkest/Contour Tone" 
            result={darkestResult}
          />
        )}
      </div>

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
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      </div>
                      <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem] mb-2">{pair.light.shade_name}</p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border-2 border-border"
                            style={{ backgroundColor: pair.light.hex }}
                          />
                          <span className="text-xs font-mono text-muted-foreground">{pair.light.hex}</span>
                        </div>
                        {pair.light.price && (
                          <span className="text-sm font-bold text-primary">${pair.light.price.toFixed(2)}</span>
                        )}
                      </div>
                      {pair.light.rakutenData?.merchant && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Available at: <span className="font-medium text-foreground">{pair.light.rakutenData.merchant}</span>
                        </p>
                      )}
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          addToCart({
                            id: `${pair.light.brand}-${pair.light.shade_name}`,
                            brand: pair.light.brand,
                            product: pair.light.product,
                            shade: pair.light.shade_name,
                            price: pair.light.price || 39.99,
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
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      </div>
                      <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem] mb-2">{pair.dark.shade_name}</p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border-2 border-border"
                            style={{ backgroundColor: pair.dark.hex }}
                          />
                          <span className="text-xs font-mono text-muted-foreground">{pair.dark.hex}</span>
                        </div>
                        {pair.dark.price && (
                          <span className="text-sm font-bold text-primary">${pair.dark.price.toFixed(2)}</span>
                        )}
                      </div>
                      {pair.dark.rakutenData?.merchant && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Available at: <span className="font-medium text-foreground">{pair.dark.rakutenData.merchant}</span>
                        </p>
                      )}
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          addToCart({
                            id: `${pair.dark.brand}-${pair.dark.shade_name}`,
                            brand: pair.dark.brand,
                            product: pair.dark.product,
                            shade: pair.dark.shade_name,
                            price: pair.dark.price || 45.99,
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
                                  imageUrl: p.light.rakutenData?.imageUrl,
                                  price: p.light.price
                                },
                                darkProduct: {
                                  brand: p.dark.brand,
                                  product: p.dark.product,
                                  shade: p.dark.shade_name,
                                  hex: p.dark.hex,
                                  imgSrc: p.dark.img,
                                  imageUrl: p.dark.rakutenData?.imageUrl,
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
                          addToCart({
                            id: `${pair.light.brand}-${pair.light.shade_name}`,
                            brand: pair.light.brand,
                            product: pair.light.product,
                            shade: pair.light.shade_name,
                            price: pair.light.price || 39.99,
                            hex: pair.light.hex,
                            imgSrc: pair.light.img
                          } as any);
                          addToCart({
                            id: `${pair.dark.brand}-${pair.dark.shade_name}`,
                            brand: pair.dark.brand,
                            product: pair.dark.product,
                            shade: pair.dark.shade_name,
                            price: pair.dark.price || 45.99,
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
                        Add Set - ${((pair.light.price || 0) + (pair.dark.price || 0)).toFixed(2)}
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
                  <p className="text-sm font-mono text-center">{selectedProduct.hex}</p>
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
                  {selectedProduct.rakutenData && (
                    <div className="text-sm text-muted-foreground">
                      Available at {selectedProduct.rakutenData.merchant}
                    </div>
                  )}
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
