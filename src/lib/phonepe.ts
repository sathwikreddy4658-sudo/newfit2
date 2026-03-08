/**
 * PhonePe Payment Gateway Integration - Production
 * Secure payment processing with comprehensive validation and error handling
 */

import { db } from '@/integrations/firebase/client';
import {
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import CryptoJS from 'crypto-js';

// PhonePe API Configuration for Production
const PHONEPE_MERCHANT_ID = import.meta.env.VITE_PHONEPE_MERCHANT_ID || '';
const PHONEPE_API_URL = import.meta.env.VITE_PHONEPE_API_URL || 'https://api.phonepe.com/apis/pg';
const PHONEPE_CALLBACK_URL = import.meta.env.VITE_PHONEPE_CALLBACK_URL || '';
// PhonePe edge/cloud functions base URL
const PHONEPE_FUNCTIONS_BASE_URL = import.meta.env.VITE_PHONEPE_FUNCTIONS_URL ||
  'https://osromibanfzzthdmhyzp.supabase.co/functions/v1';

// Validate configuration
if (!PHONEPE_MERCHANT_ID || !PHONEPE_API_URL) {
  console.warn('⚠️ PhonePe merchant configuration incomplete');
}

// NOTE: PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET are NEVER exposed to client
// They are only available in the backend edge/cloud function environment variables

export interface PhonePePaymentOptions {
  amount: number; // Amount in paisa (1 INR = 100 paisa)
  merchantTransactionId: string;
  merchantUserId: string;
  redirectUrl: string;
  callbackUrl: string;
  mobileNumber?: string;
  deviceContext?: {
    deviceOS: string;
  };
}

export interface PhonePeOrderResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    // PhonePe v2.0 Standard Checkout response
    orderId?: string;
    state?: 'PENDING' | 'COMPLETED' | 'FAILED';
    redirectUrl?: string;
    expireAt?: number;
    // Legacy v1 fields (for backward compatibility)
    merchantId?: string;
    merchantTransactionId?: string;
    instrumentResponse?: {
      redirectInfo?: {
        url: string;
        method: string;
      };
      type?: string;
    };
  };
}

export interface PhonePeStatusResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: 'COMPLETED' | 'FAILED' | 'PENDING';
    responseCode: string;
    paymentInstrument?: {
      type: string;
      [key: string]: string | number | boolean;
    };
  };
}

export interface PaymentTransaction {
  id?: string;
  order_id: string;
  merchant_transaction_id: string;
  amount: number;
  status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  phonepe_transaction_id?: string;
  payment_method?: string;
  response_code?: string;
  response_message?: string;
  phonepe_response?: Record<string, unknown>;
}

// Note: Payload creation and auth headers now handled by Edge Function

// Initiate PhonePe payment via Edge Function to avoid CORS issues
export async function initiatePhonePePayment(
  options: PhonePePaymentOptions,
  retries: number = 2
): Promise<PhonePeOrderResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[PhonePe] Initiating payment via Edge Function (attempt ${attempt + 1}/${retries + 1})`, {
        merchantTransactionId: options.merchantTransactionId,
        amount: options.amount
      });

      const requestBody = {
        merchantTransactionId: options.merchantTransactionId,
        amount: options.amount,
        callbackUrl: options.callbackUrl,
        merchantUserId: options.merchantUserId,
        redirectUrl: options.redirectUrl
      };

      console.log('[PhonePe] Request body being sent:', requestBody);

      // Call PhonePe initiate via backend edge/cloud function
      const response = await fetch(`${PHONEPE_FUNCTIONS_BASE_URL}/phonepe-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('[PhonePe] Response:', { data, ok: response.ok });

      if (!response.ok) {
        throw new Error(data?.message || `HTTP ${response.status}`);
      }

      if (data?.success) {
        return {
          success: true,
          code: data.code || 'SUCCESS',
          message: data.message || 'Payment initiated successfully',
          data: data.data
        };
      } else {
        // Don't retry for certain error codes
        const noRetryErrors = ['BAD_REQUEST', 'INVALID_MERCHANT', 'DUPLICATE_TRANSACTION', 'INVALID_REQUEST'];
        if (data?.code && noRetryErrors.includes(data.code)) {
          return {
            success: false,
            code: data.code,
            message: data.message || 'Payment initiation failed'
          };
        }

        lastError = new Error(data?.message || 'Payment initiation failed');
      }
    } catch (error: unknown) {
      console.error(`[PhonePe] Payment initiation attempt ${attempt + 1} failed:`, error);
      
      if (error instanceof Error) {
        console.error('[PhonePe] Error details:', {
          message: error.message,
          stack: error.stack,
          toString: error.toString()
        });
      }
      
      lastError = error instanceof Error ? error : new Error(String(error));

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    code: 'ERROR',
    message: lastError?.message || 'Payment initiation failed after multiple attempts'
  };
}

