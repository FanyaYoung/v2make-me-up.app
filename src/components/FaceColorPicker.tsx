import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hexToRgb, rgbToXyz, xyzToLab, deltaE2000 } from '@/lib/colorUtils';
import { toast } from 'sonner';

interface FaceColorResult {
  lightest: { r: number; g: number; b: number; hex: string };
  darkest: { r: number; g: number; b: number; hex: string };
  matches?: FoundationMatch[];
}

interface FoundationMatch {
  brand: string;
  product: string;
  shade: string;
  hex: string;
  deltaE: number;
  purpose: 'lightest' | 'darkest' | 'blended';
}

interface FaceColorPickerProps {
  imageUrl?: string;
  onColorsPicked?: (result: FaceColorResult) => void;
  showControls?: boolean;
}

export const FaceColorPicker: React.FC<FaceColorPickerProps> = ({
  imageUrl,
  onColorsPicked,
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<FaceColorResult | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl || null);
  const [ellipse, setEllipse] = useState({ cx: 0, cy: 0, rx: 100, ry: 130 });
  const [percentile, setPercentile] = useState(1);
  const [step, setStep] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [shadeInput, setShadeInput] = useState('');
  const [targetShade, setTargetShade] = useState<{ r: number; g: number; b: number; hex: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load image and center ellipse
  useEffect(() => {
    if (!currentImage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Center ellipse on face area (upper-middle portion)
      setEllipse({
        cx: img.width / 2,
        cy: img.height * 0.4,
        rx: Math.min(img.width, img.height) * 0.25,
        ry: Math.min(img.width, img.height) * 0.32,
      });
    };
    img.src = currentImage;
  }, [currentImage]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const srgbToLinear = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const relativeLuminance = (r: number, g: number, b: number) => {
    const R = srgbToLinear(r);
    const G = srgbToLinear(g);
    const B = srgbToLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };

  const toHex = (r: number, g: number, b: number) => {
    const h = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${h(r)}${h(g)}${h(b)}`;
  };

  const pointInEllipse = (x: number, y: number, e: typeof ellipse) => {
    const dx = x - e.cx;
    const dy = y - e.cy;
    return (dx * dx) / (e.rx * e.rx) + (dy * dy) / (e.ry * e.ry) <= 1.0;
  };

  const parseCssColor = (str: string): { r: number; g: number; b: number } | null => {
    const s = str.trim();
    
    // Try hex
    const hex = s.replace('#', '');
    if (/^[0-9a-f]{3}$/i.test(hex)) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    
    // Try rgb()
    const m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCurrentImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setMediaStream(stream);
        setIsCameraActive(true);
        toast.success('Camera started');
      }
    } catch (err) {
      toast.error('Camera unavailable: ' + (err as Error).message);
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    setCurrentImage(canvas.toDataURL('image/png'));
    stopCamera();
    toast.success('Photo captured');
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
      setIsCameraActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const applyShade = () => {
    const col = parseCssColor(shadeInput);
    if (!col) {
      toast.error('Could not parse that color. Try #hex, rgb(), or a CSS color name.');
      return;
    }
    
    setTargetShade({ ...col, hex: toHex(col.r, col.g, col.b) });
    toast.success('Shade applied');
  };

  const matchWithFoundations = async (light: { r: number; g: number; b: number }, dark: { r: number; g: number; b: number }) => {
    try {
      // Fetch ALL products with hex colors
      const { data: products, error } = await supabase
        .from('productsandshadeswithimages')
        .select('brand, product, name, hex, "Swatch: hex"')
        .not('hex', 'is', null);

      if (error) throw error;
      if (!products || products.length === 0) return [];

      // Convert sampled colors to Lab
      const lightRgb = hexToRgb(toHex(light.r, light.g, light.b));
      const darkRgb = hexToRgb(toHex(dark.r, dark.g, dark.b));
      if (!lightRgb || !darkRgb) return [];

      const lightLab = xyzToLab(rgbToXyz(lightRgb));
      const darkLab = xyzToLab(rgbToXyz(darkRgb));

      // Group products by brand and find best light + dark per brand
      const brandMap = new Map<string, {
        lightMatch: { product: any; deltaE: number } | null;
        darkMatch: { product: any; deltaE: number } | null;
      }>();

      products.forEach((product: any) => {
        if (!product.hex || !product.brand) return;

        const productRgb = hexToRgb(product.hex);
        if (!productRgb) return;

        const productLab = xyzToLab(rgbToXyz(productRgb));
        const lightDelta = deltaE2000(lightLab, productLab);
        const darkDelta = deltaE2000(darkLab, productLab);

        const brand = product.brand;
        if (!brandMap.has(brand)) {
          brandMap.set(brand, { lightMatch: null, darkMatch: null });
        }

        const entry = brandMap.get(brand)!;
        
        // Update best light match for this brand
        if (!entry.lightMatch || lightDelta < entry.lightMatch.deltaE) {
          entry.lightMatch = { product, deltaE: lightDelta };
        }

        // Update best dark match for this brand
        if (!entry.darkMatch || darkDelta < entry.darkMatch.deltaE) {
          entry.darkMatch = { product, deltaE: darkDelta };
        }
      });

      // Create brand pairs with combined distance
      interface BrandPair {
        brand: string;
        pairDistance: number;
        lightMatch: FoundationMatch;
        darkMatch: FoundationMatch;
        tier?: 'high' | 'mid' | 'low';
      }

      const brandPairs: BrandPair[] = [];
      brandMap.forEach((value, brand) => {
        if (value.lightMatch && value.darkMatch) {
          const pairDistance = value.lightMatch.deltaE + value.darkMatch.deltaE;
          
          brandPairs.push({
            brand,
            pairDistance,
            lightMatch: {
              brand,
              product: value.lightMatch.product.product,
              shade: value.lightMatch.product.name,
              hex: value.lightMatch.product.hex,
              deltaE: value.lightMatch.deltaE,
              purpose: 'lightest',
            },
            darkMatch: {
              brand,
              product: value.darkMatch.product.product,
              shade: value.darkMatch.product.name,
              hex: value.darkMatch.product.hex,
              deltaE: value.darkMatch.deltaE,
              purpose: 'darkest',
            },
          });
        }
      });

      // Sort by pair distance (best color match first)
      brandPairs.sort((a, b) => a.pairDistance - b.pairDistance);

      // Simple tier assignment based on brand name patterns
      // High-end: Fenty, NARS, MAC, Charlotte Tilbury, Tom Ford, etc.
      // Mid: Maybelline, L'Oreal, Revlon, NYX, etc.
      // Low: e.l.f., Wet n Wild, etc.
      const highEndBrands = ['fenty', 'nars', 'mac', 'charlotte tilbury', 'tom ford', 'ysl', 'dior', 'chanel', 'estee lauder', 'lancome', 'giorgio armani'];
      const lowEndBrands = ['e.l.f', 'elf', 'wet n wild', 'essence', 'nyx'];

      brandPairs.forEach(pair => {
        const brandLower = pair.brand.toLowerCase();
        if (highEndBrands.some(b => brandLower.includes(b))) {
          pair.tier = 'high';
        } else if (lowEndBrands.some(b => brandLower.includes(b))) {
          pair.tier = 'low';
        } else {
          pair.tier = 'mid';
        }
      });

      // Select top matches per tier: 6 high, 8 mid, 1 low
      const highEnd = brandPairs.filter(p => p.tier === 'high').slice(0, 6);
      const mid = brandPairs.filter(p => p.tier === 'mid').slice(0, 8);
      const low = brandPairs.filter(p => p.tier === 'low').slice(0, 1);

      // Combine all matches
      const finalMatches: FoundationMatch[] = [];
      [...highEnd, ...mid, ...low].forEach(pair => {
        finalMatches.push(pair.lightMatch, pair.darkMatch);
      });

      return finalMatches;
    } catch (error) {
      console.error('Error matching foundations:', error);
      toast.error('Failed to match with foundations');
      return [];
    }
  };

  const analyzeColors = async () => {
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const samples: Array<{ Y: number; r: number; g: number; b: number }> = [];

    const minX = Math.max(0, Math.floor(ellipse.cx - ellipse.rx));
    const maxX = Math.min(canvas.width - 1, Math.ceil(ellipse.cx + ellipse.rx));
    const minY = Math.max(0, Math.floor(ellipse.cy - ellipse.ry));
    const maxY = Math.min(canvas.height - 1, Math.ceil(ellipse.cy + ellipse.ry));

    const imageData = ctx.getImageData(minX, minY, maxX - minX + 1, maxY - minY + 1);
    const data = imageData.data;
    const width = imageData.width;

    for (let y = minY; y <= maxY; y += step) {
      for (let x = minX; x <= maxX; x += step) {
        if (pointInEllipse(x, y, ellipse)) {
          const localX = x - minX;
          const localY = y - minY;
          const idx = (localY * width + localX) * 4;

          if (data[idx + 3] >= 1) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const Y = relativeLuminance(r, g, b);
            samples.push({ Y, r, g, b });
          }
        }
      }
    }

    if (samples.length < 20) {
      console.warn('Not enough pixels sampled');
      return;
    }

    samples.sort((a, b) => a.Y - b.Y);
    const k = Math.max(1, Math.floor(samples.length * (percentile / 100)));

    const darkest = samples.slice(0, k);
    const lightest = samples.slice(-k);

    const avg = (arr: typeof samples) => {
      let R = 0, G = 0, B = 0;
      arr.forEach(p => { R += p.r; G += p.g; B += p.b; });
      const n = arr.length;
      return { r: Math.round(R / n), g: Math.round(G / n), b: Math.round(B / n) };
    };

    const dark = avg(darkest);
    const light = avg(lightest);

    // Match with foundation database
    const matches = await matchWithFoundations(light, dark);

    const colors = {
      darkest: { ...dark, hex: toHex(dark.r, dark.g, dark.b) },
      lightest: { ...light, hex: toHex(light.r, light.g, light.b) },
      matches,
    };

    setResult(colors);
    onColorsPicked?.(colors);
    setIsAnalyzing(false);
    toast.success('Analysis complete! Found matching foundations.');
  };

  const handleEllipseDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const svg = overlayRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setEllipse(prev => ({
      ...prev,
      cx: x - dragOffset.x,
      cy: y - dragOffset.y,
    }));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = overlayRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragOffset({ x: x - ellipse.cx, y: y - ellipse.cy });
    svg.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    overlayRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="camera">
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="shade">
              <Palette className="w-4 h-4 mr-2" />
              Shade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} className="w-full">
              Choose Photo
            </Button>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-muted"
              style={{ maxHeight: '300px' }}
              playsInline
              muted
            />
            <div className="flex gap-2">
              {!isCameraActive ? (
                <Button onClick={startCamera} className="flex-1">
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={captureSnapshot} className="flex-1">
                    Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Stop
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="shade" className="space-y-4">
            <div className="space-y-2">
              <Label>Enter Makeup Shade (hex, rgb, or color name)</Label>
              <div className="flex gap-2">
                <Input
                  value={shadeInput}
                  onChange={(e) => setShadeInput(e.target.value)}
                  placeholder="#c89a7f or rgb(200,154,127)"
                />
                <Button onClick={applyShade}>Apply</Button>
              </div>
              {targetShade && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-12 rounded border"
                    style={{ backgroundColor: targetShade.hex }}
                  />
                  <span className="text-sm text-muted-foreground">{targetShade.hex}</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {currentImage && (
          <div className="relative inline-block w-full">
            <canvas ref={canvasRef} className="max-w-full rounded-lg" />
            <svg
              ref={overlayRef}
              className="absolute inset-0 w-full h-full cursor-move"
              onPointerDown={handlePointerDown}
              onPointerMove={handleEllipseDrag}
              onPointerUp={handlePointerUp}
            >
              <ellipse
                cx={ellipse.cx}
                cy={ellipse.cy}
                rx={ellipse.rx}
                ry={ellipse.ry}
                fill="rgba(64, 148, 255, 0.1)"
                stroke="rgba(64, 148, 255, 0.9)"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}

        {showControls && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sample Percentile: {percentile}%</Label>
              <Slider
                value={[percentile]}
                onValueChange={([v]) => setPercentile(v)}
                min={0.1}
                max={10}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Downsample Step: {step}px</Label>
              <Slider
                value={[step]}
                onValueChange={([v]) => setStep(v)}
                min={1}
                max={8}
                step={1}
              />
            </div>

            <Button 
              onClick={analyzeColors} 
              className="w-full"
              disabled={!currentImage || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Face Colors & Find Matches'}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lightest (Highlight)</Label>
                <div
                  className="h-16 rounded-lg border"
                  style={{ backgroundColor: result.lightest.hex }}
                />
                <p className="text-sm text-muted-foreground">{result.lightest.hex}</p>
              </div>
              <div className="space-y-2">
                <Label>Darkest (Contour)</Label>
                <div
                  className="h-16 rounded-lg border"
                  style={{ backgroundColor: result.darkest.hex }}
                />
                <p className="text-sm text-muted-foreground">{result.darkest.hex}</p>
              </div>
            </div>

            {result.matches && result.matches.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Foundation Matches by Price Tier</h3>
                
                {/* Group matches by brand and tier */}
                {(() => {
                  const brands = new Map<string, { light?: any; dark?: any }>();
                  result.matches.forEach(match => {
                    if (!brands.has(match.brand)) {
                      brands.set(match.brand, {});
                    }
                    const brandEntry = brands.get(match.brand)!;
                    if (match.purpose === 'lightest') {
                      brandEntry.light = match;
                    } else if (match.purpose === 'darkest') {
                      brandEntry.dark = match;
                    }
                  });

                  // Determine tier for display grouping
                  const highEndBrands = ['fenty', 'nars', 'mac', 'charlotte tilbury', 'tom ford', 'ysl', 'dior', 'chanel', 'estee lauder', 'lancome', 'giorgio armani'];
                  const lowEndBrands = ['e.l.f', 'elf', 'wet n wild', 'essence', 'nyx'];
                  
                  const brandsByTier = {
                    high: [] as Array<{ brand: string; light?: any; dark?: any }>,
                    mid: [] as Array<{ brand: string; light?: any; dark?: any }>,
                    low: [] as Array<{ brand: string; light?: any; dark?: any }>,
                  };

                  brands.forEach((matches, brand) => {
                    const brandLower = brand.toLowerCase();
                    let tier: 'high' | 'mid' | 'low' = 'mid';
                    if (highEndBrands.some(b => brandLower.includes(b))) {
                      tier = 'high';
                    } else if (lowEndBrands.some(b => brandLower.includes(b))) {
                      tier = 'low';
                    }
                    if (matches.light && matches.dark) {
                      brandsByTier[tier].push({ brand, ...matches });
                    }
                  });

                  return (
                    <>
                      {brandsByTier.high.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">High-End Options</h4>
                          {brandsByTier.high.map((entry) => (
                            <div key={entry.brand} className="p-4 border rounded-lg">
                              <div className="font-medium mb-3">{entry.brand}</div>
                              <div className="grid grid-cols-2 gap-4">
                                {entry.light && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-2">Light/Highlight</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded border flex-shrink-0" style={{ backgroundColor: entry.light.hex }} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{entry.light.product}</p>
                                        <p className="text-xs text-muted-foreground truncate">{entry.light.shade}</p>
                                        <p className="text-xs text-muted-foreground">ΔE: {entry.light.deltaE.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {entry.dark && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-2">Dark/Contour</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded border flex-shrink-0" style={{ backgroundColor: entry.dark.hex }} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{entry.dark.product}</p>
                                        <p className="text-xs text-muted-foreground truncate">{entry.dark.shade}</p>
                                        <p className="text-xs text-muted-foreground">ΔE: {entry.dark.deltaE.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {brandsByTier.mid.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">Mid-Range Options</h4>
                          {brandsByTier.mid.map((entry) => (
                            <div key={entry.brand} className="p-4 border rounded-lg">
                              <div className="font-medium mb-3">{entry.brand}</div>
                              <div className="grid grid-cols-2 gap-4">
                                {entry.light && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-2">Light/Highlight</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded border flex-shrink-0" style={{ backgroundColor: entry.light.hex }} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{entry.light.product}</p>
                                        <p className="text-xs text-muted-foreground truncate">{entry.light.shade}</p>
                                        <p className="text-xs text-muted-foreground">ΔE: {entry.light.deltaE.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {entry.dark && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-2">Dark/Contour</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded border flex-shrink-0" style={{ backgroundColor: entry.dark.hex }} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{entry.dark.product}</p>
                                        <p className="text-xs text-muted-foreground truncate">{entry.dark.shade}</p>
                                        <p className="text-xs text-muted-foreground">ΔE: {entry.dark.deltaE.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {brandsByTier.low.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">Budget Option</h4>
                          {brandsByTier.low.map((entry) => (
                            <div key={entry.brand} className="p-4 border rounded-lg">
                              <div className="font-medium mb-3">{entry.brand}</div>
                              <div className="grid grid-cols-2 gap-4">
                                {entry.light && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-2">Light/Highlight</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded border flex-shrink-0" style={{ backgroundColor: entry.light.hex }} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{entry.light.product}</p>
                                        <p className="text-xs text-muted-foreground truncate">{entry.light.shade}</p>
                                        <p className="text-xs text-muted-foreground">ΔE: {entry.light.deltaE.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {entry.dark && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-2">Dark/Contour</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded border flex-shrink-0" style={{ backgroundColor: entry.dark.hex }} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{entry.dark.product}</p>
                                        <p className="text-xs text-muted-foreground truncate">{entry.dark.shade}</p>
                                        <p className="text-xs text-muted-foreground">ΔE: {entry.dark.deltaE.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
