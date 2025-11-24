// Supabase Edge Function to send order confirmation emails via SMTP
// Deploy with: supabase functions deploy send-order-confirmation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

// SMTP Configuration from environment variables
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER') // Your email
const SMTP_PASS = Deno.env.get('SMTP_PASS') // Your password
const SMTP_FROM = Deno.env.get('SMTP_FROM') || SMTP_USER // Sender email

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_name: string
  quantity: number
  product_price: number
}

interface EmailRequest {
  orderId: string
  customerEmail: string
  customerName: string
  totalPrice: string
  orderItems: OrderItem[]
  address?: string
  paymentMethod: string
  createdAt: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    const {
      orderId,
      customerEmail,
      customerName,
      totalPrice,
      orderItems,
      address,
      paymentMethod,
      createdAt
    }: EmailRequest = await req.json()

    console.log('Sending order confirmation email to:', customerEmail)

    // Format order date
    const orderDate = new Date(createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Build order items HTML
    const itemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.product_name}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ₹${item.product_price.toFixed(2)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ₹${(item.product_price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('')

    // Email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #5e4338 0%, #3b2a20 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your order</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi <strong>${customerName}</strong>,
    </p>

    <p style="font-size: 15px; margin-bottom: 25px;">
      Great news! Your order has been confirmed and is being prepared for delivery. 
      We'll notify you once it's shipped.
    </p>

    <!-- Order Details -->
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #b5edce;">
      <h2 style="margin: 0 0 15px 0; color: #5e4338; font-size: 18px;">📦 Order Details</h2>
      <p style="margin: 5px 0;"><strong>Order ID:</strong> <span style="font-family: monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${orderId.slice(0, 8)}</span></p>
      <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
      <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
    </div>

    <!-- Order Items Table -->
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="margin: 0 0 15px 0; color: #5e4338; font-size: 18px;">🛒 Items Ordered</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 15px 12px 0 12px; text-align: right; font-size: 18px;">
              <strong>Order Total:</strong>
            </td>
            <td style="padding: 15px 12px 0 12px; text-align: right; font-size: 20px; color: #5e4338;">
              <strong>₹${parseFloat(totalPrice).toFixed(2)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${address ? `
    <!-- Delivery Address -->
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #b5edce;">
      <h2 style="margin: 0 0 10px 0; color: #5e4338; font-size: 18px;">📍 Delivery Address</h2>
      <p style="margin: 0; line-height: 1.8;">${address}</p>
    </div>
    ` : ''}

    ${paymentMethod === 'COD' ? `
    <!-- COD Notice -->
    <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #ffd700;">
      <p style="margin: 0; color: #856404;">
        <strong>💰 Cash on Delivery</strong><br>
        Please keep the exact amount ready when our delivery partner arrives.
      </p>
    </div>
    ` : ''}

    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      <strong>Need help?</strong> Reply to this email or contact our support team.
    </p>

    <p style="font-size: 14px; color: #666; margin: 0;">
      Thank you for choosing us! 💚
    </p>

  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 5px 0;">This is an automated confirmation email.</p>
    <p style="margin: 5px 0;">© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
  </div>

</body>
</html>
    `

    // Send email using SMTP
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER!,
          password: SMTP_PASS!,
        },
      },
    })

    try {
      await client.send({
        from: SMTP_FROM!,
        to: customerEmail,
        subject: `Order Confirmed - #${orderId.slice(0, 8)}`,
        html: emailHtml,
      })

      await client.close()

      console.log('Email sent successfully via SMTP')
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } catch (smtpError: any) {
      console.error('SMTP error:', smtpError)
      await client.close()
      
      return new Response(
        JSON.stringify({ success: false, error: smtpError.message || 'Failed to send email' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

  } catch (error: any) {
    console.error('Error in send-order-confirmation function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
