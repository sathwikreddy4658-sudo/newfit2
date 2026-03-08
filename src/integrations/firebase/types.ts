// Firebase Firestore Type Definitions
import { Timestamp } from 'firebase/firestore';

// ============================================
// USER TYPES
// ============================================
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  address?: string;
  favorites?: string[]; // Array of product IDs
  role?: 'user' | 'admin';
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PRODUCT TYPES
// ============================================
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  price_15g?: number;
  price_20g?: number;
  
  nutrition?: {
    calories?: string;
    protein?: string;
    sugar?: string;
    allergens?: string;
    weight?: string;
  };
  
  images?: string[];
  products_page_image?: string;
  cart_image?: string;
  
  stock?: number;
  min_order_quantity?: number;
  stock_status_15g?: boolean;
  stock_status_20g?: boolean;
  
  is_hidden?: boolean;
  combo_3_discount?: number;
  combo_6_discount?: number;
  
  shelf_life?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// ORDER TYPES
// ============================================
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string; // Firebase UID
  
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  
  items: OrderItem[];
  
  total_amount: number;
  status: string;
  paid: boolean;
  
  payment_method?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PROMO CODE TYPES
// ============================================
export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discount_percentage: number;
  max_discount_amount?: number;
  
  active: boolean;
  max_uses?: number;
  current_uses: number;
  
  valid_from?: Timestamp;
  valid_until?: Timestamp;
  
  free_shipping?: boolean;
  min_order_amount?: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// BLOG TYPES
// ============================================
export interface Blog {
  id: string;
  title: string;
  subheadline?: string;
  content: string;
  image_url?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PAYMENT TYPES
// ============================================
export interface PaymentTransaction {
  id: string;
  order_id: string;
  merchant_transaction_id: string;
  amount: number;
  status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  phonepe_transaction_id?: string;
  payment_method?: string;
  response_code?: string;
  response_message?: string;
  phonepe_response?: any;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// LAB REPORT TYPES
// ============================================
export interface LabReport {
  id: string;
  product_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  test_type?: string;
  test_date?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PRODUCT FAQ TYPES
// ============================================
export interface ProductFAQ {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  display_order: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PRODUCT RATING TYPES
// ============================================
export interface ProductRating {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  approved?: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// NEWSLETTER SUBSCRIBER TYPES
// ============================================
export interface Subscriber {
  id: string;
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
