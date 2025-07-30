import React, { useEffect } from 'react';
import { skinToneAnalyzer, SkinToneAnalysis } from './SkinToneAnalyzer';
import { useSkinToneReferences } from '@/hooks/useSkinToneReferences';

interface SkinToneAnalyzerWrapperProps {
  children: (analyzer: typeof skinToneAnalyzer) => React.ReactNode;
}

export const SkinToneAnalyzerWrapper = ({ children }: SkinToneAnalyzerWrapperProps) => {
  const { skinToneReferences, loading } = useSkinToneReferences();

  useEffect(() => {
    if (!loading && skinToneReferences.length > 0) {
      skinToneAnalyzer.setSkinToneReferences(skinToneReferences);
    }
  }, [skinToneReferences, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading skin tone analyzer...</p>
        </div>
      </div>
    );
  }

  return <>{children(skinToneAnalyzer)}</>;
};

export default SkinToneAnalyzerWrapper;