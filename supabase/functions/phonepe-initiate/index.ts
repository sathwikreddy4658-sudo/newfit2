import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PHONEPE_MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID') || 'M23DXJKWOH2QZ';
const PHONEPE_CLIENT_ID = Deno.env.get('PHONEPE_CLIENT_ID') || 'SU2511071520405754774079';
const PHONEPE_CLIENT_SECRET = Deno.env.get('PHONEPE_CLIENT_SECRET') || '';
const PHONEPE_API_URL = Deno.env.get('PHONEPE_API_URL') || 'https://api.phonepe.com/apis/pg';
const PHONEPE_ENV = Deno.env.get('PHONEPE_ENV') || 'PRODUCTION';

// Payment request payload interface
interface PaymentPayload {
  merchantId: string;
  merchantTransactionId: string;
  merchantUserId: string;
  amount: number;
  callbackUrl: string;
  mobileNumber: string;
  paymentInstrument: {
    type: string;
  };
  deviceContext?: {
    deviceOS?: string;
  };
}

serve(async (req) => {
  console.log('[PhonePe Initiate] Incoming request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers)
  });

  // Enable CORS for all requests
  if (req.method === 'OPTIONS') {
    console.log('[PhonePe Initiate] OPTIONS preflight request received');
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Only POST requests allowed' }),
        { 
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      merchantTransactionId,
      amount,
      mobileNumber,
      callbackUrl,
      merchantUserId,
    } = body;

    // Validate input
    if (!merchantTransactionId || !amount || !mobileNumber || !callbackUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: merchantTransactionId, amount, mobileNumber, callbackUrl'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create payload
    const payload: PaymentPayload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: merchantUserId || 'USER_' + merchantTransactionId,
      amount: Math.round(amount * 100), // Convert to paise
      callbackUrl,
      mobileNumber,
      paymentInstrument: {
        type: 'NETBANKING'
      },
      deviceContext: {
        deviceOS: 'WEB'
      }
    };

    console.log('[PhonePe Edge Function] Payment initiation', {
      merchantTransactionId,
      amount,
      mobileNumber: mobileNumber.slice(-4) // Log last 4 digits only
    });

    // Validate credentials
    if (!PHONEPE_CLIENT_SECRET) {
      console.error('[PhonePe Edge Function] Missing PHONEPE_CLIENT_SECRET');
      console.error('[PhonePe Edge Function] Environment variables:', {
        PHONEPE_MERCHANT_ID: PHONEPE_MERCHANT_ID ? 'SET' : 'MISSING',
        PHONEPE_CLIENT_ID: PHONEPE_CLIENT_ID ? 'SET' : 'MISSING',
        PHONEPE_CLIENT_SECRET: PHONEPE_CLIENT_SECRET ? 'SET' : 'MISSING',
        PHONEPE_API_URL: PHONEPE_API_URL ? 'SET' : 'MISSING'
      });
      return new Response(
        JSON.stringify({
          success: false,
          code: 'CONFIG_ERROR',
          message: 'PhonePe credentials not configured. Please add PHONEPE_CLIENT_SECRET to Supabase Edge Function secrets.',
          details: 'Missing environment variable: PHONEPE_CLIENT_SECRET'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create Basic Auth header
    const credentials = `${PHONEPE_CLIENT_ID}:${PHONEPE_CLIENT_SECRET}`;
    const encodedCredentials = btoa(credentials);
    const authHeader = 'Basic ' + encodedCredentials;

    // Call PhonePe API
    const phonepeUrl = `${PHONEPE_API_URL}/v1/pay`;
    console.log('[PhonePe Edge Function] Calling URL:', phonepeUrl);

    const response = await fetch(phonepeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('[PhonePe Edge Function] Response status:', response.status);
    console.log('[PhonePe Edge Function] Response data:', data);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'PAYMENT_API_ERROR',
          message: data.message || 'Failed to initiate payment',
          details: data
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: data
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('[PhonePe Edge Function] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
