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
  
  // Original prices for display (strikethrough) - shows discount
  original_price?: number;
  original_price_15g?: number;
  original_price_20g?: number;
  
  ingredients?: string[];
  
  nutrition?: {
    // Serving sizes (customizable)
    serving_size_1_g?: number;  // First serving size (e.g., 49g, 55g, 60g)
    serving_size_2_g?: number;  // Second serving size (e.g., 100g)
    
    // Per serving 1 (customizable serving size)
    energy_serving_1?: number;
    protein_serving_1?: number;
    carbs_serving_1?: number;
    sugars_serving_1?: number;
    added_sugars_serving_1?: number;
    fat_serving_1?: number;
    sat_fat_serving_1?: number;
    trans_fat_serving_1?: number;
    sodium_serving_1?: number;  // mg
    cholesterol_serving_1?: number;  // mg
    
    // Per serving 2 (customizable serving size)
    energy_serving_2?: number;
    protein_serving_2?: number;
    carbs_serving_2?: number;
    sugars_serving_2?: number;
    added_sugars_serving_2?: number;
    fat_serving_2?: number;
    sat_fat_serving_2?: number;
    trans_fat_serving_2?: number;
    sodium_serving_2?: number;  // mg
    cholesterol_serving_2?: number;  // mg
    
    // Legacy field names for backward compatibility
    energy_60g?: number;
    protein_60g?: number;
    carbs_60g?: number;
    sugars_60g?: number;
    added_sugars_60g?: number;
    fat_60g?: number;
    sat_fat_60g?: number;
    trans_fat_60g?: number;
    
    energy_100g?: number;
    protein_100g?: number;
    carbs_100g?: number;
    sugars_100g?: number;
    added_sugars_100g?: number;
    fat_100g?: number;
    sat_fat_100g?: number;
    trans_fat_100g?: number;
    
    // Legacy fields
    calories?: string;
    protein?: string;
    sugar?: string;
    allergens?: string;
    weight?: string;
  };
  
  // Flattened nutrition fields (saved directly on product for easier updates)
  serving_size_1_g?: number;
  serving_size_2_g?: number;
  energy_serving_1?: number;
  protein_serving_1?: number;
  carbs_serving_1?: number;
  sugars_serving_1?: number;
  added_sugars_serving_1?: number;
  fat_serving_1?: number;
  sat_fat_serving_1?: number;
  trans_fat_serving_1?: number;
  sodium_serving_1?: number;
  cholesterol_serving_1?: number;
  energy_serving_2?: number;
  protein_serving_2?: number;
  carbs_serving_2?: number;
  sugars_serving_2?: number;
  added_sugars_serving_2?: number;
  fat_serving_2?: number;
  sat_fat_serving_2?: number;
  trans_fat_serving_2?: number;
  sodium_serving_2?: number;
  cholesterol_serving_2?: number;
  
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
  combo_12_discount?: number;
  
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
  address?: string;
  
  items: OrderItem[];
  
  total_amount: number;
  items_subtotal?: number;  // Raw items total before any discounts
  discount_amount?: number;  // Promo code discount only
  combo_discount_amount?: number;  // Combo pack discount
  shipping_charge?: number;
  cod_charge?: number;
  
  status: string;
  paid: boolean;
  
  payment_method?: string;
  promo_code?: string;
  
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
