import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, CheckCircle, Circle, RotateCcw, Square, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GuidedCameraCaptureProps {
  onPhotosCapture: (photos: string[], calibrationData: any) => void;
  onBack: () => void;
}

interface CaptureStep {
  id: string;
  title: string;
  description: string;
  instruction: string;
  completed: boolean;
}

const GuidedCameraCapture: React.FC<GuidedCameraCaptureProps> = ({ 
  onPhotosCapture, 
  onBack 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [calibrationData, setCalibrationData] = useState<any>(null);

  const [captureSteps] = useState<CaptureStep[]>([
    {
      id: 'calibration',
      title: 'Calibration Photo',
      description: 'Hold a white piece of paper next to your face',
      instruction: 'This helps us adjust for your lighting conditions',
      completed: false
    },
    {
      id: 'center-face',
      title: 'Center Face Photo',
      description: 'Look straight at the camera with neutral expression',
      instruction: 'Focus on the center area of your face',
      completed: false
    },
    {
      id: 'left-angle',
      title: 'Left Profile',
      description: 'Turn your face slightly to the left (30 degrees)',
      instruction: 'This captures your jawline and cheek area',
      completed: false
    },
    {
      id: 'right-angle',
      title: 'Right Profile',
      description: 'Turn your face slightly to the right (30 degrees)',
      instruction: 'For complete facial zone analysis',
      completed: false
    }
  ]);

  const initializeCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  }, []);

  React.useEffect(() => {
    initializeCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera, stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const analyzeCalibration = (photoData: string) => {
    // Simulate calibration analysis
    // In a real implementation, this would analyze the white reference card
    return {
      whitePoint: { r: 255, g: 255, b: 255 },
      lightingCondition: 'natural',
      colorTemperature: 5500,
      timestamp: new Date().toISOString()
    };
  };

  const handleCapture = () => {
    const photoData = capturePhoto();
    if (!photoData) {
      toast.error('Failed to capture photo. Please try again.');
      return;
    }

    const newPhotos = [...photos, photoData];
    setPhotos(newPhotos);

    // Handle calibration step
    if (currentStep === 0) {
      const calibData = analyzeCalibration(photoData);
      setCalibrationData(calibData);
      setCalibrationComplete(true);
      toast.success('Calibration complete! Lighting conditions analyzed.');
    }

    // Mark current step as completed
    captureSteps[currentStep].completed = true;

    // Move to next step or complete
    if (currentStep < captureSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      toast.success(`${captureSteps[currentStep].title} captured!`);
    } else {
      // All photos captured
      onPhotosCapture(newPhotos, calibrationData);
      toast.success('All photos captured! Analyzing your skin tone...');
    }
  };

  const retakePhoto = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
    // Remove the last photo
    setPhotos(photos.slice(0, -1));
    captureSteps[currentStep].completed = false;
  };

  const currentStepData = captureSteps[currentStep];
  const progress = ((currentStep + (currentStepData?.completed ? 1 : 0)) / captureSteps.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Guided Photo Capture
            </span>
          </CardTitle>
          <CardDescription className="text-center">
            Follow the steps below for accurate skin tone analysis
          </CardDescription>
          <Progress value={progress} className="w-full mt-4" />
          <p className="text-sm text-gray-500 text-center">
            Step {currentStep + 1} of {captureSteps.length}
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-black"
                  style={{ aspectRatio: '16/9' }}
                />
                
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="w-64 h-80 border-2 border-white border-dashed rounded-full opacity-50"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-white rounded-full opacity-75"></div>
                    </div>
                  </div>
                </div>

                {/* Calibration indicator */}
                {currentStep === 0 && (
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Square className="h-4 w-4" />
                      <span className="text-sm font-medium">Hold white paper here</span>
                    </div>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex justify-center space-x-4 mt-6">
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
                
                {photos.length > 0 && (
                  <Button variant="outline" onClick={retakePhoto}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                )}
                
                <Button 
                  onClick={handleCapture}
                  className="bg-gradient-to-r from-rose-500 to-purple-500"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions and Progress */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentStepData?.title}</CardTitle>
              <CardDescription>{currentStepData?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {currentStepData?.instruction}
              </p>
              
              {currentStep === 0 && !calibrationComplete && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Calibration Required
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Hold a white piece of paper next to your face to calibrate for lighting
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {calibrationComplete && currentStep === 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-sm font-medium text-green-800">
                      Calibration Complete
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Steps Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {captureSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : index === currentStep ? (
                      <Circle className="h-5 w-5 text-rose-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        step.completed ? 'text-green-700' : 
                        index === currentStep ? 'text-rose-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Captured Photos Preview */}
          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Captured Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Captured ${index + 1}`}
                      className="w-full h-20 object-cover rounded-md border"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuidedCameraCapture;