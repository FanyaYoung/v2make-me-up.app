import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, Loader2, ExternalLink } from 'lucide-react';
import { createPigmentColor, calculatePigmentMatch, PigmentColor } from '@/lib/pigmentMixing';
import { PigmentColorDisplay } from './PigmentColorDisplay';

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
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [lightestResult, setLightestResult] = useState<{ hex: string; rgb: [number, number, number]; analysis: ColorAnalysis; pigmentColor: PigmentColor } | null>(null);
  const [darkestResult, setDarkestResult] = useState<{ hex: string; rgb: [number, number, number]; analysis: ColorAnalysis; pigmentColor: PigmentColor } | null>(null);
  const [showDarkest, setShowDarkest] = useState(true);
  const [lightestMatches, setLightestMatches] = useState<FoundationMatch[]>([]);
  const [darkestMatches, setDarkestMatches] = useState<FoundationMatch[]>([]);
  const [shadeDatabase, setShadeDatabase] = useState<ShadeData[]>([]);
  
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

  const findMatchingShades = (targetHex: string, limit: number = 5): FoundationMatch[] => {
    if (shadeDatabase.length === 0) return [];

    const matches = shadeDatabase.map(shade => ({
      ...shade,
      distance: colorDistance(targetHex, shade.hex)
    })).sort((a, b) => a.distance - b.distance).slice(0, limit);

    return matches.map(match => {
      const productPigmentColor = createPigmentColor(match.hex);
      return {
        brand: match.brand,
        product: match.product,
        shade_name: match.name || match.description,
        hex: match.hex,
        undertone: '', // Could extract from description if needed
        url: match.url,
        img: match.imgSrc,
        score: 100 - (match.distance / 441.67) * 100, // Normalize to 0-100 score
        pigmentColor: productPigmentColor
      };
    });
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
    setLightestMatches([]);
    setDarkestMatches([]);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-skin-tone', {
        body: { imageBase64: currentImage, analysisType: 'image' }
      });

      if (error) throw error;

      const [rLight, gLight, bLight] = hexToRgb(data.lightest_hex);
      const [rDark, gDark, bDark] = hexToRgb(data.darkest_hex);
      
      const lightPigmentColor = createPigmentColor(data.lightest_hex);
      const darkPigmentColor = createPigmentColor(data.darkest_hex);

      setLightestResult({
        hex: data.lightest_hex,
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

      // Match to product database
      setLoadingMessage("Finding matching foundations in database...");
      
      const lightMatches = findMatchingShades(data.lightest_hex, 5);
      const darkMatches = findMatchingShades(data.darkest_hex, 5);

      setLightestMatches(lightMatches);
      setDarkestMatches(darkMatches);

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

  const ProductMatchCard = ({ match }: { match: FoundationMatch }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {match.img && (
            <img 
              src={match.img} 
              alt={match.shade_name}
              className="w-16 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{match.brand}</h4>
            <p className="text-xs text-muted-foreground truncate">{match.product}</p>
            <p className="text-sm font-medium mt-1">{match.shade_name}</p>
            <div className="flex items-center gap-2 mt-2">
              <div 
                className="w-8 h-8 rounded border-2 border-border"
                style={{ backgroundColor: match.hex }}
              />
              <span className="text-xs font-mono">{match.hex}</span>
            </div>
            {match.url && (
              <a 
                href={match.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
              >
                View Product <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ColorResultCard = ({ 
    title, 
    result,
    matches
  }: { 
    title: string; 
    result: { hex: string; rgb: [number, number, number]; analysis: ColorAnalysis } | null;
    matches: FoundationMatch[];
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

            {matches.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-3">Matching Products:</p>
                <div className="space-y-2">
                  {matches.map((match, idx) => (
                    <ProductMatchCard key={idx} match={match} />
                  ))}
                </div>
              </div>
            )}
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
                          setLightestMatches([]);
                          setDarkestMatches([]);
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
          matches={lightestMatches}
        />
        {showDarkest && (
          <ColorResultCard 
            title="Darkest/Contour Tone" 
            result={darkestResult}
            matches={darkestMatches}
          />
        )}
      </div>
    </div>
  );
};
