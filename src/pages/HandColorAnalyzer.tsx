import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PIGMENT_SKIN_TONES, findClosestSkinTone, type SkinTonePigment } from '@/data/pigmentChart';

const HandColorAnalyzer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SkinTonePigment | null>(null);
  const [averageColor, setAverageColor] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      toast.success('Camera started', { description: 'Position your hand in the frame' });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Camera access denied', { 
        description: 'Please allow camera access to use this feature' 
      });
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);
    
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    toast.success('Photo captured!', { description: 'Analyzing color...' });
    analyzeColor(context, canvas.width, canvas.height);
  };

  const analyzeColor = (context: CanvasRenderingContext2D, width: number, height: number) => {
    setAnalyzing(true);
    
    // Sample from center area (where hand should be)
    const centerX = width / 2;
    const centerY = height / 2;
    const sampleSize = Math.min(width, height) / 3;
    
    const imageData = context.getImageData(
      centerX - sampleSize / 2,
      centerY - sampleSize / 2,
      sampleSize,
      sampleSize
    );
    
    const data = imageData.data;
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;
    
    // Calculate average color, excluding very dark or very light pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Filter out extreme values (shadows/highlights)
      const brightness = (r + g + b) / 3;
      if (brightness > 30 && brightness < 240) {
        totalR += r;
        totalG += g;
        totalB += b;
        pixelCount++;
      }
    }
    
    if (pixelCount > 0) {
      const avgR = Math.round(totalR / pixelCount);
      const avgG = Math.round(totalG / pixelCount);
      const avgB = Math.round(totalB / pixelCount);
      
      const hexColor = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
      setAverageColor(hexColor);
      
      // Find closest match in pigment chart
      const closestTone = findClosestSkinTone(avgR, avgG, avgB);
      setResult(closestTone);
      
      toast.success('Analysis complete!', { 
        description: `Closest match: ${closestTone.description}` 
      });
    } else {
      toast.error('Analysis failed', { 
        description: 'Could not detect skin tone. Please try again with better lighting.' 
      });
    }
    
    setAnalyzing(false);
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    setAverageColor(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Hand Color Analyzer
            </h1>
            <p className="text-lg text-muted-foreground">
              Take a photo of your hand to discover your exact hex color code based on professional pigment mixing
            </p>
          </div>

          {/* Camera/Capture Section */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Capture Your Hand
              </CardTitle>
              <CardDescription>
                Position your hand in good, natural lighting for the most accurate results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!stream && !capturedImage && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-white" />
                  </div>
                  <Button 
                    onClick={startCamera}
                    size="lg"
                    className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              )}

              {stream && !capturedImage && (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-4 border-white/30 pointer-events-none">
                      <div className="absolute inset-1/4 border-2 border-rose-500 rounded-lg">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-rose-500" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-rose-500" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-rose-500" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-rose-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button 
                      onClick={captureImage}
                      size="lg"
                      className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button 
                      onClick={reset}
                      variant="outline"
                      size="lg"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={capturedImage} 
                      alt="Captured hand" 
                      className="w-full h-auto"
                    />
                  </div>
                  <Button 
                    onClick={reset}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Take Another Photo
                  </Button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && averageColor && (
            <Card className="border-2 border-rose-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  Your Color Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Color Swatches */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Detected Color</p>
                    <div 
                      className="h-24 rounded-lg border-2 border-gray-200 shadow-inner"
                      style={{ backgroundColor: averageColor }}
                    />
                    <p className="text-lg font-mono font-bold text-center">{averageColor.toUpperCase()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Closest Match</p>
                    <div 
                      className="h-24 rounded-lg border-2 border-rose-200 shadow-inner"
                      style={{ backgroundColor: result.hexCode }}
                    />
                    <p className="text-lg font-mono font-bold text-center">{result.hexCode.toUpperCase()}</p>
                  </div>
                </div>

                {/* Match Details */}
                <div className="space-y-4 p-4 bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{result.description}</h3>
                    <Badge className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
                      #{result.id}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-white rounded">
                      <p className="font-semibold text-rose-600">R: {result.r}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <p className="font-semibold text-green-600">G: {result.g}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <p className="font-semibold text-blue-600">B: {result.b}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Category</p>
                    <Badge variant="outline" className="text-base">
                      {result.category}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Pigment Mixing Formula</p>
                    <p className="text-sm leading-relaxed p-3 bg-white rounded-lg border border-rose-100">
                      {result.pigmentStrategy}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Use natural daylight for the most accurate color detection</p>
              <p>• Position your hand in the center of the frame</p>
              <p>• Avoid harsh shadows or direct sunlight</p>
              <p>• Make sure your hand fills a good portion of the capture area</p>
              <p>• The analysis is based on the Flesh Tone Color Wheel by Terri Tomlinson</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HandColorAnalyzer;
