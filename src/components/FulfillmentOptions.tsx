import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, ShoppingCart, Clock } from 'lucide-react';

interface FulfillmentOptionsProps {
  products: any[];
  onPurchase: (fulfillmentMethod: string, products: any[]) => void;
}

type FulfillmentMethod = 'pickup' | 'shipping' | 'delivery';

const FulfillmentOptions: React.FC<FulfillmentOptionsProps> = ({ products, onPurchase }) => {
  const [selectedMethod, setSelectedMethod] = useState<FulfillmentMethod>('shipping');

  const fulfillmentOptions = [
    {
      id: 'pickup' as FulfillmentMethod,
      title: 'Store Pickup',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Pick up at your local store',
      timeframe: 'Ready in 2-4 hours',
      price: 0,
      badge: 'Free'
    },
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
      title: 'Same-Day Delivery',
      icon: <ShoppingCart className="w-5 h-5" />,
      description: 'Via Instacart or Uber',
      timeframe: 'Within 2 hours',
      price: 9.99,
      badge: 'Fastest'
    }
  ];

  const handlePurchase = () => {
    onPurchase(selectedMethod, products);
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

        <Button onClick={handlePurchase} className="w-full" size="lg">
          Complete Purchase - ${finalTotal.toFixed(2)}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your purchase includes our affiliate code for the best available pricing and exclusive offers.
        </p>
      </div>
    </Card>
  );
};

export default FulfillmentOptions;