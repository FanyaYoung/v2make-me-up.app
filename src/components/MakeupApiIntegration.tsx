import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';

const MakeupApiIntegration: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleImportMakeupApi = async () => {
    setIsImporting(true);
    setProgress(0);
    setImportStatus('idle');
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const { data, error } = await supabase.functions.invoke('fetch-makeup-api', {
        method: 'POST'
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      if (data?.success) {
        setImportStatus('success');
        toast.success(`Successfully imported ${data.processed_count} makeup products!`);
      } else {
        throw new Error(data?.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      toast.error('Failed to import makeup products. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Makeup API Integration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Import foundation products from the external Makeup API to supplement our database
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm">
            This will fetch foundation products from makeup-api.herokuapp.com and add them to our cosmetics database.
          </p>
          
          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Importing products... {progress}%
              </p>
            </div>
          )}
          
          {importStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Import completed successfully!</span>
            </div>
          )}
          
          {importStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Import failed. Please try again.</span>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleImportMakeupApi}
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? 'Importing...' : 'Import Makeup API Products'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MakeupApiIntegration;