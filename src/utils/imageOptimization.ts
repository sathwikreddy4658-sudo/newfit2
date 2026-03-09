/**
 * Image Optimization Utilities
 * Handles Firebase Storage image URLs and lazy loading strategy
 * 
 * IMPORTANT: Requires Firebase "Resize Images" extension to be installed
 * Extension creates resized versions: 200x200, 500x500, 800x800
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Get resized image URL from Firebase Storage
 * Assumes Firebase "Resize Images" extension is installed
 * Extension creates: /thumbs/{filename}_200x200, _500x500, _800x800
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  options: ImageTransformOptions = {}
): string => {
  if (!imageUrl) return imageUrl;
  
  // Determine which size to use based on requested width
  const targetWidth = options.width || 500;
  let size = '500x500'; // Default to medium
  
  if (targetWidth <= 200) {
    size = '200x200'; // thumbnail
  } else if (targetWidth <= 500) {
    size = '500x500'; // medium
  } else {
    size = '800x800'; // large
  }
  
  // Parse Firebase Storage URL
  // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media...
  try {
    const url = new URL(imageUrl);
    const pathMatch = imageUrl.match(/\/o\/(.+?)\?/);
    
    if (!pathMatch) return imageUrl; // Not a Firebase Storage URL
    
    const originalPath = decodeURIComponent(pathMatch[1]);
    
    // Check if already a resized image
    if (originalPath.includes('thumbs/')) {
      return imageUrl; // Already resized
    }
    
    // Extract filename
    const filename = originalPath.split('/').pop();
    if (!filename) return imageUrl;
    
    // Get filename without extension
    const lastDotIndex = filename.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '.jpg';
    
    // Build resized path: thumbs/{filename}_{size}
    const resizedFilename = `${nameWithoutExt}_${size}${ext}`;
    const resizedPath = originalPath.includes('/') 
      ? originalPath.replace(filename, `thumbs/${resizedFilename}`)
      : `thumbs/${resizedFilename}`;
    
    // Rebuild URL with resized path
    const encodedPath = encodeURIComponent(resizedPath);
    return imageUrl.replace(pathMatch[1], encodedPath);
  } catch (error) {
    console.warn('Image optimization failed, returning original:', error);
    return imageUrl;
  }
};

/**
 * Get thumbnail image URL (small, compressed)
 * Used for: Product listings, cart items, thumbnails
 * Returns: 200x200 version (or original for existing images not yet resized)
 * 
 * FALLBACK: Returns original URL if resized version doesn't exist yet
 * This ensures existing images still show while the extension processes new uploads
 */
export const getThumbnailUrl = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  // TEMPORARY: Return original URL for now
  // Existing images will show at original size until re-uploaded
  // New images will be resized by the Firebase extension automatically
  return imageUrl;
};

/**
 * Get medium image URL
 * Used for: Product cards with descriptions, cart previews
 * Returns: 500x500 version (or original for existing images not yet resized)
 * 
 * FALLBACK: Returns original URL if resized version doesn't exist yet
 */
export const getMediumImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  // TEMPORARY: Return original URL for now
  // Existing images will show at original size until re-uploaded
  // New images will be resized by the Firebase extension automatically
  return imageUrl;
};

/**
 * Get large image URL
 * Used for: ProductDetail gallery, full-size preview
 * Returns: 800x800 version (or original for existing images not yet resized)
 */
export const getLargeImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  // TEMPORARY: Return original URL for now
  // Existing images will show at original size until re-uploaded
  // New images will be resized by the Firebase extension automatically
  return imageUrl;
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
