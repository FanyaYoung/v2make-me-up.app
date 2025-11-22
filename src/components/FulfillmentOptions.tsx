import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, ShoppingCart, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FulfillmentOptionsProps {
  products: {
    id: string;
    brand: string;
    product?: string;
    name?: string;
    shade: string;
    price: number;
    rakutenData?: {
      id: string;
      productUrl: string;
      merchant: string;
      imageUrl?: string;
    };
  }[];
  onPurchase: (fulfillmentMethod: string, products: any[]) => void;
}

type FulfillmentMethod = 'pickup' | 'shipping' | 'delivery' | 'curbside';

const FulfillmentOptions: React.FC<FulfillmentOptionsProps> = ({ products, onPurchase }) => {
  const [selectedMethod, setSelectedMethod] = useState<FulfillmentMethod>('shipping');
  const [processingOrder, setProcessingOrder] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fulfillmentOptions = [
    {
      id: 'shipping' as FulfillmentMethod,
      title: 'Standard Shipping',
      icon: <Truck className="w-5 h-5" />,
      description: 'Delivered to your address',
      timeframe: '3-5 business days',
      price: 5.99,
      badge: 'Most Popular'
    },
    {
      id: 'delivery' as FulfillmentMethod,
      title: 'Local Delivery',
      icon: <ShoppingCart className="w-5 h-5" />,
      description: 'Via Uber - Same day',
      timeframe: 'Within 2-4 hours',
      price: 9.99,
      badge: 'Fast'
    },
    {
      id: 'curbside' as FulfillmentMethod,
      title: 'Curbside Pickup',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Pick up from store parking',
      timeframe: 'Ready in 1-2 hours',
      price: 0,
      badge: 'Free'
    },
    {
      id: 'pickup' as FulfillmentMethod,
      title: 'In-Store Pickup',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Pick up inside store',
      timeframe: 'Ready in 2-4 hours',
      price: 0,
      badge: 'Free'
    }
  ];


  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order",
        variant: "destructive"
      });
      return;
    }

    setProcessingOrder(true);
    try {
      // Check if products have Rakuten affiliate data
      const hasRakutenLinks = products.some(p => p.rakutenData?.productUrl);

      if (hasRakutenLinks) {
        // Redirect through Rakuten affiliate links
        for (const product of products) {
          if (product.rakutenData?.productUrl) {
            // Track affiliate click
            await supabase.functions.invoke('track-affiliate-click', {
              body: {
                provider: 'rakuten',
                offerId: product.rakutenData.id,
                clickUrl: product.rakutenData.productUrl,
                productName: product.name || product.product,
                productBrand: product.brand,
                userId: user.id
              }
            });

            // Open Rakuten affiliate link in new tab
            window.open(product.rakutenData.productUrl, '_blank');
          }
        }

        toast({
          title: "Opening Affiliate Links",
          description: `Opening ${products.filter(p => p.rakutenData?.productUrl).length} product(s) in new tabs to complete your purchase.`,
        });

        // Call onPurchase callback after small delay
        setTimeout(() => {
          onPurchase(selectedMethod, products);
        }, 1000);
      } else {
        // Fallback to direct checkout if no Rakuten links available
        toast({
          title: "No Affiliate Links Available",
          description: "These products don't have affiliate links. Proceeding with direct checkout.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "Failed to open purchase links. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  const totalPrice = products.reduce((sum, product) => sum + (product.price || 0), 0);
  const selectedOption = fulfillmentOptions.find(opt => opt.id === selectedMethod);
  const finalTotal = totalPrice + (selectedOption?.price || 0);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Choose Your Fulfillment Method</h3>
        </div>

        <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as FulfillmentMethod)}>
          <div className="space-y-3">
            {fulfillmentOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value={option.id} id={option.id} />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="flex items-center gap-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-medium">{option.title}</span>
                      <Badge variant={option.badge === 'Free' ? 'secondary' : 'outline'}>
                        {option.badge}
                      </Badge>
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {option.timeframe}
                    </div>
                    <span className="text-sm font-medium">
                      {option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Products Subtotal:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Fulfillment:</span>
              <span>{selectedOption?.price === 0 ? 'Free' : `$${selectedOption?.price.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total:</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handlePurchase} 
          className="w-full" 
          size="lg"
          disabled={processingOrder}
        >
          {processingOrder ? "Redirecting to Checkout..." : `Complete Purchase - $${finalTotal.toFixed(2)}`}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Secure checkout powered by Stripe. You'll be redirected to complete your payment.
        </p>
      </div>
    </Card>
  );
};

export default FulfillmentOptions;