/**
 * Image Optimization Utilities
 * Handles Supabase image transformation and lazy loading strategy
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Get optimized image URL with Supabase transformation
 * For thumbnail/listing images - compressed and smaller
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  options: ImageTransformOptions = {}
): string => {
  if (!imageUrl) return imageUrl;

  // Only transform Supabase Storage URLs
  if (!imageUrl.includes('supabase.co')) {
    return imageUrl;
  }

  const { width = 500, height = 500, quality = 85 } = options;

  // Supabase image transformation format
  // https://supabase.com/docs/guides/storage/image-transformations
  const transformedUrl = `${imageUrl}?width=${width}&height=${height}&quality=${quality}`;
  return transformedUrl;
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
