import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for image URLs
const imageCache = new Map<string, string>();

// Track in-flight requests to avoid duplicate fetches
const inflightRequests = new Map<string, Promise<string | null>>();

async function extractImageUrlFromPage(
  url: string,
  productId: string
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[walmart-image] HTTP ${response.status} for ${productId}`);
      return null;
    }

    const html = await response.text();

    // Strategy 1: Extract from __NEXT_DATA__ JSON
    const nextDataMatch = html.match(
      /<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/
    );
    if (nextDataMatch) {
      try {
        const jsonData = JSON.parse(nextDataMatch[1]);
        const product = jsonData?.props?.initialProps?.data?.product;
        if (product) {
          // Try various image fields
          const imageEntities = product?.imageInfo?.imageEntities;
          if (Array.isArray(imageEntities) && imageEntities.length > 0) {
            const img = imageEntities.find(
              (e: Record<string, string>) => e.sizeType === 'LARGE' || e.format === 'JPEG'
            ) || imageEntities[0];
            if (img?.url) {
              return img.url;
            }
          }
          // Try product image field
          if (product?.productImage?.url) {
            return product.productImage.url;
          }
          if (product?.image?.url) {
            return product.image.url;
          }
          if (product?.media?.image?.url) {
            return product.media.image.url;
          }
        }

        // Also try the primaryProduct in initial data
        const primaryProduct = jsonData?.props?.pageProps?.initialData?.data?.product;
        if (primaryProduct) {
          const pe = primaryProduct?.imageInfo?.imageEntities;
          if (Array.isArray(pe) && pe.length > 0) {
            const img = pe[0];
            if (img?.url) return img.url;
          }
        }
      } catch {
        // JSON parse failed, try other strategies
      }
    }

    // Strategy 2: Extract from og:image meta tag
    const ogImageMatch = html.match(
      /<meta\s+property="og:image"\s+content="([^"]+)"/i
    );
    if (ogImageMatch) {
      return ogImageMatch[1];
    }

    // Strategy 3: Extract from product media JSON in page
    const mediaMatch = html.match(
      /"imageEntities"\s*:\s*\[(\{[\s\S]*?\})\]/
    );
    if (mediaMatch) {
      try {
        const entities = JSON.parse(`[${mediaMatch[1]}]`);
        if (entities.length > 0 && entities[0].url) {
          return entities[0].url;
        }
      } catch {
        // parse failed
      }
    }

    // Strategy 4: Fallback - construct URL from product ID
    // Walmart CDN pattern: https://i5.walmartimages.com/asr/{imageId}.jpeg
    // We can try fetching the product API directly
    const apiUrl = `https://affiliate.walmart.com/v3/products?ids=${productId}&pageSize=1`;
    try {
      const apiController = new AbortController();
      const apiTimeout = setTimeout(() => apiController.abort(), 8000);
      const apiResponse = await fetch(apiUrl, {
        signal: apiController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
        },
      });
      clearTimeout(apiTimeout);
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        const item = apiData?.items?.[0];
        if (item?.image_url) {
          return item.image_url;
        }
      }
    } catch {
      // API call failed, that's ok
    }

    console.error(
      `[walmart-image] Could not extract image URL for ${productId}`
    );
    return null;
  } catch (err) {
    console.error(`[walmart-image] Error fetching ${productId}:`, err);
    return null;
  }
}

function extractProductId(walmartUrl: string): string {
  // Extract the product ID from the URL (last number in the path)
  // e.g., https://www.walmart.com/ip/great-value-long-grain-white-rice-5-lb/10314157
  const match = walmartUrl.match(/\/(\d+)(?:\/.*)?$/);
  return match ? match[1] : '';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walmartUrl = searchParams.get('url');

  if (!walmartUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Extract product ID for cache key and API calls
  const productId = extractProductId(walmartUrl);
  if (!productId) {
    return NextResponse.json(
      { error: 'Invalid Walmart URL' },
      { status: 400 }
    );
  }

  // Check cache
  const cached = imageCache.get(productId);
  if (cached) {
    return NextResponse.redirect(cached, 302);
  }

  // Check if there's already an in-flight request
  const inflight = inflightRequests.get(productId);
  if (inflight) {
    const result = await inflight;
    if (result) {
      return NextResponse.redirect(result, 302);
    }
    return NextResponse.redirect(new URL('/products/box.png', request.url), 302);
  }

  // Start the fetch
  const fetchPromise = extractImageUrlFromPage(walmartUrl, productId).then(
    (imageUrl) => {
      if (imageUrl) {
        imageCache.set(productId, imageUrl);
      }
      inflightRequests.delete(productId);
      return imageUrl;
    }
  );

  inflightRequests.set(productId, fetchPromise);

  const imageUrl = await fetchPromise;
  if (imageUrl) {
    return NextResponse.redirect(imageUrl, 302);
  }
  return NextResponse.redirect(new URL('/products/box.png', request.url), 302);
}
