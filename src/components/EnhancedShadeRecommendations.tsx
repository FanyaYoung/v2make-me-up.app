import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Store, Truck, Globe, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BrandWithShades {
  brand_id: string;
  brand_name: string;
  brand_tier: 'drugstore' | 'mid-range' | 'luxury';
  logo_url?: string;
  website_url?: string;
  shades: Array<{
    shade_id: string;
    shade_name: string;
    hex_color: string;
    product_name: string;
    price?: number;
  }>;
  referral_info?: {
    affiliate_code: string;
    referral_url: string;
    promo_code: string;
    commission_rate: number;
  };
  purchase_options: Array<{
    option_type: string;
    option_name: string;
    base_url: string;
  }>;
}

interface EnhancedShadeRecommendationsProps {
  matchedShades: Array<{
    shade_id: string;
    shade_name: string;
    hex_color: string;
    brand_name: string;
    product_name: string;
    match_percentage: number;
  }>;
}

const TIER_INFO = {
  drugstore: {
    label: 'Drugstore',
    description: 'Affordable, accessible options',
    color: 'bg-green-100 text-green-800'
  },
  'mid-range': {
    label: 'Mid-Range',
    description: 'Quality meets value',
    color: 'bg-blue-100 text-blue-800'
  },
  luxury: {
    label: 'Luxury',
    description: 'Premium, high-end quality',
    color: 'bg-purple-100 text-purple-800'
  }
};

