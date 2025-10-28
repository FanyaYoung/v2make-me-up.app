import React from 'react';
import Header from '../components/Header';
import ComprehensiveSkinToneAnalyzer from '../components/ComprehensiveSkinToneAnalyzer';
import { Toaster } from '@/components/ui/toaster';

const SkinToneAnalyzer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      <main className="py-8">
        <ComprehensiveSkinToneAnalyzer />
      </main>
      <Toaster />
    </div>
  );
};

export default SkinToneAnalyzer;
