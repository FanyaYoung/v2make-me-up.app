import React from 'react';
import Header from '../components/Header';
import LightingAwareFoundationMatcher from '../components/LightingAwareFoundationMatcher';
import { Toaster } from '@/components/ui/toaster';

const LightingMatcher = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <LightingAwareFoundationMatcher />
      </main>
      <Toaster />
    </div>
  );
};

export default LightingMatcher;
