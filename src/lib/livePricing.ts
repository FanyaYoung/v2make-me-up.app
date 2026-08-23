import { supabase } from '@/integrations/supabase/client';
import { buildAffiliateUrl, inferAffiliateProvider } from '@/lib/affiliate';
import { loadProductMetadataMap, makeProductKey, type ProductMetadata } from '@/lib/productMetadata';
import type { FoundationMatch } from '@/types/foundation';

const LIVE_PRICE_TTL_MS = 5 * 60 * 1000;

type PricingSnapshot = {
  price?: number;
  salePrice?: number;
  imageUrl?: string;
  productUrl?: string;
  affiliateUrl?: string;
  affiliateProvider?: 'amazon' | 'rakuten' | 'other';
  retailer?: string;
  checkedAt?: string;
  source: 'live' | 'catalog' | 'unavailable';
};

type PricingLookupOptions = {
  forceRefresh?: boolean;
};

const pricingCache = new Map<string, { expiresAt: number; data: PricingSnapshot }>();
let metadataPromise: Promise<Map<string, ProductMetadata>> | null = null;

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const getMetadataMap = async () => {
  if (!metadataPromise) {
    metadataPromise = loadProductMetadataMap();
  }
  return metadataPromise;
};

const fetchCachedLivePricing = async (
  brand: string,
  product: string,
  options?: PricingLookupOptions
): Promise<PricingSnapshot | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-live-product-pricing', {
      body: {
        brand,
        product,
        forceRefresh: options?.forceRefresh ?? false,
      },
    });

    if (error) {
      console.warn('Live pricing lookup failed', error);
      return null;
    }

    const snapshot = data as {
      price?: number;
      salePrice?: number;
      imageUrl?: string;
      productUrl?: string;
      affiliateUrl?: string;
      retailer?: string;
      checkedAt?: string;
      source?: PricingSnapshot['source'];
    } | null;

    if (!snapshot) return null;
    const resolvedProductUrl = snapshot.productUrl;
    const affiliateUrl = buildAffiliateUrl(snapshot.affiliateUrl || snapshot.productUrl);

    return {
      price: typeof snapshot.price === 'number' && snapshot.price > 0 ? snapshot.price : undefined,
      salePrice: typeof snapshot.salePrice === 'number' && snapshot.salePrice > 0 ? snapshot.salePrice : undefined,
      imageUrl: snapshot.imageUrl,
      productUrl: resolvedProductUrl,
      affiliateUrl,
      affiliateProvider: inferAffiliateProvider(affiliateUrl),
      retailer: snapshot.retailer || brand,
      checkedAt: snapshot.checkedAt,
      source: snapshot.source || 'live',
    };
  } catch (error) {
    console.warn('Cached live pricing lookup threw', error);
    return null;
  }
};

export const getProductPricingSnapshot = async (
  brand: string,
  product: string,
  options?: PricingLookupOptions
): Promise<PricingSnapshot> => {
  const cacheKey = makeProductKey(brand, product);
  const cached = pricingCache.get(cacheKey);
  if (!options?.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const metadataMap = await getMetadataMap();
  const metadata = metadataMap.get(cacheKey);
  const baseSnapshot: PricingSnapshot = metadata
    ? {
        price: metadata.price,
        imageUrl: metadata.imageUrl,
        productUrl: metadata.productUrl || metadata.websiteLink,
        affiliateUrl: buildAffiliateUrl(metadata.productUrl || metadata.websiteLink),
        affiliateProvider: inferAffiliateProvider(buildAffiliateUrl(metadata.productUrl || metadata.websiteLink)),
        retailer: metadata.retailer,
        source: 'catalog',
      }
    : { source: 'unavailable' };

  const liveSnapshot = await fetchCachedLivePricing(brand, product, options);
  const merged: PricingSnapshot = {
    ...baseSnapshot,
    ...(liveSnapshot || {}),
    source: liveSnapshot ? 'live' : baseSnapshot.source,
  };

  pricingCache.set(cacheKey, {
    expiresAt: Date.now() + LIVE_PRICE_TTL_MS,
    data: merged,
  });

  return merged;
};

export const hydrateFoundationMatchPricing = async (
  match: FoundationMatch,
  options?: PricingLookupOptions
): Promise<FoundationMatch> => {
  const snapshot = await getProductPricingSnapshot(match.brand, match.product, options);

  return {
    ...match,
    price: snapshot.price ?? match.price ?? 0,
    salePrice: snapshot.salePrice ?? match.salePrice,
    imageUrl: snapshot.imageUrl || match.imageUrl,
    productUrl: snapshot.productUrl || match.productUrl,
    affiliateUrl: snapshot.affiliateUrl || match.affiliateUrl,
    retailer: snapshot.retailer || match.retailer,
    priceCheckedAt: snapshot.checkedAt || match.priceCheckedAt,
    priceSource: snapshot.source,
  };
};

export const hydrateFoundationMatchesPricing = async (matches: FoundationMatch[]) =>
  Promise.all(matches.map((match) => hydrateFoundationMatchPricing(match)));

export const refreshFoundationMatchesPricing = async (matches: FoundationMatch[]) =>
  Promise.all(matches.map((match) => hydrateFoundationMatchPricing(match, { forceRefresh: true })));

export const hydrateFoundationPairsPricing = async (pairs: FoundationMatch[][]) =>
  Promise.all(pairs.map((pair) => hydrateFoundationMatchesPricing(pair)));
