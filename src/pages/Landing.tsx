import React from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageSlideshow from '../components/ImageSlideshow';

// Pre-built Stripe payment URLs
const STRIPE_PAYMENT_URLS = {
  one_time: 'https://buy.stripe.com/eVq14n5b68J87AK822dnW04',
  weekly: 'https://buy.stripe.com/28EfZh0UQ5wW08iciidnW05',
  monthly: 'https://buy.stripe.com/bJefZhbzu7F4dZ80zAdnW06',
  yearly: 'https://buy.stripe.com/4gM4gzgTO0cC5sCaaadnW07',
} as const;

const Landing = () => {
  const { toast } = useToast();

  const handlePayment = (tier: 'one_time' | 'weekly' | 'monthly' | 'yearly', tierName: string) => {
    const paymentUrl = STRIPE_PAYMENT_URLS[tier];
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      toast({
        title: "Redirecting to payment",
        description: `Processing ${tierName} purchase...`,
      });
    } else {
      toast({
        title: "Error",
        description: "Payment URL not found. Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Find Your Perfect Foundation Match
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Discover your ideal foundation shade with AI-powered matching, virtual try-on, and personalized beauty recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg px-8 py-4">
                  <Link to="/shade-matcher">Start Matching</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
                  <Link to="/virtual-try-on">Virtual Try-On</Link>
                </Button>
              </div>
            </div>
            
            {/* Foundation Models Slideshow */}
            <div className="relative">
              <ImageSlideshow
                images={[
                  '/lovable-uploads/efce4647-6298-4ee0-a79a-919451a96f45.png',
                  '/lovable-uploads/b7f78823-7566-40da-8231-db2bfe83f2a7.png',
                  '/lovable-uploads/a68d3215-f709-4f7d-8787-82bf8d454614.png'
                ]}
                duration={15000}
                className="aspect-video rounded-2xl border-2 border-white shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Everything You Need for Perfect Foundation
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-xl bg-white shadow-lg">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">AI Shade Matching</h3>
              <p className="text-gray-600">
                Advanced AI analyzes your skin tone to find your perfect foundation match from thousands of products.
              </p>
              <Button asChild variant="ghost" className="text-rose-600">
                <Link to="/shade-matcher">Try Shade Matcher →</Link>
              </Button>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-white shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Virtual Try-On</h3>
              <p className="text-gray-600">
                See how different foundations look on you with our virtual try-on technology.
              </p>
              <Button asChild variant="ghost" className="text-purple-600">
                <Link to="/virtual-try-on">Try Virtual Try-On →</Link>
              </Button>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-white shadow-lg">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                <Crown className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Premium Looks</h3>
              <p className="text-gray-600">
                Get personalized makeup recommendations for any occasion based on your foundation and skin tone.
              </p>
              <Button asChild variant="ghost" className="text-pink-600">
                <Link to="/premium-looks">Explore Premium →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Tiers Preview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Choose Your Plan
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { 
                id: 'one_time' as const,
                name: 'One-Time Match', 
                matches: 'Single match', 
                price: '$2.00', 
                features: ['AI shade matching', 'Foundation database access', 'Basic recommendations'] 
              },
              { 
                id: 'weekly' as const,
                name: 'Weekly', 
                matches: 'Per week', 
                price: '$4.00', 
                features: ['Enhanced matching', 'Virtual try-on access', 'Weekly updates', 'Email support'] 
              },
              { 
                id: 'monthly' as const,
                name: 'Monthly Matches', 
                matches: 'Per month', 
                price: '$10.00', 
                features: ['Premium matching', 'Unlimited try-ons', 'Look recommendations', 'Priority support'], 
                popular: true 
              },
              { 
                id: 'yearly' as const,
                name: 'Annual', 
                matches: 'Per year', 
                price: '$100.00', 
                features: ['All features', 'Custom consultations', 'Exclusive products', 'Personal beauty advisor'] 
              }
            ].map((tier) => (
              <div 
                key={tier.name} 
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                  tier.popular ? 'border-rose-500 bg-rose-50 hover:bg-rose-100' : 'border-gray-200 bg-white hover:border-rose-300'
                } relative`}
                onClick={() => handlePayment(tier.id, tier.name)}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
                  </div>
                )}
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">{tier.name}</h3>
                  <p className="text-3xl font-bold text-rose-600">{tier.price}</p>
                  <p className="text-gray-600">{tier.matches}</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {tier.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayment(tier.id, tier.name);
                    }}
                  >
                    Choose Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;