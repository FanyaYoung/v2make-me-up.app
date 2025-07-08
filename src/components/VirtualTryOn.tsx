import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, RotateCcw, Plus, Trash2, Palette, Loader2 } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';
import { useToast } from '@/hooks/use-toast';
import { skinToneAnalyzer, SkinToneAnalysis } from './SkinToneAnalyzer';

interface PhotoData {
  id: string;
  url: string;
  analysis?: SkinToneAnalysis;
}

interface ShadeRecommendation {
  shade: FoundationMatch;
  confidence: number;
  targetTone: 'dominant' | 'secondary';
}

interface VirtualTryOnProps {
  selectedMatch: FoundationMatch | null;
  onShadeRecommendations?: (recommendations: ShadeRecommendation[]) => void;
}

const VirtualTryOn = ({ selectedMatch, onShadeRecommendations }: VirtualTryOnProps) => {
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shadeRecommendations, setShadeRecommendations] = useState<ShadeRecommendation[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const activePhoto = photos[activePhotoIndex] || null;
  const maxPhotos = 3;

  // Cleanup camera stream and photos on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      photos.forEach(photo => {
        URL.revokeObjectURL(photo.url);
      });
    };
  }, [stream, photos]);

  const startCamera = useCallback(async () => {
    try {
      console.log('Requesting camera access...');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      console.log('Camera access granted');
      setStream(mediaStream);
      setIsUsingCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      toast({
        title: "Camera started",
        description: "Position your face in the frame for the best results"
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = "Please allow camera access to use virtual try-on";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access was denied. Please enable camera permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found. Please connect a camera and try again.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera access is not supported in this browser.";
        }
      }
      
      toast({
        title: "Camera access failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsUsingCamera(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Missing requirements for photo capture');
      return;
    }

    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum photos reached",
        description: `You can only upload up to ${maxPhotos} photos`,
        variant: "destructive"
      });
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Draw the video frame
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob and add to photos
    canvas.toBlob(async (blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const photoId = `photo-${Date.now()}`;
        
        const newPhoto: PhotoData = { id: photoId, url };
        setPhotos(prev => [...prev, newPhoto]);
        setActivePhotoIndex(photos.length);
        stopCamera();
        
        toast({
          title: "Photo captured!",
          description: "Analyzing skin tone..."
        });

        // Analyze the photo
        await analyzePhoto(newPhoto);
      }
    }, 'image/jpeg', 0.8);
  }, [photos.length, maxPhotos, stopCamera, toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Too many photos",
        description: `You can only upload up to ${maxPhotos} photos total`,
        variant: "destructive"
      });
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: `${file.name} is too large. Please select images under 5MB`,
          variant: "destructive"
        });
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const photoId = `photo-${Date.now()}-${Math.random()}`;
          const newPhoto: PhotoData = { id: photoId, url: result };
          
          setPhotos(prev => [...prev, newPhoto]);
          setActivePhotoIndex(photos.length);
          setIsUsingCamera(false);
          stopCamera();
          
          toast({
            title: "Image uploaded",
            description: "Analyzing skin tone..."
          });

          // Analyze the photo
          await analyzePhoto(newPhoto);
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Clear the file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const analyzePhoto = async (photo: PhotoData) => {
    try {
      setIsAnalyzing(true);
      
      // Create image element for analysis
      const img = new Image();
      img.onload = async () => {
        try {
          const analysis = await skinToneAnalyzer.analyzeSkinTone(img);
          
          // Update photo with analysis
          setPhotos(prev => prev.map(p => 
            p.id === photo.id ? { ...p, analysis } : p
          ));

          // Generate shade recommendations
          await generateShadeRecommendations(analysis);
          
          toast({
            title: "Analysis complete",
            description: `Detected ${analysis.dominantTone.undertone} undertone with ${analysis.dominantTone.depth} depth`
          });
        } catch (error) {
          console.error('Error analyzing skin tone:', error);
          toast({
            title: "Analysis failed",
            description: "Could not analyze skin tone. Please try another photo.",
            variant: "destructive"
          });
        } finally {
          setIsAnalyzing(false);
        }
      };
      img.src = photo.url;
    } catch (error) {
      console.error('Error setting up analysis:', error);
      setIsAnalyzing(false);
    }
  };

  const generateShadeRecommendations = async (analysis: SkinToneAnalysis) => {
    // Mock implementation - in real app, this would query the database
    const mockRecommendations: ShadeRecommendation[] = [
      {
        shade: {
          id: 'rec-1',
          brand: 'Fenty Beauty',
          product: 'Pro Filt\'r Foundation',
          shade: '210 - Medium',
          price: 36,
          rating: 4.5,
          reviewCount: 1240,
          availability: { online: true, inStore: true, readyForPickup: true, nearbyStores: [] },
          matchPercentage: 95,
          undertone: analysis.dominantTone.undertone,
          coverage: 'medium',
          finish: 'matte',
          imageUrl: '/placeholder.svg'
        },
        confidence: analysis.dominantTone.confidence,
        targetTone: 'dominant'
      }
    ];

    if (analysis.secondaryTone) {
      mockRecommendations.push({
        shade: {
          id: 'rec-2',
          brand: 'Charlotte Tilbury',
          product: 'Airbrush Flawless Foundation',
          shade: '6 Medium',
          price: 44,
          rating: 4.3,
          reviewCount: 850,
          availability: { online: true, inStore: true, readyForPickup: true, nearbyStores: [] },
          matchPercentage: 88,
          undertone: analysis.secondaryTone.undertone,
          coverage: 'full',
          finish: 'natural',
          imageUrl: '/placeholder.svg'
        },
        confidence: analysis.secondaryTone.confidence,
        targetTone: 'secondary'
      });
    }

    setShadeRecommendations(mockRecommendations);
    onShadeRecommendations?.(mockRecommendations);
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.url);
      }
      return prev.filter(p => p.id !== photoId);
    });
    
    // Adjust active index if needed
    if (activePhotoIndex >= photos.length - 1) {
      setActivePhotoIndex(Math.max(0, photos.length - 2));
    }
  };

  const resetTryOn = () => {
    photos.forEach(photo => {
      URL.revokeObjectURL(photo.url);
    });
    setPhotos([]);
    setActivePhotoIndex(0);
    setShowOverlay(false);
    setShadeRecommendations([]);
    stopCamera();
  };

  const generateFoundationOverlay = () => {
    if (!selectedMatch || !showOverlay || !activePhoto) return null;
    
    // Generate foundation colors based on analysis or default
    const getShadeRGB = (shade: string, undertone: string) => {
      const undertoneMap = {
        warm: { r: 210, g: 170, b: 130 },
        cool: { r: 240, g: 215, b: 195 },
        neutral: { r: 220, g: 185, b: 155 },
        olive: { r: 180, g: 155, b: 115 }
      };
      
      const base = undertoneMap[undertone.toLowerCase() as keyof typeof undertoneMap] || undertoneMap.neutral;
      
      // Adjust for shade depth
      const shadeLower = shade.toLowerCase();
      let multiplier = 1;
      
      if (shadeLower.includes('fair') || shadeLower.includes('light')) {
        multiplier = 1.15;
      } else if (shadeLower.includes('medium')) {
        multiplier = 0.85;
      } else if (shadeLower.includes('deep') || shadeLower.includes('dark')) {
        multiplier = 0.65;
      }
      
      return {
        r: Math.min(255, Math.round(base.r * multiplier)),
        g: Math.min(255, Math.round(base.g * multiplier)),
        b: Math.min(255, Math.round(base.b * multiplier))
      };
    };
    
    const shadeColor = getShadeRGB(selectedMatch.shade, selectedMatch.undertone);
    
    return (
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: `linear-gradient(
            135deg, 
            rgba(${shadeColor.r}, ${shadeColor.g}, ${shadeColor.b}, 0.2) 0%,
            rgba(${shadeColor.r}, ${shadeColor.g}, ${shadeColor.b}, 0.3) 50%,
            rgba(${shadeColor.r}, ${shadeColor.g}, ${shadeColor.b}, 0.2) 100%
          )`,
          mixBlendMode: 'multiply'
        }}
      />
    );
  };

  return (
    <div className="sticky top-8">
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" />
            Virtual Try-On
            {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {selectedMatch ? `Try ${selectedMatch.brand} ${selectedMatch.shade}` : 'Upload up to 3 photos for analysis'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo Management */}
          <div className="space-y-4">
            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div className="flex gap-2 justify-center">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="relative">
                    <button
                      onClick={() => setActivePhotoIndex(index)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        index === activePhotoIndex ? 'border-rose-500' : 'border-gray-200'
                      }`}
                    >
                      <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {photo.analysis && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <Palette className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < maxPhotos && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-rose-400 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-gray-400" />
                  </button>
                )}
              </div>
            )}

            {/* Main photo display */}
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
              {isUsingCamera ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Button
                      onClick={capturePhoto}
                      disabled={photos.length >= maxPhotos}
                      className="bg-white text-gray-800 hover:bg-gray-100 rounded-full w-16 h-16 shadow-lg disabled:opacity-50"
                    >
                      <Camera className="w-6 h-6" />
                    </Button>
                  </div>
                  <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    {photos.length}/{maxPhotos} photos
                  </div>
                </div>
              ) : activePhoto ? (
                <div className="relative w-full h-full">
                  <img 
                    src={activePhoto.url} 
                    alt="Virtual try-on preview"
                    className="w-full h-full object-cover"
                  />
                  {generateFoundationOverlay()}
                  {activePhoto.analysis && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white text-xs p-2 rounded">
                      <div>Undertone: {activePhoto.analysis.dominantTone.undertone}</div>
                      <div>Depth: {activePhoto.analysis.dominantTone.depth}</div>
                      {activePhoto.analysis.secondaryTone && (
                        <div className="mt-1 pt-1 border-t border-white/30">
                          Secondary: {activePhoto.analysis.secondaryTone.undertone}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Add photos to start analysis</p>
                    <p className="text-gray-500 text-xs">Up to {maxPhotos} photos</p>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            
            {/* Controls */}
            {!isUsingCamera && photos.length === 0 && (
              <div className="space-y-2">
                <Button 
                  onClick={startCamera}
                  className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
              </div>
            )}
            
            {isUsingCamera && (
              <Button 
                onClick={stopCamera}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            )}

            {photos.length > 0 && (
              <div className="space-y-2">
                {activePhoto && selectedMatch && (
                  <Button 
                    onClick={() => setShowOverlay(!showOverlay)}
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {showOverlay ? 'Remove' : 'Apply'} Foundation
                  </Button>
                )}
                
                <Button 
                  onClick={resetTryOn}
                  variant="outline"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Photos
                </Button>
              </div>
            )}

            {/* Shade Recommendations */}
            {shadeRecommendations.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 text-sm">Recommended Shades</h4>
                {shadeRecommendations.map((rec, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{rec.shade.brand}</p>
                        <p className="text-xs text-gray-600">{rec.shade.shade}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{rec.shade.matchPercentage}%</p>
                        <p className="text-xs text-gray-500 capitalize">{rec.targetTone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualTryOn;