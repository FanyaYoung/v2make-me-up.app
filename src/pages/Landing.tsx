import React from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Crown, Users } from 'lucide-react';

const Landing = () => {
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
            
            {/* Video/Image Placeholder */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-rose-100 to-purple-100 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Users className="h-16 w-16 text-rose-500 mx-auto" />
                  <p className="text-gray-600 font-medium">Video: Women Trying Foundation</p>
                  <p className="text-sm text-gray-500">Placeholder for hero video</p>
                </div>
              </div>
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
              { name: 'One-Time Match', matches: 'Single match', price: '$2.00', features: ['AI shade matching', 'Foundation database access', 'Basic recommendations'] },
              { name: 'Weekly', matches: 'Per week', price: '$4.00', features: ['Enhanced matching', 'Virtual try-on access', 'Weekly updates', 'Email support'] },
              { name: 'Monthly Matches', matches: 'Per month', price: '$10.00', features: ['Premium matching', 'Unlimited try-ons', 'Look recommendations', 'Priority support'], popular: true },
              { name: 'Annual', matches: 'Per year', price: '$100.00', features: ['All features', 'Custom consultations', 'Exclusive products', 'Personal beauty advisor'] }
            ].map((tier) => (
              <div key={tier.name} className={`p-6 rounded-xl border-2 ${tier.popular ? 'border-rose-500 bg-rose-50' : 'border-gray-200 bg-white'} relative`}>
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
                  <Button className="w-full" variant={tier.popular ? "default" : "outline"}>
                    Get Started
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