// supabase/functions/phonepe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Verify SHA256 authorization header
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      // Create SHA256 hash using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(`${WEBHOOK_USERNAME}:${WEBHOOK_PASSWORD}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const receivedHash = authHeader.replace('SHA256 ', '').toLowerCase();
      
      if (receivedHash !== expectedHash) {
        console.error('[PhonePe Webhook] Authentication failed');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      console.log('[PhonePe Webhook] Authentication successful');
    }

    const body: PhonePeWebhookPayload = await req.json()

    console.log('[PhonePe Webhook] Received event:', body.event);
    console.log('[PhonePe Webhook] Payload:', JSON.stringify(body.payload, null, 2));

    const { event, payload } = body;
    const merchantOrderId = payload.merchantOrderId;

    if (!merchantOrderId) {
      console.error('[PhonePe Webhook] Missing merchantOrderId');
      return new Response(
        JSON.stringify({ error: 'Missing merchant order ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Determine payment status from event
    let paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING'
    if (event === 'checkout.order.completed' && payload.state === 'COMPLETED') {
      paymentStatus = 'SUCCESS'
    } else if (event === 'checkout.order.failed' || payload.state === 'FAILED') {
      paymentStatus = 'FAILED'
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

    // Extract payment details
    const paymentDetail = payload.paymentDetails?.[0];
    const phonepeTransactionId = paymentDetail?.transactionId || payload.orderId;
    const paymentMode = paymentDetail?.paymentMode || 'UNKNOWN';

    // Update payment transaction
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        phonepe_transaction_id: phonepeTransactionId,
        payment_method: paymentMode,
        response_code: paymentDetail?.errorCode,
        phonepe_response: body,
        updated_at: new Date().toISOString()
      })
      .eq('merchant_transaction_id', merchantOrderId)

    if (updateError) {
      console.error('[PhonePe Webhook] Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

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
      } else {
        console.log('[PhonePe Webhook] Order marked as paid:', transactionData.order_id)
        
        // Deduct stock
        try {
          const { error: deductError } = await supabase
            .rpc('deduct_stock_for_order', { p_order_id: transactionData.order_id })
          
          if (deductError) {
            console.error('[PhonePe Webhook] Stock deduction error:', deductError);
          } else {
            console.log('[PhonePe Webhook] Stock deducted');
          }
        } catch (stockError) {
          console.error('[PhonePe Webhook] Error calling deduct_stock_for_order:', stockError);
        }
      }
    }

    console.log('[PhonePe Webhook] Successfully processed');

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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
