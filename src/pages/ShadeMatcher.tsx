import React from 'react';
import Header from '../components/Header';
import EnhancedFoundationMatcher from '../components/EnhancedFoundationMatcher';
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
              Find Your Perfect Shade
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover foundation shades that match your skin tone perfectly.
            </p>
          </div>
          
          <main className="container mx-auto px-4 max-w-4xl">
            <EnhancedFoundationMatcher />
          </main>
        </div>
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default ShadeMatcher;