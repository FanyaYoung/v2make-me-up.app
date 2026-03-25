export type AffiliateProvider = 'amazon' | 'rakuten' | 'other';

const AMAZON_HOSTS = [
  'amazon.com',
  'www.amazon.com',
  'smile.amazon.com',
  'amzn.to',
];

const sanitizeAssociateTag = (value: string) =>
  value.trim().replace(/[^a-zA-Z0-9-]/g, '');

export const inferAffiliateProvider = (url?: string): AffiliateProvider => {
  if (!url) return 'other';
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (AMAZON_HOSTS.includes(host)) return 'amazon';
    if (host.includes('linksynergy') || host.includes('rakuten')) return 'rakuten';
    return 'other';
  } catch {
    return 'other';
  }
};

export const buildAffiliateUrl = (rawUrl?: string, productId?: string): string | undefined => {
  if (!rawUrl) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const provider = inferAffiliateProvider(rawUrl);
  if (provider !== 'amazon') return rawUrl;

  const tag = sanitizeAssociateTag(import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || '');
  if (!tag) return rawUrl;

  // Preserve existing params but ensure our tag is present.
  parsed.searchParams.set('tag', tag);
  if (productId) {
    parsed.searchParams.set('ascsubtag', productId);
  }
  return parsed.toString();
};
