import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createPigmentColor } from '@/lib/pigmentMixing';

interface SavedMatch {
  id: string;
  created_at: string;
  lightest_hex: string;
  darkest_hex: string;
  matched_products: any[];
  photo_url: string | null;
}

export const SavedMatches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSavedMatches();
    }
  }, [user]);

  const loadSavedMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_shade_matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedMatches(data as any || []);
    } catch (error: any) {
      toast({
        title: "Failed to Load",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('saved_shade_matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;
      toast({ title: "Deleted Successfully" });
      loadSavedMatches();
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Shade Matches</CardTitle>
          <CardDescription>Sign in to view your saved matches</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <Card><CardContent className="pt-6"><p>Loading...</p></CardContent></Card>;
  }

  if (savedMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Saved Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/shade-matcher')}>Start Shade Matching</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Saved Shade Matches</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {savedMatches.map((match) => (
          <Card key={match.id} className="border-2 hover:border-primary transition-all">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Shade Match</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(match.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteMatch(match.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Badge>Light</Badge>
                  <div className="h-20 rounded-lg" style={{ backgroundColor: createPigmentColor(match.lightest_hex).hex }} />
                  <p className="text-xs font-mono text-center">{match.lightest_hex}</p>
                </div>
                <div className="space-y-2">
                  <Badge>Dark</Badge>
                  <div className="h-20 rounded-lg" style={{ backgroundColor: createPigmentColor(match.darkest_hex).hex }} />
                  <p className="text-xs font-mono text-center">{match.darkest_hex}</p>
                </div>
              </div>
              <Button variant="default" className="w-full" onClick={() => navigate('/shade-matcher', { state: { loadedMatch: match } })}>
                <Eye className="w-4 h-4 mr-2" />
                View Products
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
