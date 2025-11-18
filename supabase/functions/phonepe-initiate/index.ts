import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PHONEPE_MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID') || 'M23DXJKWOH2QZ';
const PHONEPE_CLIENT_ID = Deno.env.get('PHONEPE_CLIENT_ID') || 'SU2511071520405754774079';
const PHONEPE_CLIENT_SECRET = Deno.env.get('PHONEPE_CLIENT_SECRET') || '';
const PHONEPE_API_URL = Deno.env.get('PHONEPE_API_URL') || 'https://api.phonepe.com/apis/pg';
const PHONEPE_ENV = Deno.env.get('PHONEPE_ENV') || 'SANDBOX'; // Default to SANDBOX since credentials appear to be sandbox

console.log('[PhonePe Init] Configuration:', {
  env: PHONEPE_ENV,
  merchantId: PHONEPE_MERCHANT_ID,
  hasSecret: !!PHONEPE_CLIENT_SECRET
});

// Helper: URL encode form data for OAuth
function urlEncode(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

// Payment request payload interface for v2.0
interface PaymentPayload {
  merchantOrderId: string;
  amount: number;
  expireAfter?: number;
  metaInfo?: Record<string, string>;
  paymentFlow: {
    type: string;
    message?: string;
    merchantUrls: {
      redirectUrl: string;
    };
  };
}

serve(async (req: Request) => {
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    console.log('[PhonePe Initiate] Request received:', { method: req.method });
    
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
    let body: any;
    try {
      body = await req.json();
      console.log('[PhonePe Initiate] Parsed body:', body);
    } catch (parseError) {
      console.error('[PhonePe Initiate] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          code: 'JSON_PARSE_ERROR',
          message: 'Failed to parse request body',
          error: parseError instanceof Error ? parseError.message : String(parseError)
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
    
    const {
      merchantTransactionId,
      amount,
      callbackUrl,
      redirectUrl,
    } = body;

    console.log('[PhonePe Initiate] Extracted fields:', {
      merchantTransactionId,
      amount,
      callbackUrl,
      redirectUrl
    });

    // Validate required fields
    const missingFields = [];
    if (!merchantTransactionId) missingFields.push('merchantTransactionId');
    if (!amount && amount !== 0) missingFields.push('amount');
    if (!callbackUrl) missingFields.push('callbackUrl');
    if (!redirectUrl) missingFields.push('redirectUrl');

    if (missingFields.length > 0) {
      console.error('[PhonePe Initiate] Validation failed - Missing fields:', missingFields);
      console.error('[PhonePe Initiate] Full body was:', body);
      return new Response(
        JSON.stringify({
          success: false,
          code: 'INVALID_REQUEST',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          received: { merchantTransactionId, amount, callbackUrl, redirectUrl },
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

    // Validate credentials
    if (!PHONEPE_CLIENT_SECRET) {
      console.error('[PhonePe Initiate] Missing PHONEPE_CLIENT_SECRET');
      return new Response(
        JSON.stringify({
          success: false,
          code: 'CONFIG_ERROR',
          message: 'PhonePe credentials not configured',
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

    // Step 1: Get OAuth token from PhonePe
    console.log('[PhonePe Initiate] Step 1: Requesting OAuth token...');
    const oauthUrl = PHONEPE_ENV === 'PRODUCTION' 
      ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

    const tokenFormData = {
      client_id: PHONEPE_CLIENT_ID,
      client_version: '1',
      client_secret: PHONEPE_CLIENT_SECRET,
      grant_type: 'client_credentials'
    };

    console.log('[PhonePe Initiate] OAuth request to:', oauthUrl);
    const tokenResponse = await fetch(oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: urlEncode(tokenFormData)
    });

    const tokenData = await tokenResponse.json();
    console.log('[PhonePe Initiate] OAuth token response:', {
      status: tokenResponse.status,
      hasToken: !!tokenData.access_token,
      tokenType: tokenData.token_type
    });

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[PhonePe Initiate] Failed to get OAuth token:', tokenData);
      return new Response(
        JSON.stringify({
          success: false,
          code: 'OAUTH_ERROR',
          message: 'Failed to authenticate with PhonePe',
          details: tokenData
        }),
        {
          status: tokenResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const accessToken = tokenData.access_token;
    console.log('[PhonePe Initiate] Got OAuth token, token_type:', tokenData.token_type);

    // Step 2: Create payment request with PhonePe v2.0 payload
    console.log('[PhonePe Initiate] Step 2: Creating payment request...');
    
    const payload: any = {
      merchantId: PHONEPE_MERCHANT_ID, // Required for v2.0 API
      merchantOrderId: merchantTransactionId,
      amount: Math.round(amount * 100), // Convert to paise
      expireAfter: 1200, // 20 minutes
      metaInfo: {
        transactionId: merchantTransactionId
      },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Payment for order',
        merchantUrls: {
          redirectUrl: redirectUrl || callbackUrl
        },
        paymentModeConfig: {
          enabledPaymentModes: [
            { type: 'UPI_COLLECT' },
            { type: 'UPI_INTENT' },
            { type: 'UPI_QR' },
            { type: 'NET_BANKING' },
            { 
              type: 'CARD',
              cardTypes: ['DEBIT_CARD', 'CREDIT_CARD']
            }
          ]
        }
      }
    };

    console.log('[PhonePe Initiate] Created payload:', JSON.stringify(payload, null, 2));

    // Step 3: Call PhonePe Create Payment API
    const paymentUrl = PHONEPE_ENV === 'PRODUCTION'
      ? 'https://api.phonepe.com/apis/pg/checkout/v2/pay'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay';

    console.log('[PhonePe Initiate] Calling payment API:', paymentUrl);

    const authHeaderValue = `${tokenData.token_type} ${accessToken}`;
    console.log('[PhonePe Initiate] Auth header type:', tokenData.token_type);

    const response = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeaderValue
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('[PhonePe Initiate] Payment API Response status:', response.status);
    console.log('[PhonePe Initiate] Payment API Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('[PhonePe Initiate] Payment API Error Response:', {
        status: response.status,
        code: data.code,
        message: data.message,
        errorCode: data.errorCode,
        errorMsg: data.errorMsg
      });
      return new Response(
        JSON.stringify({
          success: false,
          code: 'PAYMENT_API_ERROR',
          message: data.message || data.errorMsg || 'Failed to initiate payment',
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

    // Verify redirectUrl exists and is valid
    const finalRedirectUrl = data?.data?.redirectUrl || data?.redirectUrl;
    console.log('[PhonePe Initiate] Final redirect URL to send to client:', finalRedirectUrl);

    if (!finalRedirectUrl) {
      console.error('[PhonePe Initiate] No redirectUrl in response:', data);
      return new Response(
        JSON.stringify({
          success: false,
          code: 'NO_REDIRECT_URL',
          message: 'PhonePe response missing redirectUrl',
          details: data
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

    // Return success response with PhonePe's response data
    console.log('[PhonePe Initiate] Payment initiated successfully, redirecting to:', finalRedirectUrl);
    return new Response(
      JSON.stringify({
        success: true,
        code: 'SUCCESS',
        message: 'Payment initiated successfully',
        data: { redirectUrl: finalRedirectUrl }
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
    console.error('[PhonePe Initiate] Error:', error);
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
