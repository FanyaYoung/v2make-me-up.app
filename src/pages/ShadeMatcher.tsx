import React from 'react';
import Header from '../components/Header';
import EnhancedFoundationMatcher from '../components/EnhancedFoundationMatcher';
import FoundationVisual from '../components/FoundationVisual';
import { Toaster } from '@/components/ui/toaster';
import AuthGuard from '../components/AuthGuard';

const ShadeMatcher = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        <div className="py-8">
          
          <FoundationVisual />
          
          <main className="container mx-auto px-4 py-8">
            <EnhancedFoundationMatcher />
          </main>
        </div>
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default ShadeMatcher;