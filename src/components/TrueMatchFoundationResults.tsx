import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingCart, 
  Star, 
  Target, 
  Palette, 
  TrendingUp, 
  ExternalLink,
  Heart,
  Share2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface FoundationMatch {
  id: string;
  brand: string;
  productName: string;
  shadeName: string;
  hexColor: string;
  price: number;
  rating: number;
  reviewCount: number;
  coverage: string;
  finish: string;
  matchType: 'primary' | 'secondary' | 'cross-brand';
  confidenceScore: number;
  deltaE: number;
  purchaseUrl: string;
  imageUrl: string;
  undertone: string;
  depthLevel: number;
}

interface TrueMatchFoundationResultsProps {
  primaryMatches: FoundationMatch[];
  secondaryMatches: FoundationMatch[];
  crossBrandMatches: FoundationMatch[];
  analysisData: any;
  onSaveResults: () => void;
  onTryVirtual?: (match: FoundationMatch) => void;
}

const TrueMatchFoundationResults: React.FC<TrueMatchFoundationResultsProps> = ({
  primaryMatches,
  secondaryMatches,
  crossBrandMatches,
  analysisData,
  onSaveResults,
  onTryVirtual
}) => {
  const [savedMatches, setSavedMatches] = useState<Set<string>>(new Set());
  
  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'primary': return <Target className="h-4 w-4" />;
      case 'secondary': return <Palette className="h-4 w-4" />;
      case 'cross-brand': return <TrendingUp className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'secondary': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'cross-brand': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDeltaEDescription = (deltaE: number) => {
    if (deltaE < 1) return 'Perfect Match';
    if (deltaE < 2) return 'Excellent Match';
    if (deltaE < 3) return 'Very Good Match';
    if (deltaE < 5) return 'Good Match';
    return 'Fair Match';
  };

  const handleSaveMatch = (matchId: string) => {
    const newSavedMatches = new Set(savedMatches);
    if (savedMatches.has(matchId)) {
      newSavedMatches.delete(matchId);
      toast.success('Match removed from favorites');
    } else {
      newSavedMatches.add(matchId);
      toast.success('Match saved to favorites');
    }
    setSavedMatches(newSavedMatches);
  };

  const handlePurchase = (match: FoundationMatch) => {
    // Open purchase URL in new tab
    window.open(match.purchaseUrl, '_blank');
    toast.success(`Opening ${match.brand} purchase page...`);
  };

  const renderFoundationCard = (match: FoundationMatch) => (
    <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100">
          {match.imageUrl ? (
            <img 
              src={match.imageUrl} 
              alt={`${match.brand} ${match.productName}`}
              className="w-full h-full object-cover transition-transform hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.fallback-swatch') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Enhanced fallback with product color */}
          <div 
            className={`fallback-swatch w-full h-full items-center justify-center bg-gradient-to-br ${
              match.imageUrl ? 'hidden' : 'flex'
            }`}
            style={{ backgroundColor: match.hexColor }}
          >
            <div className="text-center text-white bg-black bg-opacity-30 p-2 rounded">
              <Palette className="h-8 w-8 mx-auto mb-1" />
              <div className="text-xs font-medium">{match.brand}</div>
              <div className="text-xs opacity-90">{match.shadeName}</div>
            </div>
          </div>
          
          {/* Match badge */}
          <div className="absolute top-2 left-2">
            <Badge className={getMatchTypeColor(match.matchType)}>
              {getMatchTypeIcon(match.matchType)}
              <span className="ml-1 capitalize">{match.matchType}</span>
            </Badge>
          </div>

          {/* Confidence score */}
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded-md">
            <span className={`text-sm font-medium ${getConfidenceColor(match.confidenceScore)}`}>
              {Math.round(match.confidenceScore * 100)}%
            </span>
          </div>

          {/* Color swatch */}
          <div className="absolute bottom-2 left-2 flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: match.hexColor }}
            ></div>
            <div className="bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium">
              {match.hexColor}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{match.brand}</h3>
            <p className="text-gray-600">{match.productName}</p>
            <p className="text-sm font-medium text-rose-600">{match.shadeName}</p>
          </div>

          {/* Rating and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{match.rating}</span>
              <span className="text-sm text-gray-500">({match.reviewCount})</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              ${match.price.toFixed(2)}
            </div>
          </div>

          {/* Product Attributes */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{match.coverage} coverage</Badge>
            <Badge variant="outline">{match.finish} finish</Badge>
            <Badge variant="outline">{match.undertone} undertone</Badge>
          </div>

          {/* Match Quality */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Match Quality</span>
              <span className="font-medium">{getDeltaEDescription(match.deltaE)}</span>
            </div>
            <Progress value={Math.max(0, 100 - (match.deltaE * 10))} className="h-2" />
            <p className="text-xs text-gray-500">
              ΔE: {match.deltaE.toFixed(1)} (lower is better)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={() => handlePurchase(match)}
              className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Now
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSaveMatch(match.id)}
            >
              <Heart 
                className={`h-4 w-4 ${
                  savedMatches.has(match.id) ? 'fill-rose-500 text-rose-500' : ''
                }`} 
              />
            </Button>
            
            {onTryVirtual && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onTryVirtual(match)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Your Foundation Matches
            </span>
          </CardTitle>
          <CardDescription className="text-center">
            Personalized recommendations based on your unique skin tone analysis
          </CardDescription>
          
          <div className="flex justify-center space-x-4 mt-4">
            <Button onClick={onSaveResults} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Save Results
            </Button>
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Match Results Tabs */}
      <Tabs defaultValue="primary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="primary" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Primary Matches</span>
            <Badge variant="secondary">{primaryMatches.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="secondary" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Secondary</span>
            <Badge variant="secondary">{secondaryMatches.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cross-brand" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Cross-Brand</span>
            <Badge variant="secondary">{crossBrandMatches.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="primary" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Best Matches for Your Primary Tone</h3>
            <p className="text-gray-600">
              These foundations match your center face area and should be your go-to choice
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {primaryMatches.map(renderFoundationCard)}
          </div>
        </TabsContent>

        <TabsContent value="secondary" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Matches for Your Secondary Tone</h3>
            <p className="text-gray-600">
              Perfect for contouring, highlighting, or dual-zone application
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryMatches.map(renderFoundationCard)}
          </div>
        </TabsContent>

        <TabsContent value="cross-brand" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Cross-Brand Alternatives</h3>
            <p className="text-gray-600">
              Similar shades from different brands based on color matching
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crossBrandMatches.map(renderFoundationCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-50 p-4 rounded-lg">
              <h4 className="font-medium text-rose-900 mb-2">Primary Tone Usage</h4>
              <p className="text-sm text-rose-800">
                Use your primary matches for everyday foundation application. 
                These match your center face area where foundation is most visible.
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Secondary Tone Usage</h4>
              <p className="text-sm text-purple-800">
                Consider secondary matches for contouring around your jawline and 
                perimeter areas, or try the dual-zone application technique.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Color Matching Science</h4>
              <p className="text-sm text-blue-800">
                ΔE values below 3 indicate perceptually unnoticeable differences. 
                All our matches are optimized for ΔE accuracy.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Testing Recommendations</h4>
              <p className="text-sm text-green-800">
                Always test foundations in natural daylight when possible. 
                Consider ordering samples before purchasing full-size products.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrueMatchFoundationResults;