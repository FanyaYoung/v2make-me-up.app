
import React from 'react';
import { Search, Palette, Users } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Hero Image with Women of Different Skin Tones */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1594824694996-8cc1b2b5c6a8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Women with diverse skin tones representing foundation matching"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/80 via-purple-900/70 to-rose-900/80"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-rose-300 to-purple-300 bg-clip-text text-transparent">
              Foundation Match
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-rose-100 max-w-3xl mx-auto leading-relaxed">
            Discover identical shades across all brands. Our AI-powered matching system finds your perfect foundation based on your current shade, with virtual try-on and real-time availability.
          </p>
          
          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Search className="w-8 h-8 text-rose-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Matching</h3>
              <p className="text-rose-100 text-sm">AI-powered shade matching across 50+ brands</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Palette className="w-8 h-8 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Virtual Try-On</h3>
              <p className="text-rose-100 text-sm">See how shades look on your skin tone</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Users className="w-8 h-8 text-rose-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">For Every Skin Tone</h3>
              <p className="text-rose-100 text-sm">Inclusive matching for all skin tones</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
