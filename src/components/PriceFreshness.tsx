import { useEffect, useState } from 'react';
import { Clock, RefreshCw, Database, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PriceSource = 'live' | 'cache' | 'catalog' | 'unavailable';

interface PriceFreshnessProps {
  checkedAt?: string | Date | null;
  source?: PriceSource;
  className?: string;
}

const STALE_AFTER_MS = 60 * 60 * 1000; // 1 hour

const formatRelative = (timestamp: number) => {
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Small inline indicator showing how recently a price was fetched
 * and where it came from (live retailer feed, cached, or catalog).
 */
export const PriceFreshness = ({ checkedAt, source = 'catalog', className }: PriceFreshnessProps) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const timestamp = checkedAt ? new Date(checkedAt).getTime() : NaN;
  const hasTimestamp = Number.isFinite(timestamp);
  const isStale = hasTimestamp && Date.now() - timestamp > STALE_AFTER_MS;

  let Icon = Clock;
  let label: string;
  let tone = 'text-muted-foreground';

  if (source === 'unavailable') {
    Icon = AlertCircle;
    label = 'Price unavailable';
    tone = 'text-destructive';
  } else if (source === 'catalog') {
    Icon = Database;
    label = hasTimestamp ? `Catalog price · ${formatRelative(timestamp)}` : 'Catalog price';
  } else if (!hasTimestamp) {
    Icon = RefreshCw;
    label = source === 'cache' ? 'Cached price' : 'Live price';
  } else {
    Icon = RefreshCw;
    label = `${source === 'cache' ? 'Cached' : 'Live'} · updated ${formatRelative(timestamp)}`;
    tone = isStale ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[11px] leading-tight', tone, className)}
      title={hasTimestamp ? `Fetched ${new Date(timestamp).toLocaleString()}` : undefined}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

export default PriceFreshness;
