import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Truck, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RetailUpgradePromptProps {
  onUpgrade?: () => void;
}

export default function RetailUpgradePrompt({ onUpgrade }: RetailUpgradePromptProps) {
  const subscription = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  // For now, retail access is available to any premium users (paying subscribers)
  const hasRetailAccess = subscription.isPremium;

  const handleRetailUpgrade = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade to retail features",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: 'retail_upgrade_price',
          amount: 100, // $1.00 in cents
          productName: 'Retail Shopping Access',
          mode: 'payment' // One-time payment
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        if (onUpgrade) onUpgrade();
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to process upgrade. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (hasRetailAccess) return null;

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-rose-50 to-purple-50">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <Badge variant="secondary" className="text-primary font-semibold">
            RETAIL UPGRADE
          </Badge>
        </div>
        <CardTitle className="text-xl text-primary">
          Unlock Direct Shopping Access
        </CardTitle>
        <p className="text-muted-foreground">
          Get instant access to buy your matched shades directly from our retail partners
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-medium">Direct Checkout</h4>
            <p className="text-sm text-muted-foreground">
              Buy instantly without leaving our platform
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-medium">Fast Delivery</h4>
            <p className="text-sm text-muted-foreground">
              Same-day and express shipping options
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-medium">Exclusive Deals</h4>
            <p className="text-sm text-muted-foreground">
              Special pricing and member discounts
            </p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-lg">One-time upgrade</p>
              <p className="text-sm text-muted-foreground">Permanent access to retail features</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">$1.00</p>
              <Button 
                onClick={handleRetailUpgrade}
                className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}