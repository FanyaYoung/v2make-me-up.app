import React from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, Package, ShoppingCart, Truck } from 'lucide-react';
import ImageSlideshow from '../components/ImageSlideshow';

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
                AI-Powered Foundation Matching & Delivery
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Find your perfect shade from Ulta, Sephora, Macy's and more. Order with flexible delivery options including shipping, local delivery, curbside pickup, or in-store pickup.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg px-8 py-4">
                  <Link to="/shade-matcher">Find My Shade</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
                  <Link to="/products">Browse Products</Link>
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
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-xl bg-white shadow-lg">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">1. AI Shade Match</h3>
              <p className="text-gray-600">
                Upload a photo or use your camera. Our AI instantly analyzes your skin tone and finds perfect foundation matches.
              </p>
              <Button asChild variant="ghost" className="text-rose-600">
                <Link to="/shade-matcher">Start Matching →</Link>
              </Button>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-white shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">2. Browse & Select</h3>
              <p className="text-gray-600">
                Shop from Ulta, Sephora, Macy's, and more. View product details, reviews, and pricing all in one place.
              </p>
              <Button asChild variant="ghost" className="text-purple-600">
                <Link to="/products">Browse Products →</Link>
              </Button>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-white shadow-lg">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                <Truck className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">3. Choose Delivery</h3>
              <p className="text-gray-600">
                Select shipping, local delivery (Uber), curbside pickup, or in-store pickup. Your perfect match delivered your way.
              </p>
              <Button asChild variant="ghost" className="text-pink-600">
                <Link to="/cart">View Cart →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Retailers Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Shop From Your Favorite Retailers
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Access products from Ulta, Sephora, Macy's, and our curated database of beauty brands. All in one convenient platform.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/shade-matcher">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/products">Browse All Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;