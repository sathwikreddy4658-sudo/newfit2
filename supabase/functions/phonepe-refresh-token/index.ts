// supabase/functions/phonepe-refresh-token/index.ts
// Automated PhonePe token refresh - Call this via cron job or before token expires

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PHONEPE_CLIENT_ID = Deno.env.get('PHONEPE_CLIENT_ID') || 'SU2511071520405754774079';
const PHONEPE_CLIENT_SECRET = Deno.env.get('PHONEPE_CLIENT_SECRET') || 'c70dce3a-c985-4237-add4-b8b9ad647bbf';
const PHONEPE_TOKEN_URL = 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[Token Refresh] Generating new PhonePe OAuth token...');

    // Create form data for token request
    const formData = new URLSearchParams();
    formData.append('client_id', PHONEPE_CLIENT_ID);
    formData.append('client_version', '1');
    formData.append('client_secret', PHONEPE_CLIENT_SECRET);
    formData.append('grant_type', 'client_credentials');

    const response = await fetch(PHONEPE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Token Refresh] Failed:', response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to generate token',
          details: errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    console.log('[Token Refresh] Success! Token expires at:', new Date(data.expires_at * 1000).toISOString());
    
    // Store the token in environment variable (for subsequent calls in this session)
    // Note: To persist across deployments, update via Supabase Dashboard or CLI
    
    return new Response(
      JSON.stringify({
        success: true,
        access_token: data.access_token,
        token_type: data.token_type,
        issued_at: data.issued_at,
        expires_at: data.expires_at,
        expires_in_seconds: data.expires_at - data.issued_at,
        expires_in_hours: Math.round((data.expires_at - data.issued_at) / 3600),
        message: 'Token generated successfully. Update PHONEPE_AUTH_TOKEN environment variable with this token.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Token Refresh] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
