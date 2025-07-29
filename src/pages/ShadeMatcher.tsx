import React from 'react';
import Header from '../components/Header';
import EnhancedFoundationMatcher from '../components/EnhancedFoundationMatcher';
import FoundationVisual from '../components/FoundationVisual';
import SkinToneChart from '../components/SkinToneChart';
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
              Find your perfect foundation pair using advanced color science and our comprehensive product database.
            </p>
          </div>
          
          <FoundationVisual />
          
          <main className="container mx-auto px-4 py-8 space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <SkinToneChart />
              <EnhancedFoundationMatcher />
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default ShadeMatcher;