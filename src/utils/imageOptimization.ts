/**
 * Image Optimization Utilities
 * Handles Firebase Storage image URLs and lazy loading strategy
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Get optimized image URL
 * Firebase Storage doesn't have built-in image transformation.
 * Images are returned as-is. For advanced transformations, consider
 * using the Firebase Extensions "Resize Images" or a CDN like Cloudflare.
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  _options: ImageTransformOptions = {}
): string => {
  if (!imageUrl) return imageUrl;
  // Return the URL as-is (Firebase Storage serves images without transformation params)
  return imageUrl;
};

/**
 * Get thumbnail image URL (smaller, compressed)
 * Used for: Product listings, cart items, thumbnails
 */
export const getThumbnailUrl = (imageUrl: string): string => {
  return getOptimizedImageUrl(imageUrl, {
    width: 300,
    height: 300,
    quality: 80,
  });
};

/**
 * Get medium image URL
 * Used for: Product cards with descriptions
 */
export const getMediumImageUrl = (imageUrl: string): string => {
  return getOptimizedImageUrl(imageUrl, {
    width: 500,
    height: 500,
    quality: 85,
  });
};

/**
 * Get hero image URL (full quality)
 * Used for: ProductDetail main image (not transformed - keep original)
 */
export const getHeroImageUrl = (imageUrl: string): string => {
  return imageUrl; // Return original, no transformation
};

/**
 * Determine lazy loading strategy based on image importance
 * Returns "lazy" for non-critical images, "eager" for critical images
 */
export const getLazyLoadingStrategy = (
  position: 'hero' | 'thumbnail' | 'modal' | 'item'
): 'lazy' | 'eager' => {
  switch (position) {
    case 'hero':
      return 'eager'; // Critical - load immediately
    case 'thumbnail':
      return 'lazy'; // Below fold - load on demand
    case 'modal':
      return 'lazy'; // Hidden - load when opened
    case 'item':
      return 'lazy'; // List item - load on scroll
    default:
      return 'lazy';
  }
};
