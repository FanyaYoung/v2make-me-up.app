import React from 'react';
import Header from '@/components/Header';
import { AISkinToneMatcher } from '@/components/AISkinToneMatcher';
import { Toaster } from '@/components/ui/toaster';

const AISkinAnalyzer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AISkinToneMatcher />
      </main>
      <Toaster />
    </div>
  );
};

export default AISkinAnalyzer;
