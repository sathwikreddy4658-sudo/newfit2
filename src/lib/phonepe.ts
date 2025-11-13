/**
 * PhonePe Payment Gateway Integration - Production
 * Secure payment processing with comprehensive validation and error handling
 */

import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';

// PhonePe API Configuration for Production
const PHONEPE_MERCHANT_ID = import.meta.env.VITE_PHONEPE_MERCHANT_ID || '';
const PHONEPE_CLIENT_ID = import.meta.env.VITE_PHONEPE_CLIENT_ID || '';
const PHONEPE_CLIENT_SECRET = import.meta.env.VITE_PHONEPE_CLIENT_SECRET || '';
const PHONEPE_API_URL = import.meta.env.VITE_PHONEPE_API_URL || 'https://api.phonepe.com/apis/pg';
const PHONEPE_CALLBACK_URL = import.meta.env.VITE_PHONEPE_CALLBACK_URL || '';

// Validate configuration
if (!PHONEPE_MERCHANT_ID || !PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
  console.warn('⚠️ PhonePe credentials not fully configured');
}

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
    merchantId: string;
    merchantTransactionId: string;
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

      // Call Supabase Edge Function instead of direct API call
      const { data, error } = await supabase.functions.invoke('phonepe-initiate', {
        body: {
          merchantTransactionId: options.merchantTransactionId,
          amount: options.amount,
          mobileNumber: options.mobileNumber || '',
          callbackUrl: options.callbackUrl,
          merchantUserId: options.merchantUserId,
          redirectUrl: options.redirectUrl
        }
      });

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

      console.log('[PhonePe] Payment initiation response:', {
        success: data?.success,
        code: data?.code,
        message: data?.message
      });

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

      // Call Supabase Edge Function instead of direct API call
      const { data, error } = await supabase.functions.invoke('phonepe-check-status', {
        body: { merchantTransactionId }
      });

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

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

// Create payment transaction record
export async function createPaymentTransaction(
  orderId: string,
  merchantTransactionId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  try {
    const { data, error } = await (supabase.rpc as unknown as {
      (name: string, params: Record<string, unknown>): Promise<{ data: string; error: unknown }>;
    })('create_payment_transaction', {
      p_order_id: orderId,
      p_merchant_transaction_id: merchantTransactionId,
      p_amount: amount,
      p_metadata: metadata || null
    });

    if (error) {
      console.error('[PhonePe] Failed to create payment transaction:', error);
      return null;
    }

    console.log('[PhonePe] Payment transaction created:', data);
    return data;
  } catch (error) {
    console.error('[PhonePe] Error creating payment transaction:', error);
    return null;
  }
}

// Update payment transaction status
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

    const { data, error } = await (supabase.rpc as unknown as {
      (name: string, params: Record<string, unknown>): Promise<{ data: boolean; error: unknown }>;
    })('update_payment_transaction_status', {
      p_merchant_transaction_id: merchantTransactionId,
      p_status: status,
      p_phonepe_transaction_id: phonepeTransactionId || null,
      p_payment_method: paymentMethod || null,
      p_response_code: responseCode || null,
      p_response_message: responseMessage || null,
      p_phonepe_response: phonePeResponse || null
    });

    if (error) {
      console.error('[PhonePe] Failed to update payment transaction:', error);
      return false;
    }

    console.log('[PhonePe] Payment transaction updated:', {
      merchantTransactionId,
      status,
      success: data
    });

    return data;
  } catch (error) {
    console.error('[PhonePe] Error updating payment transaction:', error);
    return false;
  }
}

// Store payment details (legacy function for backward compatibility)
export async function storePaymentDetails(orderId: string, paymentData: PaymentTransaction): Promise<void> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_id: paymentData.merchant_transaction_id,
        status: paymentData.status === 'SUCCESS' ? 'paid' : 'pending'
      })
      .eq('id', orderId);

    if (error) {
      console.error('[PhonePe] Failed to store payment details in orders:', error);
    } else {
      console.log('[PhonePe] Payment details stored in orders table');
    }
  } catch (error) {
    console.error('[PhonePe] Error storing payment details:', error);
  }
}

// Get payment transaction by merchant transaction ID
export async function getPaymentTransaction(merchantTransactionId: string): Promise<PaymentTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('merchant_transaction_id', merchantTransactionId)
      .single();

    if (error) {
      console.error('[PhonePe] Failed to get payment transaction:', error);
      return null;
    }

    return data as unknown as PaymentTransaction;
  } catch (error) {
    console.error('[PhonePe] Error getting payment transaction:', error);
    return null;
  }
}

// Get payment transactions for an order
export async function getOrderPaymentTransactions(orderId: string): Promise<PaymentTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PhonePe] Failed to get order payment transactions:', error);
      return [];
    }

    return (data || []) as unknown as PaymentTransaction[];
  } catch (error) {
    console.error('[PhonePe] Error getting order payment transactions:', error);
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
