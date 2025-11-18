import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PHONEPE_MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID') || 'M23DXJKWOH2QZ';
const PHONEPE_CLIENT_ID = Deno.env.get('PHONEPE_CLIENT_ID') || 'SU2511071520405754774079';
const PHONEPE_CLIENT_SECRET = Deno.env.get('PHONEPE_CLIENT_SECRET') || 'c70dce3a-c985-4237-add4-b8b9ad647bbf';
let PHONEPE_AUTH_TOKEN = Deno.env.get('PHONEPE_AUTH_TOKEN') || '';
const PHONEPE_API_URL = Deno.env.get('PHONEPE_API_URL') || 'https://api.phonepe.com/apis/pg';

// Auto-refresh token function
async function getValidToken(): Promise<string> {
  // If we have a token, try to use it
  if (PHONEPE_AUTH_TOKEN) {
    return PHONEPE_AUTH_TOKEN;
  }

  // Generate new token
  console.log('[PhonePe] Generating new OAuth token...');
  const formData = new URLSearchParams();
  formData.append('client_id', PHONEPE_CLIENT_ID);
  formData.append('client_version', '1');
  formData.append('client_secret', PHONEPE_CLIENT_SECRET);
  formData.append('grant_type', 'client_credentials');

  const response = await fetch('https://api.phonepe.com/apis/identity-manager/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to generate OAuth token');
  }

  const data = await response.json();
  PHONEPE_AUTH_TOKEN = data.access_token;
  console.log('[PhonePe] Token generated, expires at:', new Date(data.expires_at * 1000).toISOString());
  
  return PHONEPE_AUTH_TOKEN;
}

serve(async (req: Request) => {
  // Enable CORS for all requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
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

    console.log('[PhonePe Check Status v2 API]', { merchantTransactionId });

    // Get valid token (auto-refreshes if needed)
    const authToken = await getValidToken();

    // Call PhonePe v2 Order Status API
    // GET /checkout/v2/order/{merchantOrderId}/status
    const phonepeUrl = `${PHONEPE_API_URL}/checkout/v2/order/${merchantTransactionId}/status?details=false`;
    console.log('[PhonePe Check Status] Calling v2 API:', phonepeUrl);

    const response = await fetch(phonepeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${authToken}`
      }
    });

    const data = await response.json();

    console.log('[PhonePe Check Status] Response status:', response.status);
    console.log('[PhonePe Check Status] Response data:', data);

    // If we get 401, token might be expired - try to refresh and retry once
    if (response.status === 401) {
      console.log('[PhonePe Check Status] Token expired, refreshing...');
      PHONEPE_AUTH_TOKEN = ''; // Clear cached token
      const newToken = await getValidToken();
      
      const retryResponse = await fetch(phonepeUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${newToken}`
        }
      });
      
      const retryData = await retryResponse.json();
      console.log('[PhonePe Check Status] Retry response:', retryResponse.status, retryData);
      
      if (!retryResponse.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'PAYMENT_API_ERROR',
            message: retryData.message || 'Failed to check payment status',
            details: retryData
          }),
          {
            status: retryResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          code: 'SUCCESS',
          message: 'Payment status retrieved successfully',
          data: retryData
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

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
        code: 'SUCCESS',
        message: 'Payment status retrieved successfully',
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
