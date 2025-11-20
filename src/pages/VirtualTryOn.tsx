import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, ShoppingCart, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

interface ProductPair {
  lightProduct: any;
  darkProduct: any;
  brand: string;
}

const VirtualTryOn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [recommendationHistory, setRecommendationHistory] = useState<ProductPair[][]>([]);
  const [currentRecommendations, setCurrentRecommendations] = useState<ProductPair[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load initial products from navigation state
  useEffect(() => {
    const products = location.state?.products as ProductPair[] | undefined;
    const initialImage = location.state?.image as string | undefined;
    
    if (products && products.length > 0) {
      setCurrentRecommendations(products);
      setRecommendationHistory([products]);
      if (initialImage) {
        setCapturedImage(initialImage);
      }
    } else {
      toast.error('No products to try on. Please start from AI Shade Match.');
      navigate('/shade-matcher');
    }
  }, [location.state, navigate]);

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getNewRecommendations = async () => {
    if (!capturedImage) {
      toast.error('Please capture or upload a photo first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-skin-tone', {
        body: { image: capturedImage }
      });

      if (error) throw error;

      const { lightestHex, darkestHex } = data;
      
      // Load CSV and find new matches
      const response = await fetch('/data/allShades.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1);
      
      const shadeDatabase = lines.map(line => {
        const parts = line.split(',');
        return {
          brand: parts[0]?.trim() || '',
          product: parts[1]?.trim() || '',
          shade: parts[2]?.trim() || '',
          hex: parts[3]?.trim() || '',
          imgSrc: parts[4]?.trim() || ''
        };
      }).filter(item => item.hex && item.hex.match(/^#[0-9A-F]{6}$/i));

      // Find new brand pairs
      const brandMap = new Map<string, any[]>();
      shadeDatabase.forEach(shade => {
        if (!brandMap.has(shade.brand)) {
          brandMap.set(shade.brand, []);
        }
        brandMap.get(shade.brand)!.push(shade);
      });

      // Fetch Rakuten data for products
      const newPairs: ProductPair[] = [];
      for (const [brand, shades] of Array.from(brandMap.entries()).slice(0, 4)) {
        const lightMatches = shades
          .map(s => ({ ...s, distance: colorDistance(lightestHex, s.hex) }))
          .sort((a, b) => a.distance - b.distance);
        
        const darkMatches = shades
          .map(s => ({ ...s, distance: colorDistance(darkestHex, s.hex) }))
          .sort((a, b) => a.distance - b.distance);

        if (lightMatches.length > 0 && darkMatches.length > 0) {
          const light = lightMatches[0];
          const dark = darkMatches[0];
          
          // Try to fetch Rakuten data
          try {
            const { data: rakutenData } = await supabase.functions.invoke('rakuten-product-search', {
              body: { brand: light.brand, productName: light.product, limit: 1 }
            });
            
            if (rakutenData?.products?.[0]) {
              light.imageUrl = rakutenData.products[0].imageUrl;
              light.price = rakutenData.products[0].price || 45;
            }
          } catch (error) {
            console.error('Rakuten fetch error:', error);
          }

          newPairs.push({
            brand,
            lightProduct: light,
            darkProduct: dark
          });
        }
      }

      setCurrentRecommendations(newPairs);
      setRecommendationHistory(prev => [...prev, newPairs]);
      setSelectedProductIndex(null);
      toast.success('New recommendations generated!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate new recommendations');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const colorDistance = (hex1: string, hex2: string): number => {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
  };

  const handleBuyProduct = (product: any, type: 'light' | 'dark') => {
    const foundationMatch: any = {
      id: `${product.brand}-${product.shade}`,
      brand: product.brand,
      shade: product.shade,
      product: product.product,
      price: product.price || 45,
      image: product.imageUrl || product.imgSrc,
      undertone: 'neutral',
      url: '',
      hex: product.hex
    };
    addToCart(foundationMatch);
    toast.success(`Added ${type} shade to cart!`);
  };

  const handleBuySet = (pair: ProductPair) => {
    const lightMatch: any = {
      id: `${pair.brand}-${pair.lightProduct.shade}`,
      brand: pair.brand,
      shade: pair.lightProduct.shade,
      product: pair.lightProduct.product,
      price: pair.lightProduct.price || 45,
      image: pair.lightProduct.imageUrl || pair.lightProduct.imgSrc,
      undertone: 'neutral',
      url: '',
      hex: pair.lightProduct.hex
    };
    const darkMatch: any = {
      id: `${pair.brand}-${pair.darkProduct.shade}`,
      brand: pair.brand,
      shade: pair.darkProduct.shade,
      product: pair.darkProduct.product,
      price: pair.darkProduct.price || 45,
      image: pair.darkProduct.imageUrl || pair.darkProduct.imgSrc,
      undertone: 'neutral',
      url: '',
      hex: pair.darkProduct.hex
    };
    addToCart(lightMatch);
    addToCart(darkMatch);
    toast.success('Added both shades to cart!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/shade-matcher')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to AI Shade Match
        </Button>

        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Virtual Try-On
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Camera/Upload Section */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="camera" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="camera">
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="camera" className="space-y-4">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {capturedImage ? (
                      <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="flex gap-2">
                    {!cameraActive && !capturedImage && (
                      <Button onClick={startCamera} className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    )}
                    {cameraActive && (
                      <>
                        <Button onClick={takeSnapshot} className="flex-1">
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                        <Button onClick={stopCamera} variant="outline">
                          Cancel
                        </Button>
                      </>
                    )}
                    {capturedImage && (
                      <Button
                        onClick={() => {
                          setCapturedImage(null);
                          startCamera();
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Retake
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    {capturedImage ? (
                      <img src={capturedImage} alt="Uploaded" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Upload a photo to try on products</p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photo
                  </Button>
                </TabsContent>
              </Tabs>

              {capturedImage && (
                <Button
                  onClick={getNewRecommendations}
                  disabled={isAnalyzing}
                  className="w-full mt-4"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Get New Recommendations'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Try-On Preview - Before/After Comparison */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Before & After Comparison</h2>
              <div className="space-y-4">
                {capturedImage && selectedProductIndex !== null ? (
                  <>
                    {/* Before */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">BEFORE</p>
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img src={capturedImage} alt="Before" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    
                    {/* After */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">AFTER (with foundation)</p>
                      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        <img src={capturedImage} alt="After" className="w-full h-full object-cover" />
                        
                        {/* Light shade overlay for highlight areas (forehead, nose bridge, chin) */}
                        <div 
                          className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-30"
                          style={{
                            background: `radial-gradient(ellipse 35% 20% at 50% 25%, ${currentRecommendations[selectedProductIndex].lightProduct.hex}DD, transparent 70%),
                                        radial-gradient(ellipse 15% 25% at 50% 50%, ${currentRecommendations[selectedProductIndex].lightProduct.hex}DD, transparent 70%),
                                        radial-gradient(ellipse 25% 15% at 50% 75%, ${currentRecommendations[selectedProductIndex].lightProduct.hex}DD, transparent 70%)`
                          }}
                        />
                        
                        {/* Dark shade overlay for contour areas (cheeks, jawline) */}
                        <div 
                          className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-25"
                          style={{
                            background: `radial-gradient(ellipse 25% 30% at 25% 55%, ${currentRecommendations[selectedProductIndex].darkProduct.hex}CC, transparent 60%),
                                        radial-gradient(ellipse 25% 30% at 75% 55%, ${currentRecommendations[selectedProductIndex].darkProduct.hex}CC, transparent 60%),
                                        radial-gradient(ellipse 40% 15% at 50% 85%, ${currentRecommendations[selectedProductIndex].darkProduct.hex}CC, transparent 60%)`
                          }}
                        />
                      </div>
                      
                      <div className="mt-2 bg-muted/50 rounded-lg p-3">
                        <p className="font-semibold text-sm">{currentRecommendations[selectedProductIndex]?.brand}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentRecommendations[selectedProductIndex].lightProduct.hex }} />
                            <span>Light: {currentRecommendations[selectedProductIndex].lightProduct.shade}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentRecommendations[selectedProductIndex].darkProduct.hex }} />
                            <span>Dark: {currentRecommendations[selectedProductIndex].darkProduct.shade}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-[2/1] bg-muted rounded-lg flex items-center justify-center text-center text-muted-foreground p-8">
                    {capturedImage ? (
                      <p>Select a product below to see the before & after comparison</p>
                    ) : (
                      <p>Capture or upload a photo to see the before & after comparison</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Recommendations */}
        <h2 className="text-2xl font-bold mb-4">Current Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentRecommendations.map((pair, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedProductIndex === index ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setSelectedProductIndex(index)}
            >
              <CardContent className="p-4">
                {selectedProductIndex === index && (
                  <div className="flex items-center justify-center mb-2 text-primary">
                    <Check className="w-5 h-5 mr-1" />
                    <span className="text-sm font-semibold">Trying On</span>
                  </div>
                )}
                <h3 className="font-semibold text-lg mb-4 text-center">{pair.brand}</h3>
                
                <div className="space-y-4">
                  {/* Light Shade */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary">LIGHT SHADE</p>
                    <img
                      src={pair.lightProduct.imageUrl || pair.lightProduct.imgSrc}
                      alt={pair.lightProduct.shade}
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border-2 border-border"
                        style={{ backgroundColor: pair.lightProduct.hex }}
                      />
                      <p className="text-xs font-mono">{pair.lightProduct.hex}</p>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{pair.lightProduct.shade}</p>
                    {pair.lightProduct.price && (
                      <p className="text-sm font-bold text-primary">${pair.lightProduct.price.toFixed(2)}</p>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyProduct(pair.lightProduct, 'light');
                      }}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy Light
                    </Button>
                  </div>

                  {/* Dark Shade */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary">DARK SHADE (CONTOUR)</p>
                    <img
                      src={pair.darkProduct.imageUrl || pair.darkProduct.imgSrc}
                      alt={pair.darkProduct.shade}
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border-2 border-border"
                        style={{ backgroundColor: pair.darkProduct.hex }}
                      />
                      <p className="text-xs font-mono">{pair.darkProduct.hex}</p>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{pair.darkProduct.shade}</p>
                    {pair.darkProduct.price && (
                      <p className="text-sm font-bold text-primary">${pair.darkProduct.price.toFixed(2)}</p>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyProduct(pair.darkProduct, 'dark');
                      }}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy Dark
                    </Button>
                  </div>

                  {/* Buy Set Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuySet(pair);
                    }}
                    className="w-full font-semibold"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Set - ${((pair.lightProduct.price || 45) + (pair.darkProduct.price || 45)).toFixed(2)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommendation History */}
        {recommendationHistory.length > 1 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Previous Recommendations</h2>
            <div className="space-y-4">
              {recommendationHistory.slice(0, -1).reverse().map((historySet, setIndex) => (
                <Card key={setIndex}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Recommendation Set {recommendationHistory.length - setIndex - 1}</h3>
                      <Button
                        onClick={() => {
                          setCurrentRecommendations(historySet);
                          const newHistory = [...recommendationHistory];
                          newHistory.splice(recommendationHistory.length - setIndex - 1, 1);
                          newHistory.push(historySet);
                          setRecommendationHistory(newHistory);
                          setSelectedProductIndex(null);
                        }}
                        size="sm"
                      >
                        Switch to These
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {historySet.map((pair, index) => (
                        <div key={index} className="text-center">
                          <img
                            src={pair.lightProduct.imageUrl || pair.lightProduct.imgSrc}
                            alt={pair.brand}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                          <p className="text-sm font-medium">{pair.brand}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VirtualTryOn;
