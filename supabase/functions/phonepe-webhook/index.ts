// supabase/functions/phonepe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// PhonePe webhook credentials
const WEBHOOK_USERNAME = '6302582245';
const WEBHOOK_PASSWORD = 'Batsy123';

interface PhonePeWebhookPayload {
  event: string; // "checkout.order.completed" or "checkout.order.failed"
  payload: {
    orderId: string;
    merchantId: string;
    merchantOrderId: string;
    state: 'COMPLETED' | 'FAILED' | 'PENDING';
    amount: number;
    expireAt: number;
    metaInfo?: Record<string, string>;
    paymentDetails?: Array<{
      paymentMode: string;
      transactionId: string;
      timestamp: number;
      amount: number;
      state: string;
      errorCode?: string;
      detailedErrorCode?: string;
    }>;
  };
}

serve(async (req: Request) => {
  // Allow CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  try {
    // Verify SHA256 authorization header - Required by PhonePe
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[PhonePe Webhook] Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized - Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // Create SHA256 hash using Web Crypto API
    // PhonePe sends: Authorization: SHA256(username:password)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${WEBHOOK_USERNAME}:${WEBHOOK_PASSWORD}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Extract hash from Authorization header (may have "SHA256 " prefix or not)
    const receivedHash = authHeader.replace(/^SHA256\s*/i, '').toLowerCase();
    
    if (receivedHash !== expectedHash) {
      console.error('[PhonePe Webhook] Authentication failed', {
        received: receivedHash.substring(0, 10) + '...',
        expected: expectedHash.substring(0, 10) + '...'
      });
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    console.log('[PhonePe Webhook] Authentication successful');

    const body: PhonePeWebhookPayload = await req.json()

    console.log('[PhonePe Webhook] Received event:', body.event);
    console.log('[PhonePe Webhook] Payload:', JSON.stringify(body.payload, null, 2));

    const { event, payload } = body;
    const merchantOrderId = payload.merchantOrderId;

    if (!merchantOrderId) {
      console.error('[PhonePe Webhook] Missing merchantOrderId');
      return new Response(
        JSON.stringify({ error: 'Missing merchant order ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Determine payment status based on PhonePe documentation:
    // PhonePe v2 Checkout API sends webhooks with different event names and state values
    // We need to be flexible in detecting successful payments
    let paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING'
    
    console.log('[PhonePe Webhook] Received event and state:', { 
      event, 
      payloadState: payload.state,
      fullPayload: JSON.stringify(payload, null, 2)
    });
    
    // Check for SUCCESS indicators
    // Event can be: checkout.order.completed, PAYMENT_SUCCESS, etc.
    // State can be: COMPLETED, SUCCESS, PAYMENT_SUCCESS, etc.
    const successEvents = ['checkout.order.completed', 'PAYMENT_SUCCESS', 'payment.success'];
    const successStates = ['COMPLETED', 'SUCCESS', 'PAYMENT_SUCCESS'];
    
    const failedEvents = ['checkout.order.failed', 'PAYMENT_ERROR', 'payment.failed'];
    const failedStates = ['FAILED', 'FAILURE', 'PAYMENT_ERROR', 'ERROR'];
    
    const isSuccessEvent = successEvents.some(e => event?.toLowerCase().includes(e.toLowerCase()));
    const isSuccessState = successStates.some(s => payload.state === s);
    
    const isFailedEvent = failedEvents.some(e => event?.toLowerCase().includes(e.toLowerCase()));
    const isFailedState = failedStates.some(s => payload.state === s);
    
    if (isSuccessEvent || isSuccessState) {
      paymentStatus = 'SUCCESS';
      console.log('[PhonePe Webhook] ✅ Order completed successfully');
    } else if (isFailedEvent || isFailedState) {
      paymentStatus = 'FAILED';
      console.log('[PhonePe Webhook] ❌ Order failed');
    } else {
      console.warn('[PhonePe Webhook] ⚠️ Uncertain event/state combination - defaulting to PENDING:', { 
        event, 
        state: payload.state 
      });
      // Don't automatically mark as FAILED - wait for more info
      paymentStatus = 'PENDING';
    }

    console.log('[PhonePe Webhook] Processing status:', paymentStatus);

    // Get transaction and order info
    const { data: transactionData, error: txnError } = await supabase
      .from('payment_transactions')
      .select('order_id')
      .eq('merchant_transaction_id', merchantOrderId)
      .single()

    if (txnError || !transactionData) {
      console.error('[PhonePe Webhook] Transaction not found:', merchantOrderId);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract payment details from the paymentDetails array
    const paymentDetail = payload.paymentDetails?.[0];
    const phonepeTransactionId = paymentDetail?.transactionId || payload.orderId;
    const rawPaymentMode = paymentDetail?.paymentMode || 'UNKNOWN';
    
    // Map PhonePe payment modes to our enum values
    // PhonePe sends: UPI, UPI_QR, UPI_COLLECT, UPI_INTENT, CARD, DEBIT_CARD, CREDIT_CARD, NET_BANKING, WALLET
    let paymentMode = rawPaymentMode;
    const paymentModeMap: Record<string, string> = {
      'UPI': 'UPI',
      'UPI_QR': 'UPI_QR',
      'UPI_COLLECT': 'UPI_COLLECT', 
      'UPI_INTENT': 'UPI_INTENT',
      'CARD': 'CARD',
      'DEBIT_CARD': 'DEBIT_CARD',
      'CREDIT_CARD': 'CREDIT_CARD',
      'NET_BANKING': 'NET_BANKING',
      'NETBANKING': 'NET_BANKING',
      'WALLET': 'WALLET',
      'PAY_PAGE': 'PAY_PAGE',
    };
    
    // Use mapped value or default to UNKNOWN
    paymentMode = paymentModeMap[rawPaymentMode] || 'UNKNOWN';
    
    const errorCode = paymentDetail?.errorCode;
    const detailedErrorCode = paymentDetail?.detailedErrorCode;

    console.log('[PhonePe Webhook] Payment details:', {
      phonepeTransactionId,
      rawPaymentMode,
      mappedPaymentMode: paymentMode,
      errorCode,
      detailedErrorCode,
      amount: payload.amount
    });

    // Update payment transaction with all relevant data
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        phonepe_transaction_id: phonepeTransactionId,
        payment_method: paymentMode,
        response_code: errorCode || null,
        response_message: detailedErrorCode ? `${errorCode} - ${detailedErrorCode}` : errorCode || null,
        phonepe_response: body,
        updated_at: new Date().toISOString()
      })
      .eq('merchant_transaction_id', merchantOrderId)

    if (updateError) {
      console.error('[PhonePe Webhook] Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log('[PhonePe Webhook] Transaction updated successfully');

    // If payment successful, update order and deduct stock
    if (paymentStatus === 'SUCCESS') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_id: merchantOrderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionData.order_id)

      if (orderError) {
        console.error('[PhonePe Webhook] Order update error:', orderError);
        // Return error since this is critical
        return new Response(
          JSON.stringify({ error: 'Failed to update order status' }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
      
      console.log('[PhonePe Webhook] Order marked as paid:', transactionData.order_id)
      
      // Deduct stock for successful payment
      try {
        const { error: deductError } = await supabase
          .rpc('deduct_stock_for_order', { p_order_id: transactionData.order_id })
        
        if (deductError) {
          console.error('[PhonePe Webhook] Stock deduction error:', deductError);
          // Log error but don't fail the webhook - order is already paid
        } else {
          console.log('[PhonePe Webhook] Stock deducted successfully');
        }
      } catch (stockError) {
        console.error('[PhonePe Webhook] Error calling deduct_stock_for_order:', stockError);
        // Log error but don't fail the webhook
      }
    } else if (paymentStatus === 'FAILED') {
      // For failed payments, optionally update order status to failed
      console.log('[PhonePe Webhook] Payment failed, order will remain in pending state');
    }

    console.log('[PhonePe Webhook] Webhook processed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed successfully',
      merchantOrderId: merchantOrderId,
      status: paymentStatus
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('[PhonePe Webhook] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
