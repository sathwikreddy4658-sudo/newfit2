// Supabase Edge Function: telegram-order-notification
// Deploy this to: supabase/functions/telegram-order-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    const { record } = await req.json();
    
    // This function is triggered by database webhook when new order is inserted
    if (!record) {
      return new Response(JSON.stringify({ error: "No record provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client to fetch user details
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // Fetch user details from auth.users and profiles
    let customerName = 'Customer';
    let customerEmail = 'N/A';
    let customerPhone = 'N/A';

    if (record.user_id) {
      // Get user email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(record.user_id);
      if (userData?.user?.email) {
        customerEmail = userData.user.email;
      }

      // Get user details from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', record.user_id)
        .single();

      if (profileData) {
        customerName = profileData.full_name || customerEmail.split('@')[0] || 'Customer';
        customerPhone = profileData.phone || 'N/A';
      }
    }

    // Format order details
    const orderId = record.id.slice(0, 8);
    const totalPrice = parseFloat(record.total_price).toFixed(2);
    const paymentMethod = record.payment_method === 'online' ? '💳 Online Payment' : '💵 Cash on Delivery';
    const address = record.address || 'N/A';
    
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

    if (!response.ok) {
      console.error("Telegram API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send Telegram message", details: result }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent to Telegram" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
