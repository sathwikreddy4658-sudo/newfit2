import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log('[CORS Test] Request method:', req.method);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'CORS test passed',
      env: {
        merchant: Deno.env.get('PHONEPE_MERCHANT_ID') ? 'SET' : 'NOT SET',
        clientId: Deno.env.get('PHONEPE_CLIENT_ID') ? 'SET' : 'NOT SET',
        secret: Deno.env.get('PHONEPE_CLIENT_SECRET') ? 'SET' : 'NOT SET',
        apiUrl: Deno.env.get('PHONEPE_API_URL') ? 'SET' : 'NOT SET',
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
});
