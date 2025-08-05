import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, ExternalLink, Percent, DollarSign } from 'lucide-react';

interface RakutenOffer {
  id: string;
  name: string;
  description: string;
  commissionRate: number;
  salePrice: number;
  originalPrice?: number;
  imageUrl: string;
  clickUrl: string;
  merchant: string;
  category: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
}

interface RakutenStats {
  totalClicks: number;
  totalCommissions: number;
  conversionRate: number;
  topPerformingProducts: string[];
}

const RakutenIntegration = () => {
  const [offers, setOffers] = useState<RakutenOffer[]>([]);
  const [stats, setStats] = useState<RakutenStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchBeautyOffers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rakuten-offers', {
        body: { 
          category: 'beauty',
          keywords: 'foundation,makeup,cosmetics',
          limit: 20
        }
      });

      if (error) throw error;

      setOffers(data.offers || []);
      setStats(data.stats || null);
      
      toast({
        title: "Offers loaded",
        description: `Found ${data.offers?.length || 0} beauty offers`
      });
    } catch (error) {
      console.error('Rakuten fetch error:', error);
      toast({
        title: "Failed to load offers",
        description: "Unable to fetch Rakuten offers",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trackClick = async (offerId: string, clickUrl: string) => {
    try {
      // Track the click for analytics
      await supabase.functions.invoke('track-affiliate-click', {
        body: {
          provider: 'rakuten',
          offerId,
          clickUrl,
          userId: null // Will be set in the function if user is authenticated
        }
      });

      // Open the affiliate link
      window.open(clickUrl, '_blank');
    } catch (error) {
      console.error('Click tracking error:', error);
      // Still open the link even if tracking fails
      window.open(clickUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Rakuten Advertising Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={fetchBeautyOffers}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load Beauty Offers'}
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalClicks}</div>
                <div className="text-sm text-blue-700">Total Clicks</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${stats.totalCommissions.toFixed(2)}
                </div>
                <div className="text-sm text-green-700">Commissions</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(stats.conversionRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-purple-700">Conversion Rate</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.topPerformingProducts.length}
                </div>
                <div className="text-sm text-orange-700">Top Products</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offers Grid */}
      {offers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <img
                    src={offer.imageUrl}
                    alt={offer.name}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                  <Badge className="absolute top-2 left-2 bg-green-500">
                    <Percent className="w-3 h-3 mr-1" />
                    {offer.commissionRate}% Commission
                  </Badge>
                  {!offer.inStock && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Sold Out
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                      {offer.name}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600">{offer.merchant}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{offer.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-green-600">
                        ${offer.salePrice.toFixed(2)}
                      </span>
                      {offer.originalPrice && offer.originalPrice > offer.salePrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${offer.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    {offer.rating && (
                      <div className="text-sm text-gray-600">
                        ⭐ {offer.rating} ({offer.reviewCount || 0})
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {offer.category}
                    </Badge>
                    <div className="flex items-center text-xs text-green-600">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Earn ${(offer.salePrice * offer.commissionRate / 100).toFixed(2)}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4"
                    onClick={() => trackClick(offer.id, offer.clickUrl)}
                    disabled={!offer.inStock}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {offer.inStock ? 'Shop Now' : 'Out of Stock'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {offers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Offers Loaded</h3>
            <p className="text-gray-500 mb-4">Click "Load Beauty Offers" to see available products</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RakutenIntegration;