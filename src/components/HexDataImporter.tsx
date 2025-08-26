import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const HexDataImporter = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; imported?: number } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('import-hex-data');

      if (error) {
        throw error;
      }

      setImportResult({
        success: true,
        message: data.message,
        imported: data.imported
      });
    } catch (error: any) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: error.message || 'Failed to import HEX data'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          HEX Shade Database Import
        </CardTitle>
        <CardDescription>
          Import the comprehensive skin tone HEX reference database to enable advanced shade matching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">What this imports:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 54 unique skin tone HEX values from light to deep</li>
            <li>• Lab color space conversion (L*, a*, b* values)</li>
            <li>• Undertone classification (Cool, Warm, Neutral, Olive)</li>
            <li>• Depth categorization for better matching</li>
          </ul>
        </div>

        <Button 
          onClick={handleImport} 
          disabled={importing || importResult?.success}
          className="w-full"
          size="lg"
        >
          {importing ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-spin" />
              Importing Database...
            </>
          ) : importResult?.success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Database Imported Successfully
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import HEX Database
            </>
          )}
        </Button>

        {importResult && (
          <div className={`p-4 rounded-lg border ${
            importResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="font-semibold">
                {importResult.success ? 'Success!' : 'Error'}
              </span>
            </div>
            <p className="text-sm">{importResult.message}</p>
            {importResult.imported && (
              <p className="text-sm mt-1">
                Imported {importResult.imported} skin tone references
              </p>
            )}
          </div>
        )}

        {importResult?.success && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>Next steps:</strong> You can now use the HEX Shade Matcher to find precise foundation matches. 
              The system will use the imported database to provide accurate color matching based on ΔE76 calculations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HexDataImporter;