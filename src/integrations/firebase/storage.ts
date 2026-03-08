/**
 * Firebase Cloud Storage Helper Functions
 * Handles image uploads for products, blogs, and other content
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './client';

// ============================================
// PRODUCT IMAGE UPLOADS
// ============================================
export async function uploadProductImage(
  productId: string,
  file: File,
  imageType: 'main' | 'thumbnail' | 'gallery'
): Promise<string> {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `products/${productId}/${imageType}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    console.log('✅ Product image uploaded:', imageType, url);
    return url;
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }
}

// ============================================
// BLOG IMAGE UPLOADS
// ============================================
export async function uploadBlogImage(
  blogId: string,
  file: File
): Promise<string> {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `blogs/${blogId}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    console.log('✅ Blog image uploaded:', url);
    return url;
  } catch (error) {
    console.error('Error uploading blog image:', error);
    throw error;
  }
}

// ============================================
// GENERIC IMAGE DELETE
// ============================================
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract the storage path from the URL
    // Firebase URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
    const decodedUrl = decodeURIComponent(imageUrl);
    const pathMatch = decodedUrl.match(/\/o\/([^?]+)/);
    
    if (!pathMatch) {
      console.warn('Could not extract path from URL:', imageUrl);
      return;
    }
    
    const storagePath = pathMatch[1];
    const storageRef = ref(storage, storagePath);
    
    await deleteObject(storageRef);
    console.log('✅ Image deleted:', storagePath);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

// ============================================
// LIST IMAGES IN FOLDER
// ============================================
export async function listImagesInFolder(folderPath: string): Promise<string[]> {
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    
    const urls = await Promise.all(
      result.items.map(item => getDownloadURL(item))
    );
    
    console.log(`✅ Listed ${urls.length} images in ${folderPath}`);
    return urls;
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
}
