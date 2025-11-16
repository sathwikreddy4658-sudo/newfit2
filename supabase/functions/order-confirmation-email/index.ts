import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { orderId, userEmail, orderDetails } = await req.json()

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          product_name,
          quantity,
          product_price
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      throw orderError
    }

    // Create email content
    const emailSubject = `Order Confirmation - Order #${orderId.slice(-8).toUpperCase()}`

    const orderItemsHtml = order.order_items.map((item: any) =>
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.product_price}</td>
      </tr>`
    ).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #b5edce; margin: 0;">Freelit</h1>
            <p style="margin: 5px 0; color: #666;">Your Health, Our Priority</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Order Confirmed!</h2>
            <p>Thank you for your order. Your order has been successfully placed and is being processed.</p>
          </div>

          <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            <div style="background: #b5edce; padding: 15px; color: white;">
              <h3 style="margin: 0;">Order Details</h3>
            </div>
            <div style="padding: 20px;">
              <p><strong>Order ID:</strong> ${orderId.slice(-8).toUpperCase()}</p>
              <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-IN')}</p>
              <p><strong>Total Amount:</strong> ₹${order.total_price}</p>
              <p><strong>Delivery Address:</strong> ${order.address}</p>
            </div>
          </div>

          <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
            <div style="background: #b5edce; padding: 15px; color: white;">
              <h3 style="margin: 0;">Order Items</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #f8f9fa; font-weight: bold;">
                  <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
                  <td style="padding: 10px; text-align: right;">₹${order.total_price}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #856404;">What's Next?</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Your order is being prepared</li>
              <li>You'll receive updates on your order status</li>
              <li>Estimated delivery: 3-5 business days</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #666;">
              Questions about your order? Contact us at <a href="mailto:support@freelit.com" style="color: #b5edce;">support@freelit.com</a>
            </p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
              © 2024 Freelit. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `

    // Send email using Supabase's built-in email service
    const { error: emailError } = await supabaseClient.auth.admin.sendRawEmail({
      to: userEmail,
      subject: emailSubject,
      html: emailHtml,
    })

    if (emailError) {
      throw emailError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Order confirmation email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
