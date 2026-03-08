// Firestore Database Helper Functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './client';
import { storage } from './client';
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import type { Product, Order, PromoCode, Blog, OrderItem } from './types';

// ============================================
// PRODUCTS
// ============================================
export async function getProduct(productId: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Product) : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function getAllProducts(limitNum: number = 100): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function getVisibleProducts(limitNum: number = 100): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    // Filter out hidden products on client side as Firestore composite index might not be set up
    return products.filter(p => !p.is_hidden);
  } catch (error) {
    console.error('Error fetching visible products:', error);
    throw error;
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...productData } as Product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<void> {
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// ============================================
// ORDERS
// ============================================
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Order) : null;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('user_id', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
}

export async function createOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  try {
    // Strip undefined values — Firestore rejects them
    const sanitized = Object.fromEntries(
      Object.entries(orderData).filter(([, v]) => v !== undefined)
    );
    const docRef = await addDoc(collection(db, 'orders'), {
      ...sanitized,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...sanitized } as Order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function deductStock(
  items: Array<{ productId?: string; product_id?: string; quantity?: number }>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const pid = item.productId || item.product_id;
      const qty = item.quantity || 1;
      if (pid) {
        batch.update(doc(db, 'products', pid), { stock: increment(-qty) });
      }
    }
    await batch.commit();
    console.log('[deductStock] Stock deducted for', items.length, 'items');
  } catch (error) {
    console.error('[deductStock] Error:', error);
    throw error;
  }
}

