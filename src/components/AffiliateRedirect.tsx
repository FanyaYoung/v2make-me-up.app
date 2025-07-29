import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Store, CreditCard } from 'lucide-react';

interface AffiliateRedirectProps {
  product: {
    id: string;
    name: string;
    brand: string;
    shade?: string;
    price: number;
    image_url?: string;
  };
  retailer: {
    name: string;
    logo_url?: string;
    affiliate_url: string;
    commission_rate?: number;
  };
}

const AffiliateRedirect: React.FC<AffiliateRedirectProps> = ({ product, retailer }) => {
  const handleRedirect = () => {
    // Track the click for analytics
    const trackingData = {
      product_id: product.id,
      retailer: retailer.name,
      price: product.price,
      timestamp: new Date().toISOString()
    };
    
    // Store in localStorage for tracking
    const existingClicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
    existingClicks.push(trackingData);
    localStorage.setItem('affiliate_clicks', JSON.stringify(existingClicks));

    // Open retailer link in new tab
    window.open(retailer.affiliate_url, '_blank');
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="w-5 h-5" />
          Shop at {retailer.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {retailer.logo_url && (
            <img
              src={retailer.logo_url}
              alt={retailer.name}
              className="w-8 h-8 object-contain"
            />
          )}
          <div className="flex-1">
            <h4 className="font-semibold">{product.brand} {product.name}</h4>
            {product.shade && (
              <p className="text-sm text-muted-foreground">Shade: {product.shade}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
            {retailer.commission_rate && (
              <Badge variant="secondary" className="text-xs">
                {retailer.commission_rate}% back
              </Badge>
            )}
          </div>
        </div>

        <Button
          onClick={handleRedirect}
          className="w-full"
          size="lg"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Shop at {retailer.name}
        </Button>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>• Price may vary at retailer</p>
          <p>• We earn a commission on qualifying purchases</p>
          <p>• Supports our platform at no extra cost to you</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AffiliateRedirect;