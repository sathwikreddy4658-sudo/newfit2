// Supabase Edge Function: telegram-order-notification
// Deploy this to: supabase/functions/telegram-order-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[Telegram] Function invoked');
    console.log('[Telegram] Environment check:', {
      hasBotToken: !!TELEGRAM_BOT_TOKEN,
      hasChatId: !!TELEGRAM_CHAT_ID,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_KEY
    });
    
    const { record } = await req.json();
    
    console.log('[Telegram] Received record:', {
      id: record?.id,
      user_id: record?.user_id,
      customer_name: record?.customer_name,
      customer_email: record?.customer_email,
      customer_phone: record?.customer_phone,
      total_price: record?.total_price
    });
    
    // This function is triggered by database webhook when new order is inserted
    if (!record) {
      console.error('[Telegram] No record provided');
      return new Response(JSON.stringify({ error: "No record provided" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Only send notification for confirmed/paid orders
    // Skip notifications for pending orders or cancelled orders
    console.log('[Telegram] Order status:', record.status);
    
    if (record.status === 'pending') {
      console.log('[Telegram] Skipping notification - order is pending (likely COD or awaiting payment confirmation)');
      return new Response(JSON.stringify({ 
        message: "Notification skipped - order status is pending" 
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (record.status === 'cancelled') {
      console.log('[Telegram] Skipping notification - order is cancelled');
      return new Response(JSON.stringify({ 
        message: "Notification skipped - order is cancelled" 
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Fetch customer details - First try from order record (guest checkout or updated order)
    let customerName = record.customer_name || 'Customer';
    let customerEmail = record.customer_email || 'N/A';
    let customerPhone = record.customer_phone || 'N/A';

    console.log('[Telegram] Initial customer data from record:', { customerName, customerEmail, customerPhone });

    // Only initialize Supabase if we need to fetch missing data
    if ((customerEmail === 'N/A' || customerPhone === 'N/A') && record.user_id && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      console.log('[Telegram] Fetching from profiles for user_id:', record.user_id);
      
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // Get user email from auth
        const { data: userData, error: authError } = await supabase.auth.admin.getUserById(record.user_id);
        if (authError) {
          console.error('[Telegram] Auth error:', authError);
        } else if (userData?.user?.email) {
          customerEmail = userData.user.email;
          console.log('[Telegram] Got email from auth:', customerEmail);
        }

        // Get user details from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', record.user_id)
          .single();

        if (profileError) {
          console.error('[Telegram] Profile error:', profileError);
        } else if (profileData) {
          customerName = profileData.full_name || customerEmail.split('@')[0] || 'Customer';
          customerPhone = profileData.phone || customerPhone;
          console.log('[Telegram] Got profile data:', { customerName, customerPhone });
        }
      } catch (dbError) {
        console.error('[Telegram] Database fetch error:', dbError);
        // Continue with data from record
      }
    }
    
    console.log('[Telegram] Final customer data:', { customerName, customerEmail, customerPhone });

    // Format order details
    const orderId = record.id.slice(0, 8);
    const totalPrice = parseFloat(record.total_price).toFixed(2);
    const paymentMethod = record.payment_method === 'online' ? '💳 Online Payment' : '💵 Cash on Delivery';
    const address = record.address || 'N/A';
    
    console.log('[Telegram] Formatted order details:', { orderId, totalPrice, paymentMethod });
    
    // Create message with emoji and formatting
    const message = `
🎉 *NEW ORDER RECEIVED!*

📦 *Order ID:* \`${orderId}\`
💰 *Amount:* ₹${totalPrice}
${paymentMethod}

👤 *Customer Details:*
Name: ${customerName}
📧 Email: ${customerEmail}
📱 Phone: ${customerPhone}

📍 *Delivery Address:*
${address}

⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

🔗 [View Order Details](${Deno.env.get("SITE_URL")}/admin/dashboard)
`.trim();

    console.log('[Telegram] Sending message to Telegram...');

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });

    const result = await response.json();
    
    console.log('[Telegram] Telegram API response:', { ok: response.ok, status: response.status, result });

    if (!response.ok) {
      console.error("[Telegram] Telegram API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send Telegram message", details: result }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('[Telegram] Success! Notification sent to Telegram');
    
    return new Response(
      JSON.stringify({ success: true, message: "Notification sent to Telegram" }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("[Telegram] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
