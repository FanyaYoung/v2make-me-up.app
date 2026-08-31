import { buildAffiliateUrl, inferAffiliateProvider } from '@/lib/affiliate';

type ShopLinkCandidates = {
  productId?: string;
  retailerUrl?: string;
  productUrl?: string;
  websiteLink?: string;
  productLink?: string;
  affiliateUrl?: string;
};

const normalizeUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    return new URL(trimmed).toString();
  } catch {
    if (trimmed.startsWith('//')) {
      return `https:${trimmed}`;
    }
    return undefined;
  }
};

const isAffiliateRedirectUrl = (value?: string) => {
  const normalized = normalizeUrl(value);
  if (!normalized) return false;

  if (inferAffiliateProvider(normalized) === 'rakuten') {
    return true;
  }

  try {
    const host = new URL(normalized).hostname.toLowerCase();
    return (
      host.includes('impact.com') ||
      host.includes('go.redirectingat.com') ||
      host.includes('redirectingat.com') ||
      host.includes('howl.me')
    );
  } catch {
    return false;
  }
};

export const resolveRetailerProductUrl = ({
  retailerUrl,
  productUrl,
  websiteLink,
  productLink,
  affiliateUrl,
}: ShopLinkCandidates) => {
  const directCandidates = [retailerUrl, productUrl, websiteLink];

  for (const candidate of directCandidates) {
    const normalized = normalizeUrl(candidate);
    if (normalized) return normalized;
  }

  const normalizedProductLink = normalizeUrl(productLink);
  if (normalizedProductLink && !isAffiliateRedirectUrl(normalizedProductLink)) {
    return normalizedProductLink;
  }

  const normalizedAffiliateUrl = normalizeUrl(affiliateUrl);
  if (normalizedAffiliateUrl && !isAffiliateRedirectUrl(normalizedAffiliateUrl)) {
    return normalizedAffiliateUrl;
  }

  return normalizedProductLink || normalizedAffiliateUrl || undefined;
};

export const resolveAffiliateTrackingUrl = ({
  productId,
  retailerUrl,
  productUrl,
  websiteLink,
  productLink,
  affiliateUrl,
}: ShopLinkCandidates) => {
  const normalizedAffiliateUrl = normalizeUrl(affiliateUrl);
  if (normalizedAffiliateUrl) return normalizedAffiliateUrl;

  const normalizedProductLink = normalizeUrl(productLink);
  if (normalizedProductLink && isAffiliateRedirectUrl(normalizedProductLink)) {
    return normalizedProductLink;
  }

  const retailerProductUrl = resolveRetailerProductUrl({
    retailerUrl,
    productUrl,
    websiteLink,
    productLink,
  });

  return retailerProductUrl ? buildAffiliateUrl(retailerProductUrl, productId) : undefined;
};

export const resolveShopDestinationUrl = (links: ShopLinkCandidates) =>
  resolveRetailerProductUrl(links) || resolveAffiliateTrackingUrl(links) || '';
