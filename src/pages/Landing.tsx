import React from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Sparkles, Package, ShoppingCart, Truck } from 'lucide-react';
import ImageSlideshow from '../components/ImageSlideshow';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-purple-50/50" />
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Hero Image - Smaller size */}
            <div className="relative order-1 lg:order-2 flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <ImageSlideshow
                  images={[
                    '/lovable-uploads/efce4647-6298-4ee0-a79a-919451a96f45.png',
                    '/lovable-uploads/b7f78823-7566-40da-8231-db2bfe83f2a7.png',
                    '/lovable-uploads/a68d3215-f709-4f7d-8787-82bf8d454614.png'
                  ]}
                  duration={15000}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
            
            {/* Hero Content */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="inline-block">
                <Badge className="text-sm px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-500 text-white border-0">
                  AI-Powered Matching
                </Badge>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Your Perfect Shade
                </span>
                <br />
                <span className="text-gray-800">Delivered Your Way</span>
              </h1>
              <div className="flex flex-wrap gap-3 items-center text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                  </div>
                  <span>AI Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>Top Brands</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-pink-600" />
                  </div>
                  <span>Flexible Delivery</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild size="lg" className="text-base px-8 bg-gradient-to-r from-rose-500 to-purple-500 hover:shadow-xl transition-all">
                  <Link to="/shade-matcher">Find My Shade</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8">
                  <Link to="/products">Browse Products</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white hover:shadow-2xl transition-all hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <Sparkles className="w-12 h-12 mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2">AI Match</h3>
              <p className="text-white/90 mb-4">Instant shade analysis</p>
              <Button asChild variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Link to="/shade-matcher">Try Now →</Link>
              </Button>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-8 text-white hover:shadow-2xl transition-all hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <Package className="w-12 h-12 mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2">Top Retailers</h3>
              <p className="text-white/90 mb-4">Ulta, Sephora & more</p>
              <Button asChild variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Link to="/products">Shop Now →</Link>
              </Button>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 p-8 text-white hover:shadow-2xl transition-all hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <Truck className="w-12 h-12 mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2">Your Way</h3>
              <p className="text-white/90 mb-4">4 delivery options</p>
              <Button asChild variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Link to="/cart">Learn More →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Ready to Find Your Perfect Match?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-base px-8 bg-white text-purple-600 hover:bg-white/90">
                <Link to="/shade-matcher">Start AI Matching</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 border-white text-white hover:bg-white/10">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;