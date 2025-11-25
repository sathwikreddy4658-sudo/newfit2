// Email Template Configuration
// Edit this file to customize your order confirmation email

export const emailConfig = {
  // Store/Brand Information
  storeName: 'Freel It',
  storeEmail: 'care@freelit.in',
  websiteUrl: 'https://freelit.in',
  supportEmail: 'care@freelit.in',
  
  // Colors (matches your brand)
  colors: {
    primary: '#5e4338',      // Brown
    secondary: '#3b2a20',    // Darker brown
    accent: '#b5edce',       // Mint green
    success: '#4caf50',
    warning: '#ffd700',
  },
  
  // Email Subject Template
  // Available variables: {orderId}
  subjectTemplate: 'Order Confirmed - #{orderId}',
  
  // Email From Name
  fromName: 'Freelit Order Confirmation',
};

// Email HTML Template Function
export const getOrderEmailTemplate = ({
  customerName,
  orderId,
  orderDate,
  paymentMethod,
  totalPrice,
  orderItems,
  address,
}) => {
  const { storeName, websiteUrl, colors } = emailConfig;
  
  // Build order items HTML
  const itemsHtml = orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-family: 'Poppins', sans-serif; font-weight: 300;">
        <strong style="font-weight: 400;">${item.product_name}</strong>
      </td>
      <td align="center" style="padding: 12px 8px; border-bottom: 1px solid #eee; font-family: 'Montserrat', sans-serif; font-weight: 500; white-space: nowrap;">
        ${item.quantity}
      </td>
      <td align="right" class="hide-mobile" style="padding: 12px 8px; border-bottom: 1px solid #eee; font-family: 'Montserrat', sans-serif; font-weight: 500; white-space: nowrap;">
        ₹${item.product_price.toFixed(2)}
      </td>
      <td align="right" style="padding: 12px 8px; border-bottom: 1px solid #eee; font-family: 'Montserrat', sans-serif; font-weight: 600; white-space: nowrap;">
        ₹${(item.product_price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Order Confirmation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Saira:wght@900&family=Poppins:wght@300;400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* Mobile-first responsive styles */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .header { padding: 20px 15px !important; }
      .header h1 { font-size: 22px !important; }
      .body-content { padding: 20px 15px !important; }
      .section-box { padding: 15px !important; }
      .section-title { font-size: 16px !important; }
      .button { padding: 10px 20px !important; font-size: 14px !important; }
      .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .table-responsive table { min-width: 100%; }
      .hide-mobile { display: none !important; }
      .full-width-mobile { width: 100% !important; display: block !important; }
    }
    
    /* Prevent Gmail from stripping styles */
    u + .body { margin: 0; padding: 0; }
  </style>
</head>
<body class="body" style="font-family: 'Poppins', Arial, sans-serif; font-weight: 300; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <!-- Full width wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        
        <!-- Main container -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td class="header" style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">ORDER CONFIRMED!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; font-family: 'Poppins', sans-serif; font-weight: 300;">Thank you for shopping with ${storeName}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="body-content" style="padding: 30px;">
              
              <p style="font-size: 16px; margin-bottom: 20px; font-family: 'Poppins', sans-serif; font-weight: 300;">
                Hi <strong style="font-weight: 400;">${customerName}</strong>,
              </p>

              <p style="font-size: 15px; margin-bottom: 25px; font-family: 'Poppins', sans-serif; font-weight: 300;">
                Great news! Your order has been confirmed and is being prepared for delivery. 
                We'll notify you once it's shipped.
              </p>

              <!-- Order Details -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="section-box" style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 2px solid ${colors.accent};">
                <tr>
                  <td>
                    <h2 class="section-title" style="margin: 0 0 15px 0; color: ${colors.primary}; font-size: 18px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">📦 ORDER DETAILS</h2>
                    <table width="100%" cellpadding="5" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #666; font-family: 'Poppins', sans-serif; font-weight: 300; padding: 5px 0;">Order ID:</td>
                        <td align="right" style="padding: 5px 0;">
                          <span style="font-family: 'Montserrat', monospace, sans-serif; font-weight: 600; background: #f0f0f0; padding: 4px 8px; border-radius: 3px; white-space: nowrap;">
                            ${orderId.slice(0, 8)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-family: 'Poppins', sans-serif; font-weight: 300; padding: 5px 0;">Order Date:</td>
                        <td align="right" style="padding: 5px 0; font-family: 'Montserrat', sans-serif; font-weight: 500;">${orderDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #666; font-family: 'Poppins', sans-serif; font-weight: 300; padding: 5px 0;">Payment:</td>
                        <td align="right" style="padding: 5px 0; font-family: 'Poppins', sans-serif; font-weight: 400;">${paymentMethod}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Order Items Table -->
              <div class="table-responsive" style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #eee; overflow-x: auto;">
                <h2 class="section-title" style="margin: 0 0 15px 0; color: ${colors.primary}; font-size: 18px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">🛒 ITEMS ORDERED</h2>
                <table width="100%" cellpadding="12" cellspacing="0" border="0" style="min-width: 300px;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th align="left" style="padding: 12px 8px; border-bottom: 2px solid #ddd; font-size: 12px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">PRODUCT</th>
                      <th align="center" style="padding: 12px 8px; border-bottom: 2px solid #ddd; font-size: 12px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">QTY</th>
                      <th align="right" class="hide-mobile" style="padding: 12px 8px; border-bottom: 2px solid #ddd; font-size: 12px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">PRICE</th>
                      <th align="right" style="padding: 12px 8px; border-bottom: 2px solid #ddd; font-size: 12px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr style="background: #f9f9f9;">
                      <td colspan="3" align="right" style="padding: 15px 8px; font-size: 14px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                        ORDER TOTAL:
                      </td>
                      <td align="right" style="padding: 15px 8px; font-size: 18px; color: ${colors.primary}; font-family: 'Montserrat', sans-serif; font-weight: 600; white-space: nowrap;">
                        ₹${parseFloat(totalPrice).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              ${
                address
                  ? `
              <!-- Delivery Address -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="section-box" style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${colors.accent};">
                <tr>
                  <td>
                    <h2 class="section-title" style="margin: 0 0 10px 0; color: ${colors.primary}; font-size: 18px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">📍 DELIVERY ADDRESS</h2>
                    <p style="margin: 0; line-height: 1.8; color: #555; font-family: 'Poppins', sans-serif; font-weight: 300; word-wrap: break-word;">${address}</p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              ${
                paymentMethod === 'COD'
                  ? `
              <!-- COD Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" class="section-box" style="background: #fff8e1; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid ${colors.warning};">
                <tr>
                  <td>
                    <p style="margin: 0; color: #856404; font-family: 'Poppins', sans-serif; font-weight: 300;">
                      <strong style="font-weight: 400;">💰 Cash on Delivery</strong><br>
                      Please keep the exact amount ready when our delivery partner arrives.
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

              <!-- Footer Message -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <p style="font-size: 15px; color: #666; margin-bottom: 15px; font-family: 'Poppins', sans-serif; font-weight: 300;">
                      <strong style="font-weight: 400;">Need help?</strong><br>
                      Reply to this email or visit <a href="${websiteUrl}" style="color: ${colors.primary}; text-decoration: none; word-break: break-all;">${storeName}.in</a>
                    </p>
                    
                    <a href="${websiteUrl}" class="button full-width-mobile" style="display: inline-block; background: ${colors.primary}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-family: 'Saira', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px;">
                      VISIT OUR STORE
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #666; margin: 20px 0 0 0; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 300;">
                Thank you for choosing ${storeName}! 
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px; background: #f5f5f5;">
              <p style="margin: 5px 0; color: #999; font-size: 12px; font-family: 'Poppins', sans-serif; font-weight: 300;">
                This is an automated confirmation email. Please do not reply directly to this message.
              </p>
              <p style="margin: 5px 0; color: #999; font-size: 12px; font-family: 'Poppins', sans-serif; font-weight: 300;">
                © ${new Date().getFullYear()} ${storeName}. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; font-family: 'Poppins', sans-serif; font-weight: 300;">
                <a href="${websiteUrl}" style="color: #999; text-decoration: none;">Visit Website</a> | 
                <a href="mailto:${emailConfig.supportEmail}" style="color: #999; text-decoration: none;">Contact Support</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- End main container -->
        
      </td>
    </tr>
  </table>
  <!-- End wrapper -->

</body>
</html>
  `;
};

// Plain Text Email Template
export const getOrderEmailText = ({
  customerName,
  orderId,
  orderDate,
  paymentMethod,
  totalPrice,
  orderItems,
  address,
}) => {
  const { storeName, websiteUrl, supportEmail } = emailConfig;
  
  return `Hi ${customerName},

Great news! Your order has been confirmed and is being prepared for delivery.

═══════════════════════════════════
ORDER DETAILS
═══════════════════════════════════

Order ID: ${orderId.slice(0, 8)}
Order Date: ${orderDate}
Payment Method: ${paymentMethod}
Total Amount: ₹${parseFloat(totalPrice).toFixed(2)}

${address ? `DELIVERY ADDRESS:\n${address}\n\n` : ''}
${
  paymentMethod === 'COD'
    ? 'CASH ON DELIVERY\nPlease keep the exact amount ready when our delivery partner arrives.\n\n'
    : ''
}
═══════════════════════════════════
ITEMS ORDERED
═══════════════════════════════════

${orderItems
  .map(
    (item, index) =>
      `${index + 1}. ${item.product_name}\n   Quantity: ${item.quantity} × ₹${item.product_price.toFixed(2)} = ₹${(item.product_price * item.quantity).toFixed(2)}`
  )
  .join('\n\n')}

═══════════════════════════════════

Thank you for choosing ${storeName}!

Need help? 
- Reply to this email: ${supportEmail}
- Visit our website: ${websiteUrl}

© ${new Date().getFullYear()} ${storeName}. All rights reserved.
`;
};
