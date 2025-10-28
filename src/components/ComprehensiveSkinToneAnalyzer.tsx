import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Camera, Upload, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { hexToRgb, rgbToXyz, xyzToLab, deltaE2000, Lab } from '@/lib/colorUtils';
import { useToast } from '@/hooks/use-toast';

interface ProductMatch {
  brand: string;
  product: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  lab: Lab;
  deltaE: number;
}

interface AnalysisResult {
  lightestHex: string;
  darkestHex: string;
  lightestLab: Lab;
  darkestLab: Lab;
  lightnessDesc: string;
  undertoneDesc: string;
}

const ComprehensiveSkinToneAnalyzer = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [lightMatches, setLightMatches] = useState<ProductMatch[]>([]);
  const [darkMatches, setDarkMatches] = useState<ProductMatch[]>([]);
  
  // Slider inputs
  const [lightestSlider, setLightestSlider] = useState('#F5D0B8');
  const [darkestSlider, setDarkestSlider] = useState('#D8B898');
  
  // Photo upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Foundation input
  const [foundationBrandLight, setFoundationBrandLight] = useState('');
  const [foundationShadeLight, setFoundationShadeLight] = useState('');
  const [foundationBrandDark, setFoundationBrandDark] = useState('');
  const [foundationShadeDark, setFoundationShadeDark] = useState('');
  const [foundationError, setFoundationError] = useState('');

  // Fetch all products for matching
  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sephoraproductsbyskintone')
        .select('brand, product, name, "Swatch: imgSrc", url, imgSrc')
        .not('"Swatch: imgSrc"', 'is', null)
        .limit(2000);
      
      if (error) throw error;
      
      // Process products with color data
      return (data || [])
        .map(p => {
          const hex = p['Swatch: imgSrc'];
          if (!hex) return null;
          
          const rgb = hexToRgb(hex);
          if (!rgb) return null;
          
          const xyz = rgbToXyz(rgb);
          const lab = xyzToLab(xyz);
          
          return {
            brand: p.brand,
            product: p.product,
            name: p.name,
            hex,
            rgb,
            lab,
            deltaE: 0,
            url: p.url,
            img: p.imgSrc
          };
        })
        .filter(p => p !== null) as ProductMatch[];
    }
  });

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const findBestMatches = (targetHex: string, count: number = 5): ProductMatch[] => {
    if (!targetHex || allProducts.length === 0) return [];
    
    const targetRgb = hexToRgb(targetHex);
    if (!targetRgb) return [];
    
    const targetXyz = rgbToXyz(targetRgb);
    const targetLab = xyzToLab(targetXyz);
    
    const matches = allProducts.map(product => ({
      ...product,
      deltaE: deltaE2000(targetLab, product.lab)
    }));
    
    matches.sort((a, b) => a.deltaE - b.deltaE);
    return matches.slice(0, count);
  };

  const analyzeImageData = (imageData: ImageData): { lightestHex: string; darkestHex: string } | null => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const pixels: Array<{ r: number; g: number; b: number; hex: string; lab: Lab }> = [];
    
    // Sample pixels efficiently
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
        
        // Filter non-skin colors
        if (a < 200) continue;
        if (g > r * 1.2 && g > b * 1.2 && g > 80) continue; // Green
        if (b > r * 1.2 && b > g * 1.2 && b > 80) continue; // Blue
        
        const rgb = { r, g, b };
        const xyz = rgbToXyz(rgb);
        const lab = xyzToLab(xyz);
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        pixels.push({ r, g, b, hex, lab });
      }
    }
    
    if (pixels.length < 10) {
      console.warn('Not enough valid pixels');
      return null;
    }
    
    // Sort by L* (lightness) and remove outliers
    pixels.sort((a, b) => a.lab.l - b.lab.l);
    const outlierPercent = 5;
    const outlierCount = Math.min(
      Math.floor(pixels.length * (outlierPercent / 100)), 
      Math.floor(pixels.length / 4)
    );
    const relevantPixels = pixels.slice(outlierCount, pixels.length - outlierCount);
    
    if (relevantPixels.length === 0) return null;
    
    // Get 5th and 95th percentile
    const lightestIndex = Math.floor(relevantPixels.length * 0.95);
    const darkestIndex = Math.floor(relevantPixels.length * 0.05);
    
    const lightest = relevantPixels[Math.min(lightestIndex, relevantPixels.length - 1)];
    const darkest = relevantPixels[Math.max(darkestIndex, 0)];
    
    return { lightestHex: lightest.hex, darkestHex: darkest.hex };
  };

  const processAndDisplayResults = (lightestHex: string, darkestHex: string) => {
    const lightRgb = hexToRgb(lightestHex);
    const darkRgb = hexToRgb(darkestHex);
    
    if (!lightRgb || !darkRgb) {
      toast({ title: 'Error', description: 'Invalid color data', variant: 'destructive' });
      return;
    }
    
    const lightXyz = rgbToXyz(lightRgb);
    const lightLab = xyzToLab(lightXyz);
    const darkXyz = rgbToXyz(darkRgb);
    const darkLab = xyzToLab(darkXyz);
    
    // Determine lightness description
    let lightnessDesc = 'Medium';
    if (lightLab.l >= 80) lightnessDesc = 'Very Light';
    else if (lightLab.l >= 65) lightnessDesc = 'Light';
    else if (lightLab.l >= 50) lightnessDesc = 'Medium';
    else if (lightLab.l >= 35) lightnessDesc = 'Tan / Deep';
    else lightnessDesc = 'Very Deep';
    
    // Determine undertone
    let undertoneDesc = 'Neutral';
    const a = lightLab.a;
    const b = lightLab.b;
    
    if (a > 3 && b > 10) {
      undertoneDesc = 'Warm (Peach/Golden)';
    } else if (b > 12 && Math.abs(a) <= 5) {
      undertoneDesc = 'Warm (Golden/Yellow)';
    } else if (a > 5 && b <= 10) {
      undertoneDesc = 'Cool (Rosy/Pink)';
    } else if (a < 0 && b > 8) {
      undertoneDesc = 'Olive';
    } else if (Math.abs(a) <= 5 && Math.abs(b) <= 10) {
      undertoneDesc = 'Neutral';
    } else if (a < -3 && b < 5) {
      undertoneDesc = 'Cool (Ash/Gray)';
    }
    
    setAnalysis({
      lightestHex,
      darkestHex,
      lightestLab: lightLab,
      darkestLab: darkLab,
      lightnessDesc,
      undertoneDesc
    });
    
    // Find product matches
    const lightMatchesResult = findBestMatches(lightestHex, 5);
    const darkMatchesResult = findBestMatches(darkestHex, 5);
    
    setLightMatches(lightMatchesResult);
    setDarkMatches(darkMatchesResult);
    
    toast({ title: 'Analysis Complete', description: 'Foundation matches found!' });
  };

  // Handler functions
  const analyzeSliderInput = () => {
    setLoading(true);
    setTimeout(() => {
      processAndDisplayResults(lightestSlider, darkestSlider);
      setLoading(false);
    }, 100);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(event.target?.result as string);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Scale image
        const maxDim = 500;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round(h * maxDim / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round(w * maxDim / h);
          h = maxDim;
        }
        
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        
        const imageData = ctx.getImageData(0, 0, w, h);
        const result = analyzeImageData(imageData);
        
        if (result) {
          processAndDisplayResults(result.lightestHex, result.darkestHex);
        } else {
          toast({ 
            title: 'Analysis Failed', 
            description: 'Try a clearer, well-lit photo', 
            variant: 'destructive' 
          });
        }
        setLoading(false);
      };
      img.src = event.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    if (stream) {
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraError('');
      return;
    }
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setCameraError('');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      let errorMsg = 'Camera error: ';
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Permission denied. Please allow camera access.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No camera found.';
      } else {
        errorMsg += err.message;
      }
      setCameraError(errorMsg);
    }
  };

  const takeSnapshot = () => {
    if (!stream || !videoRef.current || !canvasRef.current) {
      toast({ title: 'Error', description: 'Camera not ready', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Mirror snapshot
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Stop camera after snapshot
    stream.getTracks().forEach(track => track.stop());
    setStream(null);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = analyzeImageData(imageData);
    
    if (result) {
      processAndDisplayResults(result.lightestHex, result.darkestHex);
    } else {
      toast({ 
        title: 'Analysis Failed', 
        description: 'Try again with better lighting', 
        variant: 'destructive' 
      });
    }
    setLoading(false);
  };

  const analyzeFoundationInput = () => {
    if (!foundationBrandLight || !foundationShadeLight) {
      setFoundationError('Please enter at least the lightest foundation brand and shade');
      return;
    }
    
    setLoading(true);
    setFoundationError('');
    
    // Search for foundation in database
    const brandLightLower = foundationBrandLight.toLowerCase();
    const shadeLightLower = foundationShadeLight.toLowerCase();
    
    const lightMatch = allProducts.find(p =>
      p.brand.toLowerCase().includes(brandLightLower) &&
      p.name.toLowerCase() === shadeLightLower
    );
    
    if (!lightMatch) {
      setFoundationError(`Could not find: "${foundationBrandLight}" - "${foundationShadeLight}"`);
      setLoading(false);
      return;
    }
    
    let darkestHex = lightMatch.hex;
    
    if (foundationBrandDark && foundationShadeDark) {
      const brandDarkLower = foundationBrandDark.toLowerCase();
      const shadeDarkLower = foundationShadeDark.toLowerCase();
      
      const darkMatch = allProducts.find(p =>
        p.brand.toLowerCase().includes(brandDarkLower) &&
        p.name.toLowerCase() === shadeDarkLower
      );
      
      if (darkMatch) {
        darkestHex = darkMatch.hex;
      } else {
        toast({ 
          title: 'Note', 
          description: `Could not find darkest shade. Using lightest shade for both.` 
        });
      }
    }
    
    processAndDisplayResults(lightMatch.hex, darkestHex);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-3xl font-bold text-center mb-6">
          Skin Tone Analyzer & Foundation Matcher
        </h1>
        
        {loading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Analyzing...</p>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="slider" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="slider">
              <Palette className="w-4 h-4 mr-2" />
              Slider
            </TabsTrigger>
            <TabsTrigger value="photo">
              <Upload className="w-4 h-4 mr-2" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="camera">
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="foundation">
              <Search className="w-4 h-4 mr-2" />
              Foundation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="slider" className="space-y-4 mt-6">
            <p className="text-muted-foreground text-sm">
              Adjust the colors to match your lightest and darkest skin tones.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lightest-color">Lightest Shade</Label>
                <Input
                  id="lightest-color"
                  type="color"
                  value={lightestSlider}
                  onChange={(e) => setLightestSlider(e.target.value)}
                  className="h-16 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{lightestSlider}</span>
              </div>
              <div>
                <Label htmlFor="darkest-color">Darkest Shade</Label>
                <Input
                  id="darkest-color"
                  type="color"
                  value={darkestSlider}
                  onChange={(e) => setDarkestSlider(e.target.value)}
                  className="h-16 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{darkestSlider}</span>
              </div>
              <Button onClick={analyzeSliderInput} className="w-full">
                Analyze Colors
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="photo" className="space-y-4 mt-6">
            <p className="text-muted-foreground text-sm">
              Upload a clear, well-lit photo of your face or arm.
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="cursor-pointer"
            />
            {uploadedImage && (
              <img src={uploadedImage} alt="Preview" className="max-w-full h-auto rounded-lg" />
            )}
          </TabsContent>
          
          <TabsContent value="camera" className="space-y-4 mt-6">
            <p className="text-muted-foreground text-sm">
              Use your camera to take a snapshot. Ensure good, natural lighting.
            </p>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-muted"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            {cameraError && (
              <p className="text-sm text-destructive">{cameraError}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={startCamera} className="flex-1">
                {stream ? 'Stop Camera' : 'Start Camera'}
              </Button>
              {stream && (
                <Button onClick={takeSnapshot} variant="secondary" className="flex-1">
                  Take Snapshot
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="foundation" className="space-y-4 mt-6">
            <p className="text-muted-foreground text-sm">
              Enter your best-matching foundation details.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="brand-light">Lightest Foundation Brand</Label>
                <Input
                  id="brand-light"
                  value={foundationBrandLight}
                  onChange={(e) => setFoundationBrandLight(e.target.value)}
                  placeholder="e.g., Fenty Beauty"
                />
              </div>
              <div>
                <Label htmlFor="shade-light">Lightest Foundation Shade</Label>
                <Input
                  id="shade-light"
                  value={foundationShadeLight}
                  onChange={(e) => setFoundationShadeLight(e.target.value)}
                  placeholder="e.g., 150"
                />
              </div>
              <hr className="my-4" />
              <div>
                <Label htmlFor="brand-dark">Darkest Foundation Brand (Optional)</Label>
                <Input
                  id="brand-dark"
                  value={foundationBrandDark}
                  onChange={(e) => setFoundationBrandDark(e.target.value)}
                  placeholder="e.g., NARS"
                />
              </div>
              <div>
                <Label htmlFor="shade-dark">Darkest Foundation Shade (Optional)</Label>
                <Input
                  id="shade-dark"
                  value={foundationShadeDark}
                  onChange={(e) => setFoundationShadeDark(e.target.value)}
                  placeholder="e.g., Syracuse"
                />
              </div>
              {foundationError && (
                <p className="text-sm text-destructive">{foundationError}</p>
              )}
              <Button onClick={analyzeFoundationInput} className="w-full">
                Find Matches
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {analysis && (
          <div className="mt-8 pt-6 border-t space-y-6">
            <h2 className="text-2xl font-semibold">Analysis Results</h2>
            
            {/* Tone Profile */}
            <Card className="p-4 bg-muted/50">
              <h3 className="text-lg font-medium mb-3">Your Tone Profile</h3>
              <div className="flex flex-wrap gap-6 items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Lightest Tone</p>
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-border mb-2"
                    style={{ backgroundColor: analysis.lightestHex }}
                  />
                  <span className="text-xs font-mono">{analysis.lightestHex}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Darkest Tone</p>
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-border mb-2"
                    style={{ backgroundColor: analysis.darkestHex }}
                  />
                  <span className="text-xs font-mono">{analysis.darkestHex}</span>
                </div>
              </div>
              <p className="mt-4 text-sm italic">
                Detected: <strong>{analysis.lightnessDesc}</strong>, <strong>{analysis.undertoneDesc}</strong> Undertone
              </p>
            </Card>
            
            {/* Recommendations */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">
                  Matches for Lightest Tone <span className="text-xs font-mono text-muted-foreground">({analysis.lightestHex})</span>
                </h3>
                <div className="space-y-2">
                  {lightMatches.length > 0 ? (
                    lightMatches.map((match, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border-border flex-shrink-0"
                            style={{ backgroundColor: match.hex }}
                          />
                          <div className="flex-grow">
                            <p className="text-sm font-medium">{match.brand}</p>
                            <p className="text-xs text-muted-foreground">{match.product}</p>
                            <p className="text-xs font-mono">{match.name}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-primary/10 rounded-full">
                          ΔE: {match.deltaE.toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No matches found</p>
                  )}
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-semibold mb-3">
                  Matches for Darkest Tone <span className="text-xs font-mono text-muted-foreground">({analysis.darkestHex})</span>
                </h3>
                <p className="text-xs text-muted-foreground italic mb-2">
                  (Useful for contour or finding your range)
                </p>
                <div className="space-y-2">
                  {darkMatches.length > 0 ? (
                    darkMatches.map((match, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border-border flex-shrink-0"
                            style={{ backgroundColor: match.hex }}
                          />
                          <div className="flex-grow">
                            <p className="text-sm font-medium">{match.brand}</p>
                            <p className="text-xs text-muted-foreground">{match.product}</p>
                            <p className="text-xs font-mono">{match.name}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-primary/10 rounded-full">
                          ΔE: {match.deltaE.toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No matches found</p>
                  )}
                </div>
              </Card>
            </div>
            
            {/* Strategy */}
            <Card className="p-4 bg-primary/5">
              <h3 className="text-lg font-medium mb-3">Strategy & Understanding Your Tones</h3>
              <div className="text-sm space-y-2 leading-relaxed">
                <p>
                  Based on the analysis, your primary (lightest) skin tone appears to be <strong>{analysis.lightnessDesc}</strong> with <strong>{analysis.undertoneDesc}</strong> undertones.
                </p>
                <p>
                  When selecting foundation, prioritize shades with similar undertone characteristics. Your darkest tone suggests a contour shade could be around this depth, typically 2-3 shades deeper.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>LAB values for lightest tone:</strong> L*: {analysis.lightestLab.l.toFixed(1)} (Lightness), 
                  a*: {analysis.lightestLab.a.toFixed(1)} (Green-/Red+), 
                  b*: {analysis.lightestLab.b.toFixed(1)} (Blue-/Yellow+)
                </p>
                <p className="text-xs italic">
                  Always swatch test in natural light on your jawline, letting it dry down completely (5-10 mins) to check for oxidation.
                </p>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ComprehensiveSkinToneAnalyzer;
