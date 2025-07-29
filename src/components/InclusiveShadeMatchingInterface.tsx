import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Target, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Palette,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { inclusiveShadeAnalyzer, type InclusiveSkinToneAnalysis } from './InclusiveShadeAnalyzer';
import FoundationEducationTips from './FoundationEducationTips';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface InclusiveShadeMatchingInterfaceProps {
  onAnalysisComplete: (analysis: InclusiveSkinToneAnalysis) => void;
  onUpgradeClick?: () => void;
}

export default function InclusiveShadeMatchingInterface({ 
  onAnalysisComplete,
  onUpgradeClick 
}: InclusiveShadeMatchingInterfaceProps) {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<InclusiveSkinToneAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState<'capture' | 'analyzing' | 'results'>('capture');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Unable to access camera. Please try uploading an image instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();
    
    toast.success('Photo captured! Ready for analysis.');
  }, [stopCamera]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        toast.success('Image uploaded! Ready for analysis.');
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please upload a valid image file.');
    }
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!capturedImage) {
      toast.error('Please capture or upload an image first.');
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep('analyzing');
    setAnalysisProgress(0);
    setError(null);

    try {
      // Create image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = capturedImage;
      });

      // Simulate realistic analysis progress with educational tips
      const progressSteps = [
        { progress: 10, message: 'Initializing AI models...' },
        { progress: 25, message: 'Detecting facial regions...' },
        { progress: 40, message: 'Analyzing skin tone patterns...' },
        { progress: 55, message: 'Applying multiple reference systems...' },
        { progress: 70, message: 'Correcting color bias...' },
        { progress: 85, message: 'Calculating confidence metrics...' },
        { progress: 95, message: 'Synthesizing final analysis...' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress(step.progress);
        console.log(step.message);
      }

      // Perform actual analysis
      const analysis = await inclusiveShadeAnalyzer.analyzeInclusiveSkinTone(img);
      
      setAnalysisProgress(100);
      setAnalysisResult(analysis);
      setCurrentStep('results');
      onAnalysisComplete(analysis);

      // Track usage in database
      if (user) {
        await supabase.from('user_match_usage').insert({
          user_id: user.id,
          match_type: 'inclusive_shade_analysis',
          metadata: {
            confidence: analysis.dominantTone.confidence,
            reference_system: analysis.dominantTone.referenceSystem,
            bias_correction: analysis.biasCorrection.adjustmentType,
            quality_score: analysis.qualityMetrics.overallConfidence
          }
        });
      }

      toast.success('Analysis complete! Your inclusive shade profile is ready.');
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      toast.error('Analysis failed. Please try again with a clearer image.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedImage, user, onAnalysisComplete]);

  const resetAnalysis = useCallback(() => {
    setCurrentStep('capture');
    setCapturedImage(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setError(null);
    stopCamera();
  }, [stopCamera]);

  const renderCaptureInterface = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Inclusive Shade Analysis</h2>
        <p className="text-muted-foreground">
          Capture or upload a clear photo of your face for accurate, bias-free shade matching
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          For best results: Use natural lighting, face the camera directly, and ensure your face fills most of the frame.
        </AlertDescription>
      </Alert>

      {!capturedImage && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Camera Capture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Take Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!stream ? (
                <Button onClick={startCamera} className="w-full">
                  Start Camera
                </Button>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <Button onClick={capturePhoto} className="w-full">
                    Capture Photo
                  </Button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                Choose Image
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {capturedImage && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <img 
                src={capturedImage} 
                alt="Captured for analysis"
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <div className="flex gap-2 justify-center">
                <Button onClick={analyzeImage} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Analyze Shade
                </Button>
                <Button variant="outline" onClick={resetAnalysis}>
                  Retake
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAnalysisInterface = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Analyzing Your Shade</h2>
        <p className="text-muted-foreground">
          Our AI is applying multiple reference systems for the most accurate analysis
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Analysis Progress</span>
              <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <FoundationEducationTips 
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        onUpgradeClick={onUpgradeClick}
      />
    </div>
  );

  const renderResults = () => {
    if (!analysisResult) return null;

    const { dominantTone, biasCorrection, multipleReferences, qualityMetrics } = analysisResult;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Your Inclusive Shade Profile</h2>
          <p className="text-muted-foreground">
            Analysis complete with {Math.round(dominantTone.confidence * 100)}% confidence
          </p>
        </div>

        {/* Main Result */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Your Perfect Shade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full border-2 border-border shadow-md"
                style={{ backgroundColor: dominantTone.hex }}
              />
              <div>
                <p className="font-semibold text-lg">{dominantTone.hex}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{dominantTone.undertone}</Badge>
                  <Badge variant="outline">{dominantTone.depth}</Badge>
                  <Badge className="bg-primary/10 text-primary">
                    {dominantTone.referenceSystem.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium">Confidence</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(dominantTone.confidence * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Quality Score</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(qualityMetrics.overallConfidence * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bias Correction */}
        {biasCorrection.adjustmentType !== 'none' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Bias Correction Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: biasCorrection.originalHex }}
                    title="Original"
                  />
                  <span className="text-muted-foreground">→</span>
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: biasCorrection.correctedHex }}
                    title="Corrected"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {biasCorrection.adjustmentType === 'yellow-reduction' 
                      ? 'Yellow Bias Reduced' 
                      : 'Warmth Enhanced'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confidence improved by {Math.round(biasCorrection.confidenceImprovement * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Multiple Reference Systems */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Reference System Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">ITA° Angle</p>
                <p className="text-lg font-semibold">{Math.round(multipleReferences.itaAngle)}°</p>
              </div>
              <div>
                <p className="text-sm font-medium">Massey-Martin Scale</p>
                <p className="text-lg font-semibold">{multipleReferences.masseyMartinScale}/10</p>
              </div>
              <div>
                <p className="text-sm font-medium">CASCo Classification</p>
                <p className="text-lg font-semibold">{multipleReferences.cascoClassification}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Depth Level</p>
                <p className="text-lg font-semibold">{multipleReferences.customDepthLevel}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button onClick={resetAnalysis} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Analyze Another Photo
          </Button>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {currentStep === 'capture' && renderCaptureInterface()}
      {currentStep === 'analyzing' && renderAnalysisInterface()}
      {currentStep === 'results' && renderResults()}
    </div>
  );
}