export async function updateOrder(
  orderId: string,
  updates: Partial<Order>
): Promise<void> {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// ============================================
// PROMO CODES
// ============================================
export async function getPromoCode(code: string): Promise<PromoCode | null> {
  try {
    const q = query(
      collection(db, 'promo_codes'),
      where('code', '==', code.toUpperCase())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as PromoCode;
  } catch (error) {
    console.error('Error fetching promo code:', error);
    throw error;
  }
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  try {
    const q = query(
      collection(db, 'promo_codes'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    throw error;
  }
}

export async function getVisiblePromoCodes(): Promise<PromoCode[]> {
  try {
    // Fetch all active codes and filter client-side to avoid needing a composite index
    const q = query(
      collection(db, 'promo_codes'),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
    return all.filter((p: any) => p.visible_to_users === true);
  } catch (error) {
    console.error('Error fetching visible promo codes:', error);
    return [];
  }
}

export async function validatePromoCode(code: string): Promise<{
  valid: boolean;
  promoCode?: PromoCode;
  error?: string;
}> {
  try {
    const promoCode = await getPromoCode(code);

    if (!promoCode) {
      return { valid: false, error: 'Invalid promo code' };
    }

    const now = new Date();

    // Check if active
    if (!promoCode.active) {
      return { valid: false, error: 'Promo code is inactive' };
    }

    // Check validity dates
    if (
      promoCode.valid_from &&
      promoCode.valid_from.toDate() > now
    ) {
      return { valid: false, error: 'Promo code not yet valid' };
    }

    if (
      promoCode.valid_until &&
      promoCode.valid_until.toDate() < now
    ) {
      return { valid: false, error: 'Promo code has expired' };
    }

    // Check usage limit
    if (
      promoCode.max_uses &&
      promoCode.current_uses >= promoCode.max_uses
    ) {
      return { valid: false, error: 'Promo code usage limit reached' };
    }

    return { valid: true, promoCode };
  } catch (error) {
    console.error('Error validating promo code:', error);
    throw error;
  }
}

export async function incrementPromoCodeUsage(codeId: string): Promise<void> {
  try {
    const docRef = doc(db, 'promo_codes', codeId);
    await updateDoc(docRef, {
      current_uses: increment(1),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error incrementing promo code usage:', error);
    throw error;
  }
}

export async function createPromoCode(promoData: any): Promise<PromoCode> {
  try {
    const docRef = await addDoc(collection(db, 'promo_codes'), {
      code: promoData.code.toUpperCase(),
      discount_percentage: promoData.discount_percentage || 0,
      max_uses: promoData.max_uses || null,
      current_uses: 0,
      free_shipping: promoData.free_shipping || false,
      min_order_amount: promoData.min_order_amount || 0,
      description: promoData.description || null,
      max_discount_amount: promoData.max_discount_amount || null,
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...promoData } as PromoCode;
  } catch (error) {
    console.error('Error creating promo code:', error);
    throw error;
  }
}

export async function updatePromoCode(promoCodeId: string, updates: any): Promise<void> {
  try {
    const docRef = doc(db, 'promo_codes', promoCodeId);
    await updateDoc(docRef, {
      ...updates,
      code: updates.code ? updates.code.toUpperCase() : undefined,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    throw error;
  }
}

export async function deletePromoCode(promoCodeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'promo_codes', promoCodeId));
  } catch (error) {
    console.error('Error deleting promo code:', error);
    throw error;
  }
}

export async function togglePromoCodeActive(promoCodeId: string, active: boolean): Promise<void> {
  try {
    const docRef = doc(db, 'promo_codes', promoCodeId);
    await updateDoc(docRef, {
      active,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling promo code:', error);
    throw error;
  }
}

// ============================================
// BLOGS
// ============================================
export async function getBlog(blogId: string): Promise<Blog | null> {
  try {
    const docRef = doc(db, 'blogs', blogId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Blog) : null;
  } catch (error) {
    console.error('Error fetching blog:', error);
    throw error;
  }
}

export async function getAllBlogs(limitCount: number = 10): Promise<Blog[]> {
  try {
    const q = query(
      collection(db, 'blogs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
}

export async function createBlog(blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>): Promise<Blog> {
  try {
    const docRef = await addDoc(collection(db, 'blogs'), {
      ...blogData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, ...blogData } as Blog;
  } catch (error) {
    console.error('Error creating blog:', error);
    throw error;
  }
}

export async function updateBlog(blogId: string, updates: Partial<Blog>): Promise<void> {
  try {
    const docRef = doc(db, 'blogs', blogId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    throw error;
  }
}

export async function deleteBlog(blogId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'blogs', blogId));
  } catch (error) {
    console.error('Error deleting blog:', error);
    throw error;
  }
}

// ============================================
// NEWSLETTER SUBSCRIBERS
// ============================================
export async function subscribeToNewsletter(email: string): Promise<void> {
  try {
    await addDoc(collection(db, 'newsletter_subscribers'), {
      email,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Subscribed to newsletter:', email);
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
}

export async function getAllNewsletterSubscribers(): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'newsletter_subscribers'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    throw error;
  }
}

export async function deleteNewsletterSubscriber(subscriberId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'newsletter_subscribers', subscriberId));
  } catch (error) {
    console.error('Error deleting newsletter subscriber:', error);
    throw error;
  }
}

// ============================================
// FIREBASE STORAGE - FILE MANAGEMENT
// ============================================
export async function uploadLabReportFile(productId: string, file: File): Promise<string> {
  try {
    const fileName = `lab-reports/${productId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading lab report file:', error);
    throw error;
  }
}

export async function deleteLabReportFile(filePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting lab report file:', error);
    throw error;
  }
}

// ============================================
// PRODUCT SUBCOLLECTIONS
// ============================================

// Lab Reports
export async function getProductLabReports(productId: string): Promise<any[]> {
  try {
    const snapshot = await getDocs(
      collection(db, 'products', productId, 'lab_reports')
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching lab reports:', error);
    throw error;
  }
}

// FAQs
export async function getProductFAQs(productId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'products', productId, 'product_faqs'),
      orderBy('display_order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    throw error;
  }
}

// Ratings
export async function getProductRatings(productId: string, approvedOnly: boolean = true) {
  try {
    const constraints = [
      collection(db, 'products', productId, 'product_ratings'),
    ];

    if (approvedOnly) {
      const q = query(
        collection(db, 'products', productId, 'product_ratings'),
        where('approved', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    const snapshot = await getDocs(
      collection(db, 'products', productId, 'product_ratings')
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching ratings:', error);
    throw error;
  }
}

export async function getAverageRating(productId: string): Promise<number> {
  try {
    const ratings = await getProductRatings(productId);
    if (ratings.length === 0) return 0;

    const sum = ratings.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
    return sum / ratings.length;
  } catch (error) {
    console.error('Error calculating average rating:', error);
    throw error;
  }
}

// Lab Report CRUD Operations
export async function createLabReport(productId: string, reportData: any) {
  try {
    const docRef = await addDoc(
      collection(db, 'products', productId, 'lab_reports'),
      {
        ...reportData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );
    return { id: docRef.id, ...reportData };
  } catch (error) {
    console.error('Error creating lab report:', error);
    throw error;
  }
}

export async function updateLabReport(productId: string, reportId: string, updates: any) {
  try {
    await updateDoc(
      doc(db, 'products', productId, 'lab_reports', reportId),
      {
        ...updates,
        updatedAt: Timestamp.now(),
      }
    );
  } catch (error) {
    console.error('Error updating lab report:', error);
    throw error;
  }
}

export async function deleteLabReport(productId: string, reportId: string) {
  try {
    await deleteDoc(
      doc(db, 'products', productId, 'lab_reports', reportId)
    );
  } catch (error) {
    console.error('Error deleting lab report:', error);
    throw error;
  }
}

// FAQ CRUD Operations
export async function createFAQ(productId: string, faqData: any) {
  try {
    const docRef = await addDoc(
      collection(db, 'products', productId, 'product_faqs'),
      {
        ...faqData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );
    return { id: docRef.id, ...faqData };
  } catch (error) {
    console.error('Error creating FAQ:', error);
    throw error;
  }
}

export async function updateFAQ(productId: string, faqId: string, updates: any) {
  try {
    await updateDoc(
      doc(db, 'products', productId, 'product_faqs', faqId),
      {
        ...updates,
        updatedAt: Timestamp.now(),
      }
    );
  } catch (error) {
    console.error('Error updating FAQ:', error);
    throw error;
  }
}

export async function deleteFAQ(productId: string, faqId: string) {
  try {
    await deleteDoc(
      doc(db, 'products', productId, 'product_faqs', faqId)
    );
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    throw error;
  }
}

// Rating Management Functions
export async function getAllProductRatings(productId: string, includeUnapproved: boolean = false) {
  try {
    let q;
    if (includeUnapproved) {
      q = query(
        collection(db, 'products', productId, 'product_ratings'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'products', productId, 'product_ratings'),
        where('approved', '==', true),
        orderBy('createdAt', 'desc')
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all ratings:', error);
    throw error;
  }
}

export async function updateRating(productId: string, ratingId: string, updates: any) {
  try {
    await updateDoc(
      doc(db, 'products', productId, 'product_ratings', ratingId),
      {
        ...updates,
        updatedAt: Timestamp.now(),
      }
    );
  } catch (error) {
    console.error('Error updating rating:', error);
    throw error;
  }
}

export async function createRating(productId: string, ratingData: any) {
  try {
    // Validate rating data on server side
    if (!ratingData.rating || ratingData.rating < 1 || ratingData.rating > 5) {
      throw new Error('Invalid rating value. Must be between 1 and 5.');
    }
    
    if (!ratingData.userId) {
      throw new Error('User ID is required.');
    }
    
    const comment = ratingData.comment || null;
    if (comment && comment.length > 500) {
      throw new Error('Comment exceeds maximum length of 500 characters.');
    }
    
    // Sanitize comment - remove any HTML/script tags
    const sanitizedComment = comment ? comment.replace(/<[^>]*>/g, '').trim() : null;
    
    // Check for common injection patterns (XSS, code injection)
    if (sanitizedComment && /(<script|javascript:|onerror=|onclick=|onload=|eval\()/i.test(sanitizedComment)) {
      throw new Error('Invalid characters detected in comment.');
    }
    
    // Never allow client to set approved=true - only admins can approve
    const docRef = await addDoc(
      collection(db, 'products', productId, 'product_ratings'),
      {
        rating: ratingData.rating,
        userId: ratingData.userId,
        comment: sanitizedComment,
        approved: false, // Always false on creation - only admins can change this
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error('Error creating rating:', error);
    throw error;
  }
}

export async function deleteRating(productId: string, ratingId: string) {
  try {
    await deleteDoc(
      doc(db, 'products', productId, 'product_ratings', ratingId)
    );
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
}

// Get all ratings across all products (for admin dashboard)
export async function getAllRatingsAcrossProducts(filter: 'all' | 'pending' | 'approved' = 'all') {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const allRatings: any[] = [];

    for (const productDoc of productsSnapshot.docs) {
      const productId = productDoc.id;
      const productData = productDoc.data();
      
      let ratingsQuery;
      if (filter === 'pending') {
        ratingsQuery = query(
          collection(db, 'products', productId, 'product_ratings'),
          where('approved', '!=', true),
          orderBy('createdAt', 'desc')
        );
      } else if (filter === 'approved') {
        ratingsQuery = query(
          collection(db, 'products', productId, 'product_ratings'),
          where('approved', '==', true),
          orderBy('createdAt', 'desc')
        );
      } else {
        ratingsQuery = query(
          collection(db, 'products', productId, 'product_ratings'),
          orderBy('createdAt', 'desc')
        );
      }

      const ratingsSnapshot = await getDocs(ratingsQuery);
      ratingsSnapshot.docs.forEach(ratingDoc => {
        allRatings.push({
          id: ratingDoc.id,
          productId: productId,
          productName: productData.name,
          ...ratingDoc.data()
        });
      });
    }

    // Sort all ratings by creation date
    return allRatings.sort((a, b) => 
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    );
  } catch (error) {
    console.error('Error fetching all ratings:', error);
    throw error;
  }
}

// ============================================
// USER ROLES & PERMISSIONS
// ============================================
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const docRef = doc(db, 'user_roles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.roles || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

export async function setUserRoles(userId: string, roles: string[]): Promise<void> {
  try {
    const docRef = doc(db, 'user_roles', userId);
    await setDoc(docRef, { roles, updatedAt: Timestamp.now() });
  } catch (error) {
    console.error('Error setting user roles:', error);
    throw error;
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const roles = await getUserRoles(userId);
    return roles.includes('admin');
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// ============================================
// ADMIN CRUD - ORDERS
// ============================================
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<void> {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Order status updated:', orderId, status);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

export async function listenToOrderChanges(
  callback: (orders: Order[]) => void
): Promise<() => void> {
  try {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    });
    
    console.log('✅ Real-time order listener started');
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up order listener:', error);
    throw error;
  }
}

// Listen to new orders created after listener starts
export function listenToNewOrders(
  onNewOrder: (order: Order) => void
): () => void {
  try {
    const now = new Date();
    
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(now)),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const order = { id: change.doc.id, ...change.doc.data() } as Order;
          onNewOrder(order);
        }
      });
    });
    
    console.log('✅ New order listener started');
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up new order listener:', error);
    throw error;
  }
}

// ============================================
// PINCODES - SHIPPING & DELIVERY
// ============================================

interface PincodeData {
  id?: string;
  pincode: number;
  state: string;
  district?: string;
  delivery: string; // 'Y' or 'N'
  cod: string; // 'Y' or 'N'
  delivery_available?: boolean;
  cod_available?: boolean;
}

/**
 * Get pincode data from Firebase
 */
export async function getPincode(pincode: number): Promise<PincodeData | null> {
  try {
    const q = query(
      collection(db, 'pincodes'),
      where('pincode', '==', pincode)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
    } as PincodeData;
  } catch (error) {
    console.error('Error fetching pincode:', error);
    return null;
  }
}

/**
 * Check if a pincode is deliverable
 */
export async function checkDeliveryAvailability(pincode: number): Promise<boolean> {
  try {
    const pincodeData = await getPincode(pincode);
    if (!pincodeData) {
      return false;
    }
    return pincodeData.delivery === 'Y' || pincodeData.delivery_available === true;
  } catch (error) {
    console.error('Error checking delivery availability:', error);
    return false;
  }
}

/**
 * Check if COD is available for a pincode
 */
export async function checkCODAvailability(pincode: number): Promise<boolean> {
  try {
    const pincodeData = await getPincode(pincode);
    if (!pincodeData) {
      return false;
    }
    return pincodeData.cod === 'Y' || pincodeData.cod_available === true;
  } catch (error) {
    console.error('Error checking COD availability:', error);
    return false;
  }
}

/**
 * Batch add/update pincodes to Firebase
 * Used for importing CSV data
 */
export async function batchImportPincodes(pincodes: PincodeData[]): Promise<{ success: number; failed: number }> {
  try {
    const BATCH_SIZE = 500; // Firestore batch operation limit
    let success = 0;
    let failed = 0;

    for (let i = 0; i < pincodes.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchPincodes = pincodes.slice(i, Math.min(i + BATCH_SIZE, pincodes.length));

      for (const pincode of batchPincodes) {
        const docRef = doc(db, 'pincodes', `${pincode.pincode}`);
        batch.set(docRef, {
          ...pincode,
          delivery_available: pincode.delivery === 'Y',
          cod_available: pincode.cod === 'Y',
        }, { merge: true });
        success++;
      }

      try {
        await batch.commit();
      } catch (error) {
        console.error(`Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        failed += batchPincodes.length;
      }
    }

    return { success, failed };
  } catch (error) {
    console.error('Error batch importing pincodes:', error);
    throw error;
  }
}

/**
 * Get total count of pincodes in database
 */
export async function getPincodeCount(): Promise<number> {
  try {
    const q = query(collection(db, 'pincodes'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting pincode count:', error);
    return 0;
  }
}

/**
 * Get pincodes by state
 */
export async function getPincodesByState(state: string): Promise<PincodeData[]> {
  try {
    const q = query(
      collection(db, 'pincodes'),
      where('state', '==', state.toUpperCase())
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as PincodeData));
  } catch (error) {
    console.error('Error fetching pincodes by state:', error);
    return [];
  }
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
export { Timestamp, increment, writeBatch };
