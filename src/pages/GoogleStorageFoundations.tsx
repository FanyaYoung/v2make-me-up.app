import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleStorageFoundationImporter from '@/components/GoogleStorageFoundationImporter';
import EnhancedFoundationBrowser from '@/components/EnhancedFoundationBrowser';
import BulkGCSImporter from '@/components/BulkGCSImporter';
import { Cloud, Database, Search, Download } from 'lucide-react';

const GoogleStorageFoundations = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Google Storage Foundation Integration
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Import and browse foundation products directly from Google Cloud Storage. 
            Seamlessly integrate your product catalog with our makeup matching system.
          </p>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Browse Foundations
            </TabsTrigger>
            <TabsTrigger value="bulk-import" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Bulk Import
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Single File Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <EnhancedFoundationBrowser />
          </TabsContent>

          <TabsContent value="bulk-import" className="space-y-6">
            <BulkGCSImporter />
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <GoogleStorageFoundationImporter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GoogleStorageFoundations;