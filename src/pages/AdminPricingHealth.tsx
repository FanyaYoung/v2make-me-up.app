import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { PriceFreshness } from '@/components/PriceFreshness';

type EndpointStatus = 'ok' | 'degraded' | 'down' | 'not_configured';

interface EndpointResult {
  id: string;
  name: string;
  category: string;
  status: EndpointStatus;
  httpStatus: number | null;
  latencyMs: number | null;
  detail: string;
  checkedAt: string;
}

interface RecentFetch {
  brand: string | null;
  product: string | null;
  retailer: string | null;
  price: number | null;
  source: string | null;
  availability: string | null;
  last_checked_at: string | null;
}

interface HealthReport {
  generatedAt: string;
  endpoints: EndpointResult[];
  cache: {
    totalRows: number;
    freshRows: number;
    staleRows: number;
    fetchedLastHour: number;
  };
  recentFetches: RecentFetch[];
}

const statusStyles: Record<EndpointStatus, { label: string; className: string }> = {
  ok: { label: 'Responding', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  degraded: { label: 'Degraded', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  down: { label: 'Down', className: 'bg-destructive/15 text-destructive' },
  not_configured: { label: 'Not configured', className: 'bg-muted text-muted-foreground' },
};

export default function AdminPricingHealth() {
  const { role, loading: roleLoading } = useUserRole();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('pricing-health');
      if (invokeError) throw invokeError;
      setReport(data as HealthReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run the health check.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) runCheck();
  }, [isAdmin, runCheck]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Live Pricing Health</h1>
            <p className="text-sm text-muted-foreground">
              Internal status of retailer endpoints and the live pricing cache.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={runCheck} disabled={loading} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Re-run check
            </Button>
          )}
        </div>

        {roleLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !isAdmin ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
              <ShieldAlert className="h-5 w-5" />
              This page is restricted to administrators.
            </CardContent>
          </Card>
        ) : (
          <>
            {error && (
              <Card className="border-destructive/40">
                <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Retailer endpoints</CardTitle>
                <CardDescription>
                  {report ? `Checked ${new Date(report.generatedAt).toLocaleString()}` : 'Running check…'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && !report && <Skeleton className="h-24 w-full" />}
                {report?.endpoints.map((endpoint) => {
                  const style = statusStyles[endpoint.status] ?? statusStyles.down;
                  return (
                    <div
                      key={endpoint.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{endpoint.name}</p>
                        <p className="text-xs text-muted-foreground">{endpoint.detail}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {endpoint.httpStatus !== null && <span>HTTP {endpoint.httpStatus}</span>}
                        {endpoint.latencyMs !== null && <span>{endpoint.latencyMs} ms</span>}
                        <Badge className={style.className} variant="secondary">
                          {style.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing cache</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Cached products', value: report?.cache.totalRows },
                  { label: 'Fresh (unexpired)', value: report?.cache.freshRows },
                  { label: 'Fetched last hour', value: report?.cache.fetchedLastHour },
                  { label: 'Stale > 24h', value: report?.cache.staleRows },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border p-3">
                    <p className="text-2xl font-semibold">{stat.value ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most recent fetches</CardTitle>
                <CardDescription>Last 20 product price lookups stored by the pricing function.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {report?.recentFetches.length === 0 && (
                  <p className="text-sm text-muted-foreground">No live pricing records yet.</p>
                )}
                {report?.recentFetches.map((row, index) => (
                  <div
                    key={`${row.brand}-${row.product}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {row.brand} — {row.product}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.retailer || 'Unknown retailer'} · {row.source || 'unknown source'} ·{' '}
                        {row.availability || 'availability unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {typeof row.price === 'number' ? `$${row.price.toFixed(2)}` : 'No price'}
                      </p>
                      <PriceFreshness
                        checkedAt={row.last_checked_at}
                        source={row.source === 'rakuten' ? 'live' : row.source === 'cache' ? 'cache' : 'catalog'}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
