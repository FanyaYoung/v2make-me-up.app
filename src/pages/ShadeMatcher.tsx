import React from 'react';
import Header from '../components/Header';
import { AISkinToneMatcher } from '../components/AISkinToneMatcher';
import { Toaster } from '@/components/ui/toaster';

const ShadeMatcher = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AISkinToneMatcher />
      </main>
      <Toaster />
    </div>
  );
};

export default ShadeMatcher;