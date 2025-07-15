import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X, RotateCcw, Plus, Trash2, Palette, Loader2, Eye, Grid3X3, Split, Flashlight, Save } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';
import { useToast } from '@/hooks/use-toast';
import { skinToneAnalyzer, SkinToneAnalysis } from './SkinToneAnalyzer';
import { supabase } from '@/integrations/supabase/client';

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
  const [comparisonMode, setComparisonMode] = useState<'single' | 'comparison'>('single');
  const [selectedShades, setSelectedShades] = useState<FoundationMatch[]>([]);
  const [activeShadeIndex, setActiveShadeIndex] = useState(0);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<PhotoData | null>(null);
  
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
      console.log('Starting camera setup...');
      
      // Check if we're on HTTPS or localhost (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('Camera access requires HTTPS or localhost');
      }
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      console.log('Requesting camera permissions...');
      
      // Try different camera constraints if the first fails
      const constraints = [
        { 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        },
        { 
          video: { 
            facingMode: 'user'
          } 
        },
        { 
          video: true
        }
      ];

      let mediaStream: MediaStream | null = null;
      let lastError: Error | null = null;

      for (const constraint of constraints) {
        try {
          console.log('Trying constraint:', constraint);
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('Camera access granted with constraint:', constraint);
          break;
        } catch (err) {
          console.log('Constraint failed:', constraint, err);
          lastError = err as Error;
          continue;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('Failed to access camera with all constraints');
      }
      
      console.log('Media stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      
      setStream(mediaStream);
      setIsUsingCamera(true);
      
      // Check for flash capability
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const capabilities = videoTracks[0].getCapabilities() as any;
        setHasFlash(!!(capabilities.torch || capabilities.fillLightMode));
      }
      
      // Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        console.log('Setting video source...');
        console.log('Video element exists:', !!videoRef.current);
        console.log('Video element display style:', getComputedStyle(videoRef.current).display);
        console.log('Video element visibility:', getComputedStyle(videoRef.current).visibility);
        
        videoRef.current.srcObject = mediaStream;
        
        // Add event listeners for debugging
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          console.log('Video readyState:', videoRef.current?.readyState);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };
        
        videoRef.current.onplay = () => {
          console.log('Video started playing');
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
        };
        
        videoRef.current.onloadstart = () => {
          console.log('Video load start triggered');
        };
        
        videoRef.current.onwaiting = () => {
          console.log('Video waiting for data');
        };
        
        try {
          console.log('Attempting to play video...');
          const playPromise = videoRef.current.play();
          await playPromise;
          console.log('Video play() successful');
        } catch (playError) {
          console.error('Video play failed:', playError);
          // Force video to display even without autoplay
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.playsInline = true;
            console.log('Retrying with forced mute and playsInline...');
            try {
              await videoRef.current.play();
              console.log('Video play() successful on retry');
            } catch (retryError) {
              console.error('Video play retry failed:', retryError);
            }
          }
        }
      } else {
        console.error('Video ref is null!');
      }
      
      toast({
        title: "Camera started",
        description: "Position your face in the frame for the best results"
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = "Please allow camera access to use virtual try-on";
      
      if (error instanceof Error) {
        console.log('Error name:', error.name, 'Message:', error.message);
        
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access was denied. Please enable camera permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found. Please connect a camera and try again.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera access is not supported in this browser.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is already in use by another application. Please close other camera apps and try again.";
        } else if (error.message.includes('HTTPS')) {
          errorMessage = "Camera access requires a secure connection (HTTPS).";
        } else {
          errorMessage = `Camera error: ${error.message}`;
        }
      }
      
      toast({
        title: "Camera access failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Reset state on error
      setIsUsingCamera(false);
      setStream(null);
    }
  }, [toast, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsUsingCamera(false);
  }, [stream]);

  const toggleFlash = useCallback(async () => {
    if (!stream || !hasFlash) return;
    
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      try {
        const constraints: any = {
          advanced: [{ torch: !flashEnabled }]
        };
        await videoTracks[0].applyConstraints(constraints);
        setFlashEnabled(!flashEnabled);
      } catch (error) {
        console.error('Error toggling flash:', error);
        toast({
          title: "Flash control failed",
          description: "Could not toggle camera flash",
          variant: "destructive"
        });
      }
    }
  }, [stream, hasFlash, flashEnabled, toast]);

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
    
    // Convert to blob and create photo
    canvas.toBlob(async (blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const photoId = `photo-${Date.now()}`;
        
        const newPhoto: PhotoData = { id: photoId, url };
        setPendingPhoto(newPhoto);
        setShowSaveDialog(true);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [photos.length, maxPhotos, stopCamera, toast]);

  const handleSavePhoto = useCallback(async (shouldSave: boolean) => {
    if (!pendingPhoto) return;
    
    if (shouldSave) {
      setPhotos(prev => [...prev, pendingPhoto]);
      setActivePhotoIndex(photos.length);
      
      toast({
        title: "Photo saved!",
        description: "Analyzing skin tone..."
      });

      // Analyze the photo
      await analyzePhoto(pendingPhoto);
    } else {
      URL.revokeObjectURL(pendingPhoto.url);
      toast({
        title: "Photo discarded",
        description: "Photo was not saved"
      });
    }
    
    setPendingPhoto(null);
    setShowSaveDialog(false);
  }, [pendingPhoto, photos.length, toast]);

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
    try {
      console.log('Generating recommendations for skin analysis:', analysis);
      
      // Convert depth string to numeric level
      const getDepthLevel = (depth: string): number => {
        switch (depth) {
          case 'fair': return 2;
          case 'light': return 4;
          case 'medium': return 6;
          case 'deep': return 8;
          case 'very-deep': return 10;
          default: return 6;
        }
      };
      
      const dominantDepthLevel = getDepthLevel(analysis.dominantTone.depth);
      
      // Query database for shades that match the analyzed undertone with brand diversity
      const { data: matchingShades, error } = await supabase
        .from('foundation_shades')
        .select(`
          *,
          foundation_products!inner(
            *,
            brands!inner(name, logo_url)
          )
        `)
        .eq('undertone', analysis.dominantTone.undertone)
        .gte('depth_level', Math.max(1, dominantDepthLevel - 2))
        .lte('depth_level', Math.min(10, dominantDepthLevel + 2))
        .eq('is_available', true)
        .limit(20); // Get more results to filter for brand diversity

      if (error) {
        console.error('Error fetching shade recommendations:', error);
        throw error;
      }

      const recommendations: ShadeRecommendation[] = [];
      const usedBrands = new Set<string>();
      const maxPerBrand = 2;
      
      // Process the matching shades with brand diversity
      matchingShades?.forEach((shade, index) => {
        const product = shade.foundation_products;
        const brand = product.brands;
        
        // Limit recommendations per brand for diversity
        const brandCount = Array.from(usedBrands).filter(b => b === brand.name).length;
        if (brandCount >= maxPerBrand && recommendations.length >= 3) {
          return;
        }
        
        usedBrands.add(brand.name);
        
        const foundationMatch: FoundationMatch = {
          id: `${product.id}-${shade.id}`,
          brand: brand.name,
          product: product.name,
          shade: shade.shade_name,
          price: product.price || 36.00,
          rating: 4.3 + (index * 0.1),
          reviewCount: 800 + (index * 100),
          availability: {
            online: true,
            inStore: index < 2,
            readyForPickup: index < 2,
            nearbyStores: index < 2 ? ['Sephora - Downtown', 'Ulta - Mall Plaza'] : []
          },
          matchPercentage: 95 - (index * 2),
          undertone: shade.undertone,
          coverage: product.coverage || 'medium',
          finish: product.finish || 'natural',
          imageUrl: product.image_url || '/placeholder.svg'
        };

        recommendations.push({
          shade: foundationMatch,
          confidence: analysis.dominantTone.confidence,
          targetTone: index === 0 ? 'dominant' : 'secondary'
        });
        
        // Stop when we have enough diverse recommendations
        if (recommendations.length >= 4) {
          return;
        }
      });

      // If we didn't get enough recommendations, add some with different undertones
      if (recommendations.length < 2 && analysis.secondaryTone) {
        const secondaryDepthLevel = getDepthLevel(analysis.secondaryTone.depth);
        
        const { data: alternativeShades } = await supabase
          .from('foundation_shades')
          .select(`
            *,
            foundation_products!inner(
              *,
              brands!inner(name, logo_url)
            )
          `)
          .eq('undertone', analysis.secondaryTone.undertone)
          .gte('depth_level', Math.max(1, secondaryDepthLevel - 1))
          .lte('depth_level', Math.min(10, secondaryDepthLevel + 1))
          .eq('is_available', true)
          .limit(2);

        alternativeShades?.forEach((shade, index) => {
          const product = shade.foundation_products;
          const brand = product.brands;
          
          const foundationMatch: FoundationMatch = {
            id: `${product.id}-${shade.id}-alt`,
            brand: brand.name,
            product: product.name,
            shade: shade.shade_name,
            price: product.price || 36.00,
            rating: 4.1 + (index * 0.1),
            reviewCount: 600 + (index * 100),
            availability: {
              online: true,
              inStore: false,
              readyForPickup: false,
              nearbyStores: []
            },
            matchPercentage: 88 - (index * 3),
            undertone: shade.undertone,
            coverage: product.coverage || 'medium',
            finish: product.finish || 'natural',
            imageUrl: product.image_url || '/placeholder.svg'
          };

          recommendations.push({
            shade: foundationMatch,
            confidence: analysis.secondaryTone.confidence,
            targetTone: 'secondary'
          });
        });
      }

      console.log('Generated recommendations:', recommendations);
      setShadeRecommendations(recommendations);
      
      // Auto-populate shade comparison with recommendations
      const shadesToCompare = recommendations.map(r => r.shade);
      if (selectedMatch && !shadesToCompare.find(s => s.id === selectedMatch.id)) {
        shadesToCompare.unshift(selectedMatch);
      }
      setSelectedShades(shadesToCompare.slice(0, 4)); // Max 4 shades for comparison
      
      onShadeRecommendations?.(recommendations);
    } catch (error) {
      console.error('Error generating shade recommendations:', error);
      
      // Fallback to diverse brand recommendations if database query fails
      const fallbackRecommendations: ShadeRecommendation[] = [
        {
          shade: {
            id: 'fallback-1',
            brand: 'Fenty Beauty',
            product: 'Pro Filt\'r Soft Matte Foundation',
            shade: '260 - Medium with warm undertones',
            price: 36,
            rating: 4.5,
            reviewCount: 1240,
            availability: { 
              online: true, 
              inStore: true, 
              readyForPickup: true, 
              nearbyStores: ['Sephora - Downtown', 'Ulta - Mall Plaza'] 
            },
            matchPercentage: 95,
            undertone: analysis.dominantTone.undertone,
            coverage: 'full',
            finish: 'matte',
            imageUrl: '/placeholder.svg'
          },
          confidence: analysis.dominantTone.confidence,
          targetTone: 'dominant'
        },
        {
          shade: {
            id: 'fallback-2',
            brand: 'Charlotte Tilbury',
            product: 'Airbrush Flawless Foundation',
            shade: '1 Fair',
            price: 44,
            rating: 4.4,
            reviewCount: 1000,
            availability: { 
              online: true, 
              inStore: true, 
              readyForPickup: true, 
              nearbyStores: ['Sephora - Downtown', 'Ulta - Mall Plaza'] 
            },
            matchPercentage: 92,
            undertone: 'neutral',
            coverage: 'full',
            finish: 'natural',
            imageUrl: '/placeholder.svg'
          },
          confidence: analysis.dominantTone.confidence,
          targetTone: 'secondary'
        },
        {
          shade: {
            id: 'fallback-3',
            brand: 'Rare Beauty',
            product: 'Liquid Touch Weightless Foundation',
            shade: '2W Fair',
            price: 29,
            rating: 4.2,
            reviewCount: 750,
            availability: { 
              online: true, 
              inStore: false, 
              readyForPickup: false, 
              nearbyStores: [] 
            },
            matchPercentage: 89,
            undertone: 'warm',
            coverage: 'medium',
            finish: 'natural',
            imageUrl: '/placeholder.svg'
          },
          confidence: analysis.dominantTone.confidence,
          targetTone: 'secondary'
        }
      ];
      
      setShadeRecommendations(fallbackRecommendations);
      onShadeRecommendations?.(fallbackRecommendations);
    }
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
    setSelectedShades([]);
    setComparisonMode('single');
    stopCamera();
  };

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

  const generateFoundationOverlay = (shade?: FoundationMatch) => {
    const shadeToUse = shade || selectedMatch;
    if (!shadeToUse || !showOverlay || !activePhoto) return null;
    
    const shadeColor = getShadeRGB(shadeToUse.shade, shadeToUse.undertone);
    
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

  const addShadeToComparison = (shade: FoundationMatch) => {
    if (selectedShades.length >= 4) {
      toast({
        title: "Maximum shades reached",
        description: "You can compare up to 4 shades at once",
        variant: "destructive"
      });
      return;
    }

    if (!selectedShades.find(s => s.id === shade.id)) {
      setSelectedShades(prev => [...prev, shade]);
    }
  };

  const removeShadeFromComparison = (shadeId: string) => {
    setSelectedShades(prev => prev.filter(s => s.id !== shadeId));
    if (activeShadeIndex >= selectedShades.length - 1) {
      setActiveShadeIndex(Math.max(0, selectedShades.length - 2));
    }
  };

  return (
    <div className="sticky top-8">
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <button
              onClick={startCamera}
              className="flex items-center gap-2 hover:text-rose-600 transition-colors"
              disabled={isUsingCamera}
            >
              <Camera className="w-5 h-5" />
              Virtual Try-On
            </button>
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
                <div className="relative w-full h-full bg-gray-200">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)',
                      backgroundColor: '#000'
                    }}
                    onLoadedData={() => console.log('Video loaded data')}
                    onLoadStart={() => console.log('Video load start')}
                    onCanPlayThrough={() => console.log('Video can play through')}
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
                    {hasFlash && (
                      <Button
                        onClick={toggleFlash}
                        variant="outline"
                        className="bg-white text-gray-800 hover:bg-gray-100 rounded-full w-12 h-12 shadow-lg"
                      >
                        <Flashlight className={`w-5 h-5 ${flashEnabled ? 'text-yellow-500' : 'text-gray-500'}`} />
                      </Button>
                    )}
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
                  <div className="absolute top-4 right-4 text-white text-xs bg-black/50 px-2 py-1 rounded">
                    {stream ? 'Stream Active' : 'No Stream'}
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
                {/* View Toggle */}
                {selectedShades.length > 1 && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setComparisonMode('single')}
                      variant={comparisonMode === 'single' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Single View
                    </Button>
                    <Button 
                      onClick={() => setComparisonMode('comparison')}
                      variant={comparisonMode === 'comparison' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                    >
                      <Split className="w-4 h-4 mr-1" />
                      Compare
                    </Button>
                  </div>
                )}

                {activePhoto && selectedMatch && comparisonMode === 'single' && (
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

            {/* Shade Comparison View */}
            {comparisonMode === 'comparison' && selectedShades.length > 0 && activePhoto && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  Shade Comparison
                </h4>
                
                {/* Comparison Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedShades.slice(0, 4).map((shade, index) => (
                    <div key={shade.id} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        <img 
                          src={activePhoto.url} 
                          alt={`Comparison ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {generateFoundationOverlay(shade)}
                        <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs p-1 rounded text-center">
                          <div className="truncate">{shade.brand}</div>
                          <div className="truncate text-[10px]">{shade.shade}</div>
                        </div>
                        <button
                          onClick={() => removeShadeFromComparison(shade.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add more shades button */}
                  {selectedShades.length < 4 && (
                    <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Add Shade</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shade Selection from Recommendations */}
                {shadeRecommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">Add to comparison:</p>
                    <div className="flex flex-wrap gap-1">
                      {shadeRecommendations.map((rec, index) => (
                        <button
                          key={index}
                          onClick={() => addShadeToComparison(rec.shade)}
                          disabled={selectedShades.find(s => s.id === rec.shade.id) !== undefined}
                          className="px-2 py-1 text-xs bg-rose-100 text-rose-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-200"
                        >
                          {rec.shade.brand} - {rec.shade.shade}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Save Photo Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Save this photo?
            </DialogTitle>
            <DialogDescription>
              Would you like to save this photo for virtual try-on analysis? The photo will be used to match foundation shades to your skin tone.
            </DialogDescription>
          </DialogHeader>
          
          {pendingPhoto && (
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={pendingPhoto.url} 
                alt="Captured photo preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleSavePhoto(false)}
            >
              Discard
            </Button>
            <Button onClick={() => handleSavePhoto(true)}>
              <Save className="w-4 h-4 mr-2" />
              Save Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualTryOn;