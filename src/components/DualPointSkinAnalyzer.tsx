import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  analyzeDualPointSkinTone, 
  extractFaceRegionHexes, 
  getStandardFaceRegions,
  type DualPointAnalysis 
} from '@/lib/dualPointShadeMatching';
import { removeBackground, loadImage } from '@/lib/backgroundRemoval';

interface DualPointSkinAnalyzerProps {
  onAnalysisComplete: (analysis: DualPointAnalysis) => void;
  disabled?: boolean;
}

export default function DualPointSkinAnalyzer({ onAnalysisComplete, disabled }: DualPointSkinAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DualPointAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const resetState = () => {
    setPreviewImage(null);
    setAnalysis(null);
    setError(null);
    setCurrentStep('');
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImage(file);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error) {
      setError('Camera access denied or not available');
      console.error('Camera error:', error);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Stop camera
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
    
    // Convert canvas to blob and process
    canvas.toBlob(async (blob) => {
      if (blob) {
        await processImage(blob);
      }
    }, 'image/jpeg', 0.8);
  }, []);

  const processImage = async (file: Blob) => {
    if (!canvasRef.current) return;
    
    setIsAnalyzing(true);
    setError(null);
    resetState();

    try {
      setCurrentStep('Loading image...');
      const imageElement = await loadImage(file);
      
      setCurrentStep('Removing background...');
      const processedBlob = await removeBackground(imageElement);
      const processedImage = await loadImage(processedBlob);
      
      // Set preview
      const previewUrl = URL.createObjectURL(processedBlob);
      setPreviewImage(previewUrl);
      
      setCurrentStep('Analyzing facial regions...');
      
      // Draw processed image to canvas for analysis
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = processedImage.width;
      canvas.height = processedImage.height;
      ctx.drawImage(processedImage, 0, 0);
      
      // Get face regions
      const faceRegions = getStandardFaceRegions(canvas.width, canvas.height);
      
      setCurrentStep('Extracting skin tones...');
      
      // Extract hex colors from both regions
      const { primaryHex, secondaryHex } = extractFaceRegionHexes(canvas, faceRegions);
      
      setCurrentStep('Performing dual-point analysis...');
      
      // Analyze dual-point skin tone
      const dualPointAnalysis = analyzeDualPointSkinTone(primaryHex, secondaryHex);
      
      setAnalysis(dualPointAnalysis);
      setCurrentStep('Analysis complete!');
      
      // Call parent callback with analysis
      onAnalysisComplete(dualPointAnalysis);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
      setCurrentStep('');
    }
  };

  const getUndertoneColor = (undertone: string) => {
    switch (undertone) {
      case 'Cool': return 'bg-blue-100 text-blue-800';
      case 'Warm': return 'bg-orange-100 text-orange-800';
      case 'Olive': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
            2
          </div>
          Dual-Point Skin Analysis
        </CardTitle>
        <CardDescription>
          Our advanced system analyzes your primary skin tone and shadow areas for the most accurate matches
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload/Camera Controls */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={startCamera}
            disabled={disabled || isAnalyzing || isCameraActive}
            className="h-12"
            variant="outline"
          >
            <Camera className="w-5 h-5 mr-2" />
            Use Camera
          </Button>
          
          <div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isAnalyzing}
              className="h-12 w-full"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Camera View */}
        {isCameraActive && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              className="w-full max-w-md mx-auto rounded-lg border"
              autoPlay
              playsInline
              muted
            />
            <div className="text-center">
              <Button onClick={capturePhoto} size="lg">
                <Camera className="w-5 h-5 mr-2" />
                Capture Photo
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800">{currentStep}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Preview Image */}
        {previewImage && (
          <div className="text-center">
            <img 
              src={previewImage} 
              alt="Processed preview" 
              className="max-w-sm mx-auto rounded-lg border shadow-sm"
            />
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Dual-point analysis complete!</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Primary Tone */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Primary Tone (Front of Face)</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: analysis.primaryTone.hex }}
                  />
                  <div>
                    <p className="font-mono text-sm">{analysis.primaryTone.hex}</p>
                    <p className="text-xs text-gray-600">Confidence: {Math.round(analysis.primaryTone.confidence * 100)}%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Undertone:</span>
                    <Badge className={getUndertoneColor(analysis.primaryTone.undertone)}>
                      {analysis.primaryTone.undertone}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Depth (L*):</span>
                    <span className="text-sm font-medium">{analysis.primaryTone.depth.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Secondary Tone */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Secondary Tone (Shadow Areas)</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: analysis.secondaryTone.hex }}
                  />
                  <div>
                    <p className="font-mono text-sm">{analysis.secondaryTone.hex}</p>
                    <p className="text-xs text-gray-600">Confidence: {Math.round(analysis.secondaryTone.confidence * 100)}%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Undertone:</span>
                    <Badge className={getUndertoneColor(analysis.secondaryTone.undertone)}>
                      {analysis.secondaryTone.undertone}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Depth (L*):</span>
                    <span className="text-sm font-medium">{analysis.secondaryTone.depth.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Tone Difference (ΔE):</span>
                  <span className="font-medium">{analysis.toneDifference.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Undertone Consistency:</span>
                  <Badge variant={analysis.undertoneConsistency ? 'default' : 'secondary'}>
                    {analysis.undertoneConsistency ? 'Consistent' : 'Variable'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}