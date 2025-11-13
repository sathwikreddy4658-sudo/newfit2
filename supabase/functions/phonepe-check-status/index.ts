import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PHONEPE_MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID') || 'M23DXJKWOH2QZ';
const PHONEPE_CLIENT_ID = Deno.env.get('PHONEPE_CLIENT_ID') || 'SU2511071520405754774079';
const PHONEPE_CLIENT_SECRET = Deno.env.get('PHONEPE_CLIENT_SECRET') || '';
const PHONEPE_API_URL = Deno.env.get('PHONEPE_API_URL') || 'https://api.phonepe.com/apis/pg';

serve(async (req: Request) => {
  // Enable CORS for all requests
  if (req.method === 'OPTIONS') {
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
    const { merchantTransactionId } = body;

    // Validate input
    if (!merchantTransactionId) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'INVALID_REQUEST',
          message: 'Missing required field: merchantTransactionId'
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

    console.log('[PhonePe Check Status Edge Function]', { merchantTransactionId });

    // Validate credentials
    if (!PHONEPE_CLIENT_SECRET) {
      console.error('[PhonePe Check Status] Missing PHONEPE_CLIENT_SECRET');
      console.error('[PhonePe Check Status] Environment variables:', {
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
    const phonepeUrl = `${PHONEPE_API_URL}/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
    console.log('[PhonePe Check Status] Calling URL:', phonepeUrl);

    const response = await fetch(phonepeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    const data = await response.json();

    console.log('[PhonePe Check Status] Response status:', response.status);
    console.log('[PhonePe Check Status] Response data:', data);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'PAYMENT_API_ERROR',
          message: data.message || 'Failed to check payment status',
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
    console.error('[PhonePe Check Status] Error:', error);
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
