import React from 'react';
import Header from '../components/Header';
import FoundationMatcher from '../components/FoundationMatcher';
import FoundationVisual from '../components/FoundationVisual';
import ShadeComparison from '../components/ShadeComparison';
import { Toaster } from '@/components/ui/toaster';
import AuthGuard from '../components/AuthGuard';

const ShadeMatcher = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        <div className="py-8">
          <div className="container mx-auto px-4 text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
              AI Foundation Shade Matcher
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find your perfect foundation match from thousands of products using our advanced AI technology.
            </p>
          </div>
          
          <FoundationVisual />
          
          <main className="container mx-auto px-4 py-8">
            <FoundationMatcher />
          </main>
          
          <ShadeComparison />
        </div>
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default ShadeMatcher;