
import React, { useState, useRef, useCallback } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      setStream(mediaStream);
      setIsUsingCamera(true);
      setUploadedImage(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      toast({
        title: "Camera started",
        description: "Position your face in the frame for the best results"
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use virtual try-on",
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
    if (!videoRef.current || !canvasRef.current || !selectedMatch) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
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
        setUploadedImage(e.target?.result as string);
        setIsUsingCamera(false);
        setShowOverlay(true);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const resetTryOn = () => {
    setUploadedImage(null);
    setShowOverlay(false);
    stopCamera();
  };

  const generateFoundationOverlay = () => {
    if (!selectedMatch) return null;
    
    // Create a subtle foundation overlay effect
    const overlayStyle = {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(
        135deg, 
        rgba(${selectedMatch.shade.includes('Light') ? '245,220,200' : 
              selectedMatch.shade.includes('Medium') ? '210,180,140' : '180,140,100'}, 0.15) 0%,
        rgba(${selectedMatch.shade.includes('Light') ? '240,210,180' : 
              selectedMatch.shade.includes('Medium') ? '200,160,120' : '160,120,80'}, 0.25) 50%,
        rgba(${selectedMatch.shade.includes('Light') ? '235,200,170' : 
              selectedMatch.shade.includes('Medium') ? '190,150,110' : '150,110,70'}, 0.15) 100%
      )`,
      mixBlendMode: 'overlay' as const,
      borderRadius: '0.5rem',
      pointerEvents: 'none' as const
    };
    
    return showOverlay ? <div style={overlayStyle} /> : null;
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
                      className="w-full h-full object-cover transform -scale-x-100"
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
                <div className="space-y-2">
                  <Button 
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                </div>
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
