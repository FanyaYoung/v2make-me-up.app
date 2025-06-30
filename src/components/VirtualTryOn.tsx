
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';
import { useToast } from '@/hooks/use-toast';

interface VirtualTryOnProps {
  selectedMatch: FoundationMatch | null;
}

const VirtualTryOn = ({ selectedMatch }: VirtualTryOnProps) => {
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
      setUploadedImage(null);
      
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

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !selectedMatch) {
      console.log('Missing requirements for photo capture');
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
    
    // Convert to blob and set as uploaded image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setUploadedImage(url);
        setShowOverlay(true);
        stopCamera();
        
        toast({
          title: "Photo captured!",
          description: "Applying virtual foundation..."
        });
      }
    }, 'image/jpeg', 0.8);
  }, [selectedMatch, stopCamera, toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setUploadedImage(result);
          setIsUsingCamera(false);
          setShowOverlay(true);
          stopCamera();
          
          toast({
            title: "Image uploaded",
            description: "Virtual try-on ready!"
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetTryOn = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
    }
    setUploadedImage(null);
    setShowOverlay(false);
    stopCamera();
  };

  const generateFoundationOverlay = () => {
    if (!selectedMatch || !showOverlay) return null;
    
    // Generate more realistic foundation colors based on shade name and undertone
    const getShadeRGB = (shade: string, undertone: string) => {
      const undertoneMap = {
        warm: { r: 210, g: 170, b: 130 },
        cool: { r: 240, g: 215, b: 195 },
        neutral: { r: 220, g: 185, b: 155 },
        yellow: { r: 200, g: 165, b: 115 },
        pink: { r: 235, g: 195, b: 175 },
        red: { r: 190, g: 145, b: 115 },
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
      } else if (shadeLower.includes('rich') || shadeLower.includes('espresso')) {
        multiplier = 0.45;
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
          </CardTitle>
          <p className="text-sm text-gray-600">
            {selectedMatch ? `Try ${selectedMatch.brand} ${selectedMatch.shade}` : 'Select a foundation to start'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMatch ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-rose-50 to-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">{selectedMatch.brand}</h4>
                <p className="text-sm text-gray-600">{selectedMatch.product}</p>
                <p className="text-rose-600 font-semibold">{selectedMatch.shade}</p>
              </div>
              
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
                        className="bg-white text-gray-800 hover:bg-gray-100 rounded-full w-16 h-16 shadow-lg"
                      >
                        <Camera className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                ) : uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={uploadedImage} 
                      alt="Virtual try-on preview"
                      className="w-full h-full object-cover"
                    />
                    {generateFoundationOverlay()}
                    <div className="absolute top-4 right-4 z-10">
                      <Button
                        onClick={resetTryOn}
                        variant="outline"
                        size="icon"
                        className="bg-white/80 backdrop-blur-sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Start your virtual try-on</p>
                    </div>
                  </div>
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              {!isUsingCamera && !uploadedImage && (
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
                    Upload Photo
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
              
              {uploadedImage && (
                <div className="space-y-2">
                  <Button 
                    onClick={() => setShowOverlay(!showOverlay)}
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {showOverlay ? 'Remove' : 'Apply'} Foundation
                  </Button>
                  
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Match Confidence:</span>
                      <span className="font-semibold text-green-600">{selectedMatch.matchPercentage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coverage:</span>
                      <span className="font-semibold capitalize">{selectedMatch.coverage}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Finish:</span>
                      <span className="font-semibold capitalize">{selectedMatch.finish}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a foundation match to start virtual try-on</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualTryOn;
