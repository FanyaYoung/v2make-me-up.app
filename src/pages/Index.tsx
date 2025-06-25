
import React from 'react';
import FoundationMatcher from '../components/FoundationMatcher';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FoundationVisual from '../components/FoundationVisual';
import ShadeComparison from '../components/ShadeComparison';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      <HeroSection />
      <FoundationVisual />
      <main className="container mx-auto px-4 py-8">
        <FoundationMatcher />
      </main>
      <ShadeComparison />
    </div>
  );
};

export default Index;