export default function EnhancedShadeRecommendations({ matchedShades }: EnhancedShadeRecommendationsProps) {
  const [brandRecommendations, setBrandRecommendations] = useState<BrandWithShades[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchaseMethod, setSelectedPurchaseMethod] = useState<string>('');
  const [copiedPromo, setCopiedPromo] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchEnhancedRecommendations();
  }, [matchedShades]);

  const fetchEnhancedRecommendations = async () => {
    try {
      setLoading(true);
      
      // Get brand data with tiers and limit to 2 shades per brand, 6 brands total
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select(`
          id,
          name,
          brand_tier,
          logo_url,
          website_url,
          foundation_products (
            id,
            name,
            price,
            foundation_shades (
              id,
              shade_name,
              hex_color
            )
          )
        `)
        .in('brand_tier', ['drugstore', 'mid-range', 'luxury'])
        .limit(6);

      if (brandsError) throw brandsError;

      // Get referral codes
      const { data: referralData } = await supabase
        .from('brand_referral_codes')
        .select('*')
        .eq('is_active', true);

      // Get purchase options
      const { data: purchaseData } = await supabase
        .from('purchase_options')
        .select('*')
        .eq('is_active', true);

      const enhancedBrands = brandsData?.map(brand => {
        const referralInfo = referralData?.find(r => r.brand_id === brand.id);
        const brandPurchaseOptions = purchaseData?.filter(p => p.brand_id === brand.id) || [];
        
        // Get up to 2 shades from this brand, prioritizing matched shades
        const allShades = brand.foundation_products?.flatMap(product => 
          product.foundation_shades?.map(shade => ({
            shade_id: shade.id,
            shade_name: shade.shade_name,
            hex_color: shade.hex_color,
            product_name: product.name,
            price: product.price
          })) || []
        ) || [];

        const matchedFromBrand = matchedShades.filter(match => 
          allShades.some(shade => shade.shade_id === match.shade_id)
        );

        const otherShades = allShades.filter(shade => 
          !matchedFromBrand.some(match => match.shade_id === shade.shade_id)
        );

        const selectedShades = [
          ...matchedFromBrand.slice(0, 2),
          ...otherShades.slice(0, Math.max(0, 2 - matchedFromBrand.length))
        ].slice(0, 2);

        return {
          brand_id: brand.id,
          brand_name: brand.name,
          brand_tier: brand.brand_tier as 'drugstore' | 'mid-range' | 'luxury',
          logo_url: brand.logo_url,
          website_url: brand.website_url,
          shades: selectedShades,
          referral_info: referralInfo,
          purchase_options: brandPurchaseOptions
        };
      }).filter(brand => brand.shades.length > 0) || [];

      // Sort by tier priority and limit to 6 brands (2 per tier)
      const sortedBrands = enhancedBrands
        .sort((a, b) => {
          const tierOrder = { drugstore: 1, 'mid-range': 2, luxury: 3 };
          return tierOrder[a.brand_tier] - tierOrder[b.brand_tier];
        })
        .slice(0, 6);

      setBrandRecommendations(sortedBrands);
    } catch (error) {
      console.error('Error fetching enhanced recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load enhanced recommendations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (brand: BrandWithShades, optionType: string) => {
    const purchaseOption = brand.purchase_options.find(opt => opt.option_type === optionType);
    const referralCode = brand.referral_info?.affiliate_code;
    
    let url = purchaseOption?.base_url || brand.website_url || '#';
    
    // Add referral code to URL
    if (referralCode && url !== '#') {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}ref=${referralCode}`;
    }

    if (url !== '#') {
      window.open(url, '_blank');
    }
  };

  const copyPromoCode = async (promoCode: string, brandName: string) => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopiedPromo(promoCode);
      toast({
        title: "Promo Code Copied!",
        description: `Use "${promoCode}" for in-store discount at ${brandName}`,
      });
      setTimeout(() => setCopiedPromo(''), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy promo code",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Perfect Shade Matches</h2>
        <p className="text-muted-foreground">Curated recommendations across quality tiers</p>
      </div>

      {brandRecommendations.map((brand) => (
        <Card key={brand.brand_id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Brand Logo */}
              <div className="flex-shrink-0">
                {brand.logo_url ? (
                  <img 
                    src={brand.logo_url} 
                    alt={`${brand.brand_name} logo`}
                    className="w-16 h-16 object-contain rounded-lg border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs font-medium">{brand.brand_name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Brand Info and Shades */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-lg">{brand.brand_name}</h3>
                  <Badge className={TIER_INFO[brand.brand_tier].color}>
                    {TIER_INFO[brand.brand_tier].label}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {TIER_INFO[brand.brand_tier].description}
                </p>

                {/* Shade Swatches */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-medium">Your matches:</span>
                  <div className="flex gap-2">
                    {brand.shades.map((shade) => (
                      <div key={shade.shade_id} className="text-center">
                        <div 
                          className="w-12 h-12 rounded-full border-2 border-border shadow-sm"
                          style={{ backgroundColor: shade.hex_color }}
                          title={shade.shade_name}
                        />
                        <p className="text-xs mt-1 max-w-16 truncate">{shade.shade_name}</p>
                        {shade.price && (
                          <p className="text-xs text-muted-foreground">${shade.price}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchase Options */}
                <div className="flex flex-wrap gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Buy Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>How would you like to purchase?</DialogTitle>
                      </DialogHeader>
                      
                      <RadioGroup value={selectedPurchaseMethod} onValueChange={setSelectedPurchaseMethod}>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="online" id="online" />
                            <Label htmlFor="online" className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Shop Online
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="store" id="store" />
                            <Label htmlFor="store" className="flex items-center gap-2">
                              <Store className="w-4 h-4" />
                              Visit Store (with promo code)
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="delivery" id="delivery" />
                            <Label htmlFor="delivery" className="flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Same-Day Delivery
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>

                      {selectedPurchaseMethod === 'store' && brand.referral_info?.promo_code && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">In-Store Promo Code:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm bg-background px-2 py-1 rounded">
                              {brand.referral_info.promo_code}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyPromoCode(brand.referral_info!.promo_code, brand.brand_name)}
                            >
                              {copiedPromo === brand.referral_info.promo_code ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={() => handlePurchase(brand, selectedPurchaseMethod)}
                        disabled={!selectedPurchaseMethod}
                        className="w-full mt-4"
                      >
                        Continue to Purchase
                      </Button>
                    </DialogContent>
                  </Dialog>

                  {brand.referral_info?.promo_code && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyPromoCode(brand.referral_info!.promo_code, brand.brand_name)}
                      className="gap-2"
                    >
                      {copiedPromo === brand.referral_info.promo_code ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Promo Code
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}