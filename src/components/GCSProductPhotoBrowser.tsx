import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Search, Image, Download, ExternalLink, Loader2 } from 'lucide-react';

interface GCSFile {
  name: string;
  size: string;
  updated: string;
  downloadUrl?: string;
}

interface GCSProductPhotoBrowserProps {
  bucketName?: string;
  onPhotoSelect?: (photoUrl: string, fileName: string) => void;
}

const GCSProductPhotoBrowser: React.FC<GCSProductPhotoBrowserProps> = ({
  bucketName = 'makeup-product-photos',
  onPhotoSelect
}) => {
  const [files, setFiles] = useState<GCSFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prefix, setPrefix] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gcs-file-manager', {
        body: {
          action: 'list',
          bucketName,
          prefix: prefix || undefined
        }
      });

      if (error) throw error;
      
      if (data?.files) {
        setFiles(data.files);
        toast.success(`Loaded ${data.files.length} product photos`);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load product photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [bucketName, prefix]);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImageUrl = async (fileName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gcs-file-manager', {
        body: {
          action: 'download',
          bucketName,
          fileName
        }
      });

      if (error) throw error;
      return data?.downloadUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  };

  const handlePhotoClick = async (file: GCSFile) => {
    if (onPhotoSelect) {
      const url = await getImageUrl(file.name);
      if (url) {
        onPhotoSelect(url, file.name);
        setSelectedPhotos(prev => new Set([...prev, file.name]));
      }
    }
  };

  const extractProductInfo = (fileName: string) => {
    // Extract brand and product name from filename
    // Assumes format like "brand-name_product-name_shade.jpg"
    const parts = fileName.split('_');
    const brand = parts[0]?.replace(/-/g, ' ').replace(/\.[^/.]+$/, '');
    const product = parts[1]?.replace(/-/g, ' ');
    const shade = parts[2]?.replace(/-/g, ' ').replace(/\.[^/.]+$/, '');
    
    return { brand, product, shade };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Product Photo Browser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Folder prefix (e.g., foundations/)"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
            </div>
            <Button onClick={loadFiles} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Bucket: <Badge variant="outline">{bucketName}</Badge>
            {prefix && (
              <>
                {' '} Prefix: <Badge variant="outline">{prefix}</Badge>
              </>
            )}
            {' '} Found: <Badge variant="secondary">{filteredFiles.length} photos</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFiles.map((file) => {
          const { brand, product, shade } = extractProductInfo(file.name);
          const isSelected = selectedPhotos.has(file.name);
          
          return (
            <Card 
              key={file.name}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handlePhotoClick(file)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  <div className="text-muted-foreground text-center p-4">
                    <Image className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">Click to load image</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm truncate">{file.name}</h4>
                  
                  {brand && (
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">{brand}</Badge>
                      {product && <p className="text-xs text-muted-foreground truncate">{product}</p>}
                      {shade && <p className="text-xs text-muted-foreground truncate">Shade: {shade}</p>}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{file.size}</span>
                    <span>{new Date(file.updated).toLocaleDateString()}</span>
                  </div>
                  
                  {isSelected && (
                    <Badge variant="default" className="text-xs">Selected</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFiles.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No photos found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search term or folder prefix
            </p>
            <Button onClick={loadFiles} variant="outline">
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GCSProductPhotoBrowser;