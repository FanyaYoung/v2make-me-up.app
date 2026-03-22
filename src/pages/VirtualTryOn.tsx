import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, ShoppingCart, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { detectFaceLandmarks, applyMakeupOverlay } from '@/utils/faceDetection';
import { describeSkinTone } from '@/lib/skinToneDescription';
import { optimizeImageForAnalysis } from '@/lib/imageOptimization';
import { createPigmentColor, calculatePigmentMatch } from '@/lib/pigmentMixing';
import { loadProductMetadataMap, parseCsvRow, normalizeImageUrl, makeProductKey } from '@/lib/productMetadata';

interface ProductPair {
  lightProduct: any;
  darkProduct: any;
  brand: string;
}

interface ShadeRow {
  brand: string;
  product: string;
  url: string;
  shade: string;
  hex: string;
  imgSrc: string;
  price?: number;
  store?: string;
  website?: string;
}

const ANALYSIS_TIMEOUT_MS = 45000;
const PLACEHOLDER_IMAGE = '/placeholder.svg';

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

const normalizePrice = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const VirtualTryOn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [recommendationHistory, setRecommendationHistory] = useState<ProductPair[][]>([]);
  const [currentRecommendations, setCurrentRecommendations] = useState<ProductPair[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [makeupPreviewUrl, setMakeupPreviewUrl] = useState<string | null>(null);
  const [isApplyingMakeup, setIsApplyingMakeup] = useState(false);
  const [shadeDatabase, setShadeDatabase] = useState<ShadeRow[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load initial products from navigation state
  useEffect(() => {
    const products = location.state?.products as ProductPair[] | undefined;
    const initialImage = location.state?.image as string | undefined;
    
    if (products && products.length > 0) {
      setCurrentRecommendations(products);
      setRecommendationHistory([products]);
      if (initialImage) {
        setCapturedImage(initialImage);
      }
    } else {
      toast.error('No products to try on. Please start from AI Shade Match.');
      navigate('/shade-matcher');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const loadShadeDatabase = async () => {
      try {
        const productMetadataMap = await loadProductMetadataMap();

        const response = await fetch('/data/allShades.csv');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase());
        const getIdx = (...keys: string[]) => {
          for (const key of keys) {
            const idx = headers.findIndex(h => h === key || h.includes(key));
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
          name: getIdx('name', 'shade_name'),
          hex: getIdx('hex'),
          price: getIdx('price', 'cost'),
        };

        const parsed: ShadeRow[] = lines
          .slice(1)
          .map((line) => {
            const values = parseCsvRow(line);
            const brand = (values[idx.brand] || values[0] || '').trim();
            const product = (values[idx.product] || values[1] || '').trim();
            const metadata = productMetadataMap.get(makeProductKey(brand, product));
            const baseUrl = (values[idx.url] || values[2] || '').trim();
            const url = (metadata?.productUrl || baseUrl || '').trim();
            const baseImg = (values[idx.imgSrc] || values[4] || '').trim();
            const imgSrc = metadata?.imageUrl || normalizeImageUrl(baseImg, url);
            const price = normalizePrice(values[idx.price]) ?? metadata?.price;
            const shade = (values[idx.name] || values[idx.description] || values[6] || values[3] || '').trim();
            const hex = (values[idx.hex] || values[9] || '').trim();

            return {
              brand,
              product,
              url,
              shade,
              hex,
              imgSrc: imgSrc || '',
              price,
              store: getStoreFromUrl(url),
              website: getWebsiteFromUrl(url),
            };
          })
          .filter((row) => row.brand && row.hex && /^#[0-9A-F]{6}$/i.test(row.hex));

        setShadeDatabase(parsed);
      } catch (error) {
        console.error('Failed to load shade database:', error);
      }
    };

    loadShadeDatabase();
  }, []);

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    optimizeImageForAnalysis(file)
      .then((optimized) => setCapturedImage(optimized))
      .catch((error) => {
        console.error('Error processing uploaded image:', error);
        toast.error('Could not process this photo. Please try another image.');
      });
  };

  const getNewRecommendations = async () => {
    if (!capturedImage) {
      toast.error('Please capture or upload a photo first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const optimizedImage = await optimizeImageForAnalysis(capturedImage);
      const { data, error } = await withTimeout(
        supabase.functions.invoke('analyze-skin-tone', {
          body: { imageBase64: optimizedImage, analysisType: 'image' }
        }),
        ANALYSIS_TIMEOUT_MS
      );

      if (error) throw error;

      const { lightest_hex: lightestHex, darkest_hex: darkestHex } = data;
      
      // Find new brand pairs
      const brandMap = new Map<string, any[]>();
      shadeDatabase.forEach(shade => {
        if (!brandMap.has(shade.brand)) {
          brandMap.set(shade.brand, []);
        }
        brandMap.get(shade.brand)!.push(shade);
      });

      const candidatePairs: Array<ProductPair & { avgDistance: number }> = [];
      for (const [brand, shades] of Array.from(brandMap.entries())) {
        const lightMatches = shades
          .map(s => ({ ...s, distance: colorDistance(lightestHex, s.hex) }))
          .sort((a, b) => a.distance - b.distance);
        
        const darkMatches = shades
          .map(s => ({ ...s, distance: colorDistance(darkestHex, s.hex) }))
          .sort((a, b) => a.distance - b.distance);

        if (lightMatches.length > 0 && darkMatches.length > 0) {
          const light = lightMatches.find(m => m.imgSrc) ?? lightMatches[0];
          const dark = darkMatches.find(m => m.imgSrc) ?? darkMatches[0];
          if (!light?.imgSrc || !dark?.imgSrc) continue;

          candidatePairs.push({
            brand,
            lightProduct: light,
            darkProduct: dark,
            avgDistance: (light.distance + dark.distance) / 2,
          });
        }
      }

      const newPairs = candidatePairs
        .sort((a, b) => a.avgDistance - b.avgDistance)
        .slice(0, 4)
        .map(({ avgDistance, ...pair }) => pair);

      if (newPairs.length === 0) {
        throw new Error('No image-backed product pairs were found for this analysis.');
      }

      setCurrentRecommendations(newPairs);
      setRecommendationHistory(prev => [...prev, newPairs]);
      setSelectedProductIndex(null);
      toast.success('New recommendations generated!');
    } catch (error: any) {
      console.error('Error:', error);
      const status = error?.context?.status;
      const message = status === 404
        ? 'Skin analysis service is not deployed for this Supabase project. Check your project config and deploy analyze-skin-tone.'
        : 'Failed to generate new recommendations';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const colorDistance = (hex1: string, hex2: string): number => {
    // Pigment-palette matching for consistency with shade analysis.
    const toneA = createPigmentColor(hex1);
    const toneB = createPigmentColor(hex2);
    return 100 - calculatePigmentMatch(toneA, toneB);
  };

  const handleBuyProduct = async (product: any, type: 'light' | 'dark') => {
    const verifiedPrice = normalizePrice(product.price);
    if (typeof verifiedPrice !== 'number') {
      toast.error('Price unavailable for this product');
      return;
    }
    const foundationMatch: any = {
      id: `${product.brand}-${product.shade}`,
      brand: product.brand,
      shade: product.shade,
      product: product.product,
      price: verifiedPrice,
      rating: 4.5,
      reviewCount: 0,
      availability: {
        online: true,
        inStore: false,
        readyForPickup: false,
        nearbyStores: []
      },
      matchPercentage: 95,
      undertone: 'neutral',
      coverage: 'medium',
      finish: 'natural',
      imageUrl: product.imageUrl || product.imgSrc
    };
    addToCart(foundationMatch);
    toast.success(`Added ${type} shade to cart!`);
  };

  const handleBuySet = async (pair: ProductPair) => {
    const lightPrice = normalizePrice(pair.lightProduct.price);
    const darkPrice = normalizePrice(pair.darkProduct.price);
    if (typeof lightPrice !== 'number' || typeof darkPrice !== 'number') {
      toast.error('Price unavailable for one or both products');
      return;
    }
    const lightMatch: any = {
      id: `${pair.brand}-${pair.lightProduct.shade}`,
      brand: pair.brand,
      shade: pair.lightProduct.shade,
      product: pair.lightProduct.product,
      price: lightPrice,
      rating: 4.5,
      reviewCount: 0,
      availability: {
        online: true,
        inStore: false,
        readyForPickup: false,
        nearbyStores: []
      },
      matchPercentage: 95,
      undertone: 'neutral',
      coverage: 'medium',
      finish: 'natural',
      imageUrl: pair.lightProduct.imageUrl || pair.lightProduct.imgSrc
    };
    const darkMatch: any = {
      id: `${pair.brand}-${pair.darkProduct.shade}`,
      brand: pair.brand,
      shade: pair.darkProduct.shade,
      product: pair.darkProduct.product,
      price: darkPrice,
      rating: 4.5,
      reviewCount: 0,
      availability: {
        online: true,
        inStore: false,
        readyForPickup: false,
        nearbyStores: []
      },
      matchPercentage: 95,
      undertone: 'neutral',
      coverage: 'medium',
      finish: 'natural',
      imageUrl: pair.darkProduct.imageUrl || pair.darkProduct.imgSrc
    };
    addToCart(lightMatch);
    addToCart(darkMatch);
    toast.success('Added both shades to cart!');
  };

  const applyMakeupToFace = async (productIndex: number) => {
    if (!capturedImage || productIndex === null) return;

    setIsApplyingMakeup(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = capturedImage;
      });

      // Detect face landmarks
      const landmarks = await detectFaceLandmarks(img);
      
      if (!landmarks) {
        toast.error('Could not detect face in image');
        setIsApplyingMakeup(false);
        return;
      }

      // Create canvas for makeup application
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply makeup overlay
      const lightColor = currentRecommendations[productIndex].lightProduct.hex;
      const darkColor = currentRecommendations[productIndex].darkProduct.hex;
      
      applyMakeupOverlay(canvas, landmarks, lightColor, darkColor);

      // Convert to data URL
      const makeupImage = canvas.toDataURL('image/jpeg', 0.95);
      setMakeupPreviewUrl(makeupImage);
      
    } catch (error) {
      console.error('Error applying makeup:', error);
      toast.error('Failed to apply makeup preview');
    } finally {
      setIsApplyingMakeup(false);
    }
  };

  // Apply makeup when product is selected
  useEffect(() => {
    if (selectedProductIndex !== null && capturedImage) {
      applyMakeupToFace(selectedProductIndex);
    } else {
      setMakeupPreviewUrl(null);
    }
  }, [selectedProductIndex, capturedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/shade-matcher')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to AI Shade Match
        </Button>

        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Virtual Try-On
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Camera/Upload Section */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="camera" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="camera">
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="camera" className="space-y-4">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {capturedImage ? (
                      <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="flex gap-2">
                    {!cameraActive && !capturedImage && (
                      <Button onClick={startCamera} className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    )}
                    {cameraActive && (
                      <>
                        <Button onClick={takeSnapshot} className="flex-1">
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                        <Button onClick={stopCamera} variant="outline">
                          Cancel
                        </Button>
                      </>
                    )}
                    {capturedImage && (
                      <Button
                        onClick={() => {
                          setCapturedImage(null);
                          startCamera();
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Retake
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    {capturedImage ? (
                      <img src={capturedImage} alt="Uploaded" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Upload a photo to try on products</p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photo
                  </Button>
                </TabsContent>
              </Tabs>

              {capturedImage && (
                <Button
                  onClick={getNewRecommendations}
                  disabled={isAnalyzing}
                  className="w-full mt-4"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Get New Recommendations'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Try-On Preview - Before/After Comparison */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Before & After Comparison</h2>
              <div className="space-y-4">
                {capturedImage && selectedProductIndex !== null ? (
                  <>
                    {/* Before */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">BEFORE</p>
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img src={capturedImage} alt="Before" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    
                    {/* After */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">AFTER (with foundation)</p>
                      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        {isApplyingMakeup ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-muted-foreground">Applying makeup...</p>
                          </div>
                        ) : makeupPreviewUrl ? (
                          <img src={makeupPreviewUrl} alt="After" className="w-full h-full object-cover" />
                        ) : (
                          <img src={capturedImage} alt="After" className="w-full h-full object-cover" />
                        )}
                      </div>
                      
                      <div className="mt-2 bg-muted/50 rounded-lg p-3">
                        <p className="font-semibold text-sm">{currentRecommendations[selectedProductIndex]?.brand}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentRecommendations[selectedProductIndex].lightProduct.hex }} />
                            <span>Light: {currentRecommendations[selectedProductIndex].lightProduct.shade}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentRecommendations[selectedProductIndex].darkProduct.hex }} />
                            <span>Dark: {currentRecommendations[selectedProductIndex].darkProduct.shade}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-[2/1] bg-muted rounded-lg flex items-center justify-center text-center text-muted-foreground p-8">
                    {capturedImage ? (
                      <p>Select a product below to see the before & after comparison</p>
                    ) : (
                      <p>Capture or upload a photo to see the before & after comparison</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Recommendations */}
        <h2 className="text-2xl font-bold mb-4">Current Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentRecommendations.map((pair, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedProductIndex === index ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setSelectedProductIndex(index)}
            >
              <CardContent className="p-4">
                {selectedProductIndex === index && (
                  <div className="flex items-center justify-center mb-2 text-primary">
                    <Check className="w-5 h-5 mr-1" />
                    <span className="text-sm font-semibold">Trying On</span>
                  </div>
                )}
                <h3 className="font-semibold text-lg mb-4 text-center">{pair.brand}</h3>
                
                <div className="space-y-4">
                  {/* Light Shade */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary">LIGHT SHADE</p>
                    <img
                      src={pair.lightProduct.imageUrl || pair.lightProduct.imgSrc || PLACEHOLDER_IMAGE}
                      alt={pair.lightProduct.shade}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border-2 border-border"
                        style={{ backgroundColor: pair.lightProduct.hex }}
                      />
                      <p className="text-xs text-muted-foreground">{describeSkinTone(pair.lightProduct.hex).name}</p>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{pair.lightProduct.shade}</p>
                    <p className="text-xs text-muted-foreground">
                      Store: {pair.lightProduct.store || getStoreFromUrl(pair.lightProduct.url)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Website: {pair.lightProduct.website || getWebsiteFromUrl(pair.lightProduct.url) || 'N/A'}
                    </p>
                    {typeof pair.lightProduct.price === 'number' ? (
                      <p className="text-sm font-bold text-primary">${pair.lightProduct.price.toFixed(2)}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Price unavailable</p>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyProduct(pair.lightProduct, 'light');
                      }}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy Light
                    </Button>
                  </div>

                  {/* Dark Shade */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary">DARK SHADE (CONTOUR)</p>
                    <img
                      src={pair.darkProduct.imageUrl || pair.darkProduct.imgSrc || PLACEHOLDER_IMAGE}
                      alt={pair.darkProduct.shade}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border-2 border-border"
                        style={{ backgroundColor: pair.darkProduct.hex }}
                      />
                      <p className="text-xs text-muted-foreground">{describeSkinTone(pair.darkProduct.hex).name}</p>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{pair.darkProduct.shade}</p>
                    <p className="text-xs text-muted-foreground">
                      Store: {pair.darkProduct.store || getStoreFromUrl(pair.darkProduct.url)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Website: {pair.darkProduct.website || getWebsiteFromUrl(pair.darkProduct.url) || 'N/A'}
                    </p>
                    {typeof pair.darkProduct.price === 'number' ? (
                      <p className="text-sm font-bold text-primary">${pair.darkProduct.price.toFixed(2)}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Price unavailable</p>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyProduct(pair.darkProduct, 'dark');
                      }}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy Dark
                    </Button>
                  </div>

                  {/* Buy Set Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuySet(pair);
                    }}
                    className="w-full font-semibold"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {typeof pair.lightProduct.price === 'number' && typeof pair.darkProduct.price === 'number'
                      ? `Buy Set - $${(pair.lightProduct.price + pair.darkProduct.price).toFixed(2)}`
                      : 'Buy Set - Price unavailable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommendation History */}
        {recommendationHistory.length > 1 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Previous Recommendations</h2>
            <div className="space-y-4">
              {recommendationHistory.slice(0, -1).reverse().map((historySet, setIndex) => (
                <Card key={setIndex}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Recommendation Set {recommendationHistory.length - setIndex - 1}</h3>
                      <Button
                        onClick={() => {
                          setCurrentRecommendations(historySet);
                          const newHistory = [...recommendationHistory];
                          newHistory.splice(recommendationHistory.length - setIndex - 1, 1);
                          newHistory.push(historySet);
                          setRecommendationHistory(newHistory);
                          setSelectedProductIndex(null);
                        }}
                        size="sm"
                      >
                        Switch to These
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {historySet.map((pair, index) => (
                        <div key={index} className="text-center">
                          <img
                            src={pair.lightProduct.imageUrl || pair.lightProduct.imgSrc || PLACEHOLDER_IMAGE}
                            alt={pair.brand}
                            className="w-full h-24 object-cover rounded mb-2"
                            onError={(e) => {
                              e.currentTarget.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                          <p className="text-sm font-medium">{pair.brand}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VirtualTryOn;