// Check payment status via Edge Function to avoid CORS issues
export async function checkPaymentStatus(
  merchantTransactionId: string,
  retries: number = 3
): Promise<PhonePeStatusResponse | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[PhonePe] Checking payment status via Edge Function (attempt ${attempt + 1}/${retries + 1})`, {
        merchantTransactionId
      });

      // Call PhonePe check-status via backend edge/cloud function
      const response = await fetch(`${PHONEPE_FUNCTIONS_BASE_URL}/phonepe-check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantTransactionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('[PhonePe] Payment status response:', {
        success: data?.success,
        code: data?.code,
        state: data?.data?.state
      });

      if (data?.data) {
        return data.data as PhonePeStatusResponse;
      }

      lastError = new Error(data?.message || 'Payment status check failed');
    } catch (error: unknown) {
      console.error(`[PhonePe] Status check attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Wait before retry
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  console.error('[PhonePe] Payment status check failed after all retries:', lastError);
  return null;
}

// Create payment transaction record in Firestore
export async function createPaymentTransaction(
  orderId: string,
  merchantTransactionId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'payment_transactions'), {
      order_id: orderId,
      merchant_transaction_id: merchantTransactionId,
      amount,
      status: 'INITIATED',
      metadata: metadata || null,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    console.log('[PhonePe] Payment transaction created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[PhonePe] Error creating payment transaction:', error);
    return null;
  }
}

// Update payment transaction status in Firestore
export async function updatePaymentTransaction(
  merchantTransactionId: string,
  status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED',
  phonePeResponse?: PhonePeStatusResponse
): Promise<boolean> {
  try {
    const paymentMethod = phonePeResponse?.data?.paymentInstrument?.type;
    const phonepeTransactionId = phonePeResponse?.data?.transactionId;
    const responseCode = phonePeResponse?.data?.responseCode;
    const responseMessage = phonePeResponse?.message;

    // Find the document by merchant_transaction_id
    const q = query(
      collection(db, 'payment_transactions'),
      where('merchant_transaction_id', '==', merchantTransactionId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error('[PhonePe] Payment transaction not found:', merchantTransactionId);
      return false;
    }

    await updateDoc(snapshot.docs[0].ref, {
      status,
      phonepe_transaction_id: phonepeTransactionId || null,
      payment_method: paymentMethod || null,
      response_code: responseCode || null,
      response_message: responseMessage || null,
      phonepe_response: phonePeResponse || null,
      updated_at: Timestamp.now(),
    });

    console.log('[PhonePe] Payment transaction updated:', { merchantTransactionId, status });
    return true;
  } catch (error) {
    console.error('[PhonePe] Error updating payment transaction:', error);
    return false;
  }
}

// Store payment details (updates order document in Firestore)
export async function storePaymentDetails(orderId: string, paymentData: PaymentTransaction): Promise<void> {
  try {
    const { doc: firestoreDoc, updateDoc: firestoreUpdate } = await import('firebase/firestore');
    const { db: firestoreDb } = await import('@/integrations/firebase/client');
    await firestoreUpdate(firestoreDoc(firestoreDb, 'orders', orderId), {
      payment_id: paymentData.merchant_transaction_id,
      status: paymentData.status === 'SUCCESS' ? 'paid' : 'pending',
      updatedAt: Timestamp.now(),
    });
    console.log('[PhonePe] Payment details stored in orders collection');
  } catch (error) {
    console.error('[PhonePe] Failed to store payment details:', error);
  }
}

// Get payment transaction by merchant transaction ID from Firestore
export async function getPaymentTransaction(merchantTransactionId: string): Promise<PaymentTransaction | null> {
  try {
    const q = query(
      collection(db, 'payment_transactions'),
      where('merchant_transaction_id', '==', merchantTransactionId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as PaymentTransaction;
  } catch (error) {
    console.error('[PhonePe] Failed to get payment transaction:', error);
    return null;
  }
}

// Get payment transactions for an order from Firestore
export async function getOrderPaymentTransactions(orderId: string): Promise<PaymentTransaction[]> {
  try {
    const q = query(
      collection(db, 'payment_transactions'),
      where('order_id', '==', orderId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as PaymentTransaction[];
  } catch (error) {
    console.error('[PhonePe] Failed to get order payment transactions:', error);
    return [];
  }
}

// Verify PhonePe webhook signature
export function verifyWebhookSignature(
  requestBody: string,
  receivedSignature: string
): boolean {
  try {
    // Using the new production API method: hash the request body with client secret
    const expectedSignature = CryptoJS.SHA256(requestBody + PHONEPE_CLIENT_SECRET).toString();
    return expectedSignature === receivedSignature;
  } catch (error) {
    console.error('[PhonePe] Error verifying webhook signature:', error);
    return false;
  }
}
