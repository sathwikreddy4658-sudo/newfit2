// supabase/functions/phonepe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as CryptoJS from "https://esm.sh/crypto-js@4.1.0"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface PhonePeWebhookPayload {
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
    };
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
        'Access-Control-Allow-Headers': 'Content-Type, X-Verify'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.json()
    const payload: PhonePeWebhookPayload = body

    console.log('[PhonePe Webhook] Received:', {
      merchantTransactionId: payload.data?.merchantTransactionId,
      state: payload.data?.state,
      success: payload.success
    })

    // Validate required fields
    if (!payload.data?.merchantTransactionId) {
      console.error('[PhonePe Webhook] Missing merchantTransactionId')
      return new Response(
        JSON.stringify({ error: 'Missing transaction ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const merchantTransactionId = payload.data.merchantTransactionId

    // Determine payment status
    let paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING'
    if (payload.success && payload.data.state === 'COMPLETED') {
      paymentStatus = 'SUCCESS'
    } else if (payload.data.state === 'FAILED') {
      paymentStatus = 'FAILED'
    }

    console.log('[PhonePe Webhook] Processing status:', paymentStatus)

    // Update payment transaction in database
    const { data: transactionData, error: txnError } = await supabase
      .from('payment_transactions')
      .select('order_id')
      .eq('merchant_transaction_id', merchantTransactionId)
      .single()

    if (txnError || !transactionData) {
      console.error('[PhonePe Webhook] Transaction not found:', merchantTransactionId)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update payment transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        phonepe_transaction_id: payload.data.transactionId,
        payment_method: payload.data.paymentInstrument?.type || 'UNKNOWN',
        response_code: payload.data.responseCode,
        response_message: payload.message,
        phonepe_response: payload,
        updated_at: new Date().toISOString()
      })
      .eq('merchant_transaction_id', merchantTransactionId)

    if (updateError) {
      console.error('[PhonePe Webhook] Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // If payment successful, update order status
    if (paymentStatus === 'SUCCESS') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          paid_status: true,
          payment_id: merchantTransactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionData.order_id)

      if (orderError) {
        console.error('[PhonePe Webhook] Order update error:', orderError)
        // Don't fail webhook for order update errors
      } else {
        console.log('[PhonePe Webhook] Order marked as paid:', transactionData.order_id)
      }

      // Optional: Send confirmation email
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, customer:users(email, name)')
          .eq('id', transactionData.order_id)
          .single()

        if (orderData?.customer?.email) {
          // You can integrate your email service here
          console.log('[PhonePe Webhook] Payment confirmation email sent to:', orderData.customer.email)
        }
      } catch (emailError) {
        console.error('[PhonePe Webhook] Email notification error:', emailError)
        // Don't fail webhook for email errors
      }
    }

    console.log('[PhonePe Webhook] Successfully processed:', {
      merchantTransactionId,
      status: paymentStatus
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verified and recorded',
      merchantTransactionId,
      status: paymentStatus
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[PhonePe Webhook] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
