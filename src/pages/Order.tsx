import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Package, Truck, CreditCard, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OrderItem {
  id: string;
  name: string;
  brand: string;
  shade?: string;
  price: number;
  image_url?: string;
  description?: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const Order = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [orderItem, setOrderItem] = useState<OrderItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState('direct_ship');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [sameBillingAddress, setSameBillingAddress] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    const productId = searchParams.get('product');
    const shadeId = searchParams.get('shade');
    
    if (productId) {
      fetchProductDetails(productId, shadeId);
    }
  }, [searchParams]);

  const fetchProductDetails = async (productId: string, shadeId?: string | null) => {
    try {
      const { data: product, error: productError } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brands (name)
        `)
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      let shadeInfo = null;
      if (shadeId) {
        const { data: shade, error: shadeError } = await supabase
          .from('foundation_shades')
          .select('*')
          .eq('id', shadeId)
          .single();

        if (!shadeError) {
          shadeInfo = shade;
        }
      }

      setOrderItem({
        id: product.id,
        name: product.name,
        brand: product.brands?.name || 'Unknown Brand',
        shade: shadeInfo?.shade_name,
        price: product.price || 0,
        image_url: product.image_url,
        description: product.description
      });
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive"
      });
    }
  };

  const calculateCosts = () => {
    if (!orderItem) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

    const subtotal = orderItem.price * quantity;
    const tax = subtotal * 0.08; // 8% tax rate
    
    let shipping = 0;
    if (fulfillmentMethod === 'direct_ship') {
      switch (shippingMethod) {
        case 'standard':
          shipping = 5.99;
          break;
        case 'express':
          shipping = 12.99;
          break;
        case 'overnight':
          shipping = 24.99;
          break;
      }
    }

    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const handleCreateOrder = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place an order",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!orderItem) return;

    setIsLoading(true);
    try {
      const costs = calculateCosts();
      const finalBillingAddress = sameBillingAddress ? shippingAddress : billingAddress;

      const orderData = {
        user_id: user.id,
        customer_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        customer_email: user.email,
        total_amount: costs.total,
        currency: 'USD',
        shipping_address: shippingAddress,
        billing_address: finalBillingAddress,
        notes: specialInstructions,
        affiliate_id: 'direct' // Hidden from user but tracked for analytics
      };

      const orderItems = [{
        product_id: orderItem.id,
        product_name: orderItem.name,
        product_brand: orderItem.brand,
        shade_name: orderItem.shade,
        quantity: quantity,
        unit_price: orderItem.price,
        total_price: orderItem.price * quantity
      }];

      // Create order using the existing edge function
      const { data, error } = await supabase.functions.invoke('process-order', {
        body: {
          order: orderData,
          items: orderItems
        }
      });

      if (error) throw error;

      // Create checkout session for payment
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          cartItems: orderItems.map(item => ({
            id: item.product_id,
            name: item.product_name,
            brand: item.product_brand,
            shade: item.shade_name,
            price: item.unit_price,
            quantity: item.quantity,
            image_url: orderItem.image_url
          }))
        }
      });

      if (checkoutError) throw checkoutError;

      // Redirect to Stripe checkout
      if (checkoutData.url) {
        window.open(checkoutData.url, '_blank');
      }

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!orderItem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  const costs = calculateCosts();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
        <p className="text-muted-foreground">Review your selection and choose fulfillment options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {orderItem.image_url && (
                  <img 
                    src={orderItem.image_url} 
                    alt={orderItem.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{orderItem.name}</h3>
                  <p className="text-muted-foreground">{orderItem.brand}</p>
                  {orderItem.shade && (
                    <Badge variant="secondary" className="mt-1">
                      Shade: {orderItem.shade}
                    </Badge>
                  )}
                  <p className="text-xl font-bold mt-2">${orderItem.price.toFixed(2)}</p>
                </div>
              </div>
              
              {orderItem.description && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{orderItem.description}</p>
                </div>
              )}

              <div className="mt-4">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-20 mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Fulfillment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={fulfillmentMethod} onValueChange={setFulfillmentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct_ship" id="direct_ship" />
                  <Label htmlFor="direct_ship" className="flex-1">
                    <div>
                      <div className="font-medium">Direct Shipping</div>
                      <div className="text-sm text-muted-foreground">
                        Ship directly to your address
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="store_pickup" id="store_pickup" />
                  <Label htmlFor="store_pickup" className="flex-1">
                    <div>
                      <div className="font-medium">Store Pickup</div>
                      <div className="text-sm text-muted-foreground">
                        Pick up at a retail location (Coming Soon)
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Shipping Options */}
          {fulfillmentMethod === 'direct_ship' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard">
                        <div>
                          <div className="font-medium">Standard Shipping</div>
                          <div className="text-sm text-muted-foreground">5-7 business days</div>
                        </div>
                      </Label>
                    </div>
                    <span className="font-medium">$5.99</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express">
                        <div>
                          <div className="font-medium">Express Shipping</div>
                          <div className="text-sm text-muted-foreground">2-3 business days</div>
                        </div>
                      </Label>
                    </div>
                    <span className="font-medium">$12.99</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="overnight" id="overnight" />
                      <Label htmlFor="overnight">
                        <div>
                          <div className="font-medium">Overnight Shipping</div>
                          <div className="text-sm text-muted-foreground">Next business day</div>
                        </div>
                      </Label>
                    </div>
                    <span className="font-medium">$24.99</span>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Address and Payment */}
        <div className="space-y-6">
          {/* Shipping Address */}
          {fulfillmentMethod === 'direct_ship' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Street Address"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  />
                  <Input
                    placeholder="State"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="ZIP Code"
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                  />
                  <Input
                    placeholder="Country"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any special delivery instructions or notes..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                <span>${costs.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${costs.tax.toFixed(2)}</span>
              </div>
              {fulfillmentMethod === 'direct_ship' && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${costs.shipping.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${costs.total.toFixed(2)}</span>
              </div>
              
              <Button 
                onClick={handleCreateOrder}
                disabled={isLoading || !isAuthenticated}
                className="w-full mt-6"
                size="lg"
              >
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </Button>
              
              {!isAuthenticated && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Please sign in to complete your order
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Order;