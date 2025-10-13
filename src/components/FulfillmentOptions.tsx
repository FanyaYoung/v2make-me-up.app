import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Truck, ShoppingCart, Clock, User, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FulfillmentOptionsProps {
  products: any[];
  onPurchase: (fulfillmentMethod: string, products: any[]) => void;
}

type FulfillmentMethod = 'pickup' | 'shipping' | 'delivery' | 'curbside';

const FulfillmentOptions: React.FC<FulfillmentOptionsProps> = ({ products, onPurchase }) => {
  const [selectedMethod, setSelectedMethod] = useState<FulfillmentMethod>('shipping');
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });
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

  const processOrder = async () => {
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
      const orderItems = products.map(product => ({
        product_id: product.id,
        product_name: product.product || product.name,
        product_brand: product.brand,
        shade_name: product.shade,
        quantity: 1,
        unit_price: product.price || 0
      }));

      const { data, error } = await supabase.functions.invoke('process-order', {
        body: {
          items: orderItems,
          customer_email: customerInfo.email,
          customer_name: customerInfo.name,
          shipping_address: customerInfo.address,
          affiliate_id: 'MU-AFFILIATE-001' // Your affiliate ID
        }
      });

      if (error) throw error;

      toast({
        title: "Order Placed Successfully!",
        description: `Order ${data.order.order_number} has been created. You'll receive tracking information via email.`
      });

      setShowOrderDialog(false);
      setCustomerInfo({
        name: '',
        email: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'US'
        }
      });

      // Call the original onPurchase callback if needed
      onPurchase(selectedMethod, products);
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Failed to process your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  const handlePurchase = () => {
    setShowOrderDialog(true);
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

        {/* Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    placeholder="Enter your email"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shipping Address</Label>
                <Input
                  value={customerInfo.address.line1}
                  onChange={(e) => setCustomerInfo({
                    ...customerInfo,
                    address: {...customerInfo.address, line1: e.target.value}
                  })}
                  placeholder="Street address"
                />
                <Input
                  value={customerInfo.address.line2}
                  onChange={(e) => setCustomerInfo({
                    ...customerInfo,
                    address: {...customerInfo.address, line2: e.target.value}
                  })}
                  placeholder="Apartment, suite, etc. (optional)"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={customerInfo.address.city}
                    onChange={(e) => setCustomerInfo({
                      ...customerInfo,
                      address: {...customerInfo.address, city: e.target.value}
                    })}
                    placeholder="City"
                  />
                  <Input
                    value={customerInfo.address.state}
                    onChange={(e) => setCustomerInfo({
                      ...customerInfo,
                      address: {...customerInfo.address, state: e.target.value}
                    })}
                    placeholder="State"
                  />
                </div>
                <Input
                  value={customerInfo.address.postal_code}
                  onChange={(e) => setCustomerInfo({
                    ...customerInfo,
                    address: {...customerInfo.address, postal_code: e.target.value}
                  })}
                  placeholder="ZIP code"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total: ${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={processOrder} 
                className="w-full" 
                disabled={
                  processingOrder || 
                  !customerInfo.name || 
                  !customerInfo.email || 
                  !customerInfo.address.line1 || 
                  !customerInfo.address.city || 
                  !customerInfo.address.state || 
                  !customerInfo.address.postal_code
                }
              >
                {processingOrder ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};

export default FulfillmentOptions;