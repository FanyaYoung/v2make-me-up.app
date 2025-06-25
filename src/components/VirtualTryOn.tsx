
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';

interface VirtualTryOnProps {
  selectedMatch: FoundationMatch | null;
}

const VirtualTryOn = ({ selectedMatch }: VirtualTryOnProps) => {
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setIsUsingCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = () => {
    setIsUsingCamera(true);
    setUploadedImage(null);
    // In a real app, this would access the user's camera
    console.log('Starting camera for virtual try-on...');
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
            See how the foundation looks on you
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMatch ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-rose-50 to-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">{selectedMatch.brand}</h4>
                <p className="text-sm text-gray-600">{selectedMatch.shade}</p>
              </div>
              
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                {uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={uploadedImage} 
                      alt="Virtual try-on preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <p className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                        Foundation applied virtually
                      </p>
                    </div>
                  </div>
                ) : isUsingCamera ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Camera preview would appear here</p>
                      <p className="text-gray-500 text-xs">In development</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Upload a photo or use camera</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={startCamera}
                  className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Use Camera
                </Button>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Upload Photo
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {(uploadedImage || isUsingCamera) && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Match Confidence:</span>
                    <span className="font-semibold text-green-600">{selectedMatch.matchPercentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Undertone Match:</span>
                    <span className="font-semibold">Excellent</span>
                  </div>
                </div>
              )}
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
