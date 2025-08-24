import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  Database, 
  Cloud, 
  Palette, 
  Sparkles, 
  Package,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

interface ImportResult {
  dataType: string;
  filesProcessed: number;
  recordsImported: number;
  errors: number;
  processedFiles: string[];
}

interface BulkImportSummary {
  totalFiles: number;
  totalRecords: number;
  totalErrors: number;
  importResults: ImportResult[];
}

const BulkGCSImporter = () => {
  const [bucketName, setBucketName] = useState('make-me-up-app');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['foundations', 'cosmetics']);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<BulkImportSummary | null>(null);
  const { toast } = useToast();

  const dataTypeOptions = [
    {
      id: 'foundations',
      label: 'Foundation Products',
      description: 'Foundation, concealer, and base makeup products',
      icon: <Palette className="w-5 h-5" />,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'cosmetics',
      label: 'Cosmetics Products',
      description: 'General makeup and beauty products',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-pink-100 text-pink-800'
    },
    {
      id: 'shades',
      label: 'Skin Tone References',
      description: 'Color references and skin tone data',
      icon: <Package className="w-5 h-5" />,
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  const handleDataTypeChange = (dataTypeId: string, checked: boolean) => {
    if (checked) {
      setSelectedDataTypes([...selectedDataTypes, dataTypeId]);
    } else {
      setSelectedDataTypes(selectedDataTypes.filter(id => id !== dataTypeId));
    }
  };

  const handleBulkImport = async () => {
    if (!bucketName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a bucket name",
        variant: "destructive",
      });
      return;
    }

    if (selectedDataTypes.length === 0) {
      toast({
        title: "No Data Types Selected",
        description: "Please select at least one data type to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-gcs-import', {
        body: {
          bucketName,
          importType: 'bulk',
          dataTypes: selectedDataTypes
        }
      });

      if (error) {
        throw error;
      }

      setImportSummary(data.summary);
      
      toast({
        title: "Bulk Import Completed",
        description: `Imported ${data.summary.totalRecords} records from ${data.summary.totalFiles} files`,
      });

    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to perform bulk import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = (result: ImportResult) => {
    if (result.errors > 0) {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusColor = (result: ImportResult) => {
    if (result.errors > 0) {
      return 'bg-orange-50 border-orange-200';
    }
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Main Import Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Bulk GCS Data Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bucket Configuration */}
          <div>
            <Label htmlFor="bucket">GCS Bucket Name</Label>
            <Input
              id="bucket"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="e.g., make-me-up-app"
              className="mt-1"
            />
          </div>

          {/* Data Type Selection */}
          <div>
            <Label className="text-base font-medium">Select Data Types to Import</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {dataTypeOptions.map((option) => (
                <Card 
                  key={option.id} 
                  className={`cursor-pointer transition-all ${
                    selectedDataTypes.includes(option.id) 
                      ? 'ring-2 ring-purple-500 bg-purple-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleDataTypeChange(option.id, !selectedDataTypes.includes(option.id))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedDataTypes.includes(option.id)}
                        onCheckedChange={(checked) => handleDataTypeChange(option.id, !!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={option.color}>
                            {option.icon}
                          </Badge>
                          <span className="font-medium">{option.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Import Action */}
          <div className="flex justify-center">
            <Button 
              onClick={handleBulkImport}
              disabled={isImporting || selectedDataTypes.length === 0}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
            >
              {isImporting ? (
                <>
                  <Download className="w-5 h-5 mr-2 animate-pulse" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Start Bulk Import
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Import Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importSummary.totalFiles}
                </div>
                <div className="text-sm text-blue-700">Files Processed</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importSummary.totalRecords.toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Records Imported</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {importSummary.totalErrors}
                </div>
                <div className="text-sm text-orange-700">Errors</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((importSummary.totalRecords / (importSummary.totalRecords + importSummary.totalErrors)) * 100)}%
                </div>
                <div className="text-sm text-purple-700">Success Rate</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Import Details</h4>
              {importSummary.importResults.map((result, index) => (
                <Card key={index} className={`border ${getStatusColor(result)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result)}
                        <span className="font-medium capitalize">{result.dataType}</span>
                        <Badge variant="outline">
                          {result.filesProcessed} files
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.recordsImported.toLocaleString()} records imported
                      </div>
                    </div>
                    
                    {result.processedFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Processed Files:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.processedFiles.slice(0, 5).map((fileName, fileIndex) => (
                            <Badge key={fileIndex} variant="secondary" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {fileName.split('/').pop()?.substring(0, 20)}...
                            </Badge>
                          ))}
                          {result.processedFiles.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{result.processedFiles.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Import Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">What gets imported:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li><strong>Foundations:</strong> Products matching patterns like "*foundation*", "*base*", "*concealer*"</li>
                <li><strong>Cosmetics:</strong> General beauty products from files containing "*cosmetics*", "*makeup*", "*beauty*"</li>
                <li><strong>Shades:</strong> Skin tone and color reference data from "*shade*", "*color*", "*tone*" files</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-green-800 mb-2">Automatic Processing:</h4>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Files are automatically categorized based on filename patterns</li>
                <li>CSV data is mapped to appropriate database tables</li>
                <li>Duplicate records are handled via upsert operations</li>
                <li>Brand information is automatically linked or created</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkGCSImporter;