# Live Cosmetics Search

This repo already had live pricing and affiliate search functions. The new
`search-live-cosmetics` edge function adds a single backend entry point for
real-time foundation and makeup discovery.

## What it does

- authenticates the signed-in user
- fans out to existing `rakuten-product-search` and `ulta-product-search`
- normalizes results into one product shape
- filters by `foundation`, `makeup`, or `all`
- deduplicates and sorts results

## Function name

`search-live-cosmetics`

## Request body

```json
{
  "keywords": "nars foundation",
  "brand": "NARS",
  "productName": "Light Reflecting Foundation",
  "category": "foundation",
  "limit": 12,
  "providers": ["rakuten", "ulta"]
}
```

## Response shape

```json
{
  "query": "NARS Light Reflecting Foundation foundation",
  "total": 2,
  "providers": ["rakuten", "ulta"],
  "products": [
    {
      "id": "123",
      "provider": "ulta",
      "brand": "NARS",
      "name": "Light Reflecting Foundation",
      "price": 52,
      "salePrice": null,
      "rating": 4.6,
      "reviewCount": 1120,
      "imageUrl": "https://...",
      "productUrl": "https://...",
      "affiliateUrl": "https://...",
      "retailer": "Ulta Beauty",
      "inStock": true,
      "category": "foundation"
    }
  ]
}
```

## Deploy

```bash
supabase functions deploy search-live-cosmetics
```

## Notes

- This is the right backend layer for `makemeup.app` today because the app is
  already built on Supabase edge functions.
- If you still want AWS Amplify involved, the sensible use would be hosting or
  orchestration around this service, not replacing the existing live search
  backend.
