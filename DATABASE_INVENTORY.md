# Database Tables Inventory

## Complete Database Tables Chart

| # | Table Name | Primary Purpose | Has Images? | Image Fields | Used For |
|---|---|---|---|---|---|
| **PRODUCT & SHADE DATA** |
| 1 | Primary Tables | Core product catalog with shades | ✅ Yes | imgSrc, imgAlt, Swatch: imgSrc | Main product browsing, shade matching |
| 2 | productsandshadeswithimages | Products and shades with full image data | ✅ Yes | imgSrc, Swatch: imgSrc | Foundation matching, color analysis |
| 3 | alphabeticalproductsbyhex | Products sorted by hex color | ✅ Yes | imgSrc, Swatch: imgSrc | Alphabetical product browsing |
| 4 | products_by_pigmentation | Products organized by color properties | ✅ Yes | imgSrc, Swatch: imgSrc | Pigmentation-based matching |
| 5 | hex_catalog | Hex color catalog | ✅ Yes | imgsrc | Color reference lookup |
| 6 | foundation_products | Foundation product details | ✅ Yes | image_url | Product information display |
| 7 | foundation_shades | Individual foundation shades | ❌ No | None | Shade data without visuals |
| 8 | cosmetics_products | Imported cosmetics from datasets | ✅ Yes | image_url | Extended product catalog |
| **SKIN TONE REFERENCE** |
| 9 | Skintonehexwithswatches | Skin tone hex codes with swatches | ✅ Yes | Swatch: Hex Number | Skin tone reference matching |
| 10 | SkintoneOvertoneUndertone | Skin tone classification data | ❌ No | None | Undertone analysis |
| 11 | foundation_palette | Foundation color palette | ✅ Yes | swatch_data_uri | Color palette display |
| **MATCHING & ANALYSIS** |
| 12 | foundation_shade_matches | Pre-calculated shade matches | ❌ No | None | Fast shade matching queries |
| 13 | foundation_matches | User's foundation matches | ❌ No | None | User match history |
| 14 | face_regions | Face scan region data | ❌ No | None | Multi-region face analysis |
| **BRANDS** |
| 15 | brands | Brand information | ✅ Yes | logo_url | Brand display, filtering |
| 16 | makeup_brands | Extended brand details | ✅ Yes | logo_url | Brand reference data |
| 17 | brand_referral_codes | Affiliate codes | ❌ No | None | Affiliate tracking |
| **REVIEWS & RATINGS** |
| 18 | Ulta Makeup Reviews | Product reviews from Ulta | ❌ No | None | Review data, ratings |
| 19 | cleaned makeup products | Cleaned product data | ❌ No | None | Data processing reference |
| **USER DATA** |
| 20 | profiles | User profiles | ✅ Yes | avatar_url | User settings, preferences |
| 21 | foundation_feedback | User feedback on matches | ❌ No | None | Algorithm improvement |
| **TEST DATA** |
| 22 | mst-e_image_details | MST-E dataset image metadata | ❌ No | None | Testing, validation |
| 23 | golden_and_adversarial_mst-e_image_ids | Test image IDs | ❌ No | None | Algorithm testing |
| **ORDERS & COMMERCE** |
| 24 | orders | Customer orders | ❌ No | None | Order management |
| 25 | order_items | Individual order items | ❌ No | None | Order details |
| **PRODUCT ORGANIZATION** |
| 26 | product_categories | Product categories | ❌ No | None | Product organization |
| 27 | product_variants | Product variants (size, color) | ❌ No | None | Variant management |
| 28 | product_availability | Stock and availability | ❌ No | None | Inventory tracking |
| 29 | product_ingredients | Product ingredients | ❌ No | None | Ingredient information |
| 30 | cosmetics_product_attributes | Product attributes | ❌ No | None | Product metadata |
| 31 | products | General products table | ❌ No | None | Product base data |
| **MESSAGING** |
| 32 | conversations | User conversations | ❌ No | None | Messaging system |
| 33 | conversation_members | Conversation participants | ❌ No | None | Conversation access |
| 34 | messages | Individual messages | ❌ No | None | Message content |

## Summary Statistics

- **Total Tables:** 34
- **Tables with Images:** 11 (32%)
- **Tables without Images:** 23 (68%)

## Primary Tables Used for Foundation Matching

1. **productsandshadeswithimages** - Main matching table with visual data
2. **foundation_shade_matches** - Pre-calculated matches (no images)
3. **foundation_products** - Product details with images
4. **Skintonehexwithswatches** - Skin tone reference with swatches
5. **profiles** - User skin tone data

## Key Findings

- Most product/shade tables have images (Primary Tables, productsandshadeswithimages, products_by_pigmentation)
- Matching/analysis tables typically lack images (foundation_shade_matches, foundation_matches)
- User-facing tables have images where needed (brands, profiles, products)
- Backend/processing tables lack images (reviews, orders, metadata)
