/**
 * Firebase Cloud Functions — NewFit Payment & Notification Backend
 *
 * Replaces Supabase Edge Functions:
 *   phonepe-initiate      → POST /api/phonepe-initiate
 *   phonepe-check-status  → POST /api/phonepe-check-status
 *   phonepe-webhook       → POST /api/phonepe-webhook  (called by PhonePe)
 *   send-email           → POST /api/send-email  (order confirmations)
 *   telegram notification → Firestore onCreate trigger on orders/{orderId}
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";

// ─── Firebase Admin init ─────────────────────────────────────────────────────
admin.initializeApp();
const db = admin.firestore();

// ─── Environment variables ─────────────────────────────────────────────────────

const PHONEPE_MERCHANT_ID =
  process.env.PHONEPE_MERCHANT_ID || "";
const PHONEPE_CLIENT_ID =
  process.env.PHONEPE_CLIENT_ID || "";
const PHONEPE_CLIENT_SECRET =
  process.env.PHONEPE_CLIENT_SECRET || "";
const PHONEPE_ENV = process.env.PHONEPE_ENV || "PRODUCTION";
const PHONEPE_API_URL =
  process.env.PHONEPE_API_URL || "https://api.phonepe.com/apis/pg";

// PhonePe Webhook credentials (used to verify incoming webhooks)
const PHONEPE_WEBHOOK_USERNAME = process.env.PHONEPE_WEBHOOK_USERNAME || "";
const PHONEPE_WEBHOOK_PASSWORD = process.env.PHONEPE_WEBHOOK_PASSWORD || "";

// SMTP Configuration for email notifications
// Use hardcoded values as fallback if environment variables not set
const SMTP_HOST = process.env.SMTP_HOST || "smtp.hostinger.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || "care@freelit.in";
const SMTP_PASS = process.env.SMTP_PASS || "NewFit@2025secure";

// Telegram — read from Firebase Runtime Config (set via firebase functions:config:set)
const TELEGRAM_BOT_TOKEN =
  functions.config().telegram?.bot_token || process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID =
  functions.config().telegram?.chat_id || process.env.TELEGRAM_CHAT_ID || "";
const SITE_URL =
  functions.config().site?.url ||
  functions.config().app?.site_url ||
  process.env.SITE_URL ||
  "https://freelit.in";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute SHA-256 hex digest of a string (synchronous via Node crypto)
 */
function sha256Hex(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Encode a plain object as application/x-www-form-urlencoded
 */
function urlEncode(obj: Record<string, string>): string {
  return new URLSearchParams(obj).toString();
}

/**
 * Get (or refresh) a PhonePe OAuth access token.
 * Stateless — always fetches fresh, suitable for serverless.
 */
async function getPhonePeAccessToken(): Promise<{
  access_token: string;
  token_type: string;
}> {
  const oauthUrl =
    PHONEPE_ENV === "PRODUCTION"
      ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

  const body = urlEncode({
    client_id: PHONEPE_CLIENT_ID,
    client_version: "1",
    client_secret: PHONEPE_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const res = await fetch(oauthUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok || !data.access_token) {
    throw new Error(
      `PhonePe OAuth failed (${res.status}): ${JSON.stringify(data)}`
    );
  }
  return {
    access_token: data.access_token as string,
    token_type: (data.token_type as string) || "O-Bearer",
  };
}

// ─── CORS middleware ───────────────────────────────────────────────────────────
const corsOptions = cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-client-info",
    "apikey",
  ],
});

// ─── Express app ───────────────────────────────────────────────────────────────
const app = express();
// Explicitly handle OPTIONS preflight for all routes BEFORE other middleware.
// Without this, preflight requests fall through to Express routing and return
// a response with no CORS headers, causing the browser to block the request.
app.options("*", corsOptions);
app.use(corsOptions);
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
//  POST /phonepe-initiate
//  Initiates a PhonePe payment via v2 API and returns a redirect URL.
// ─────────────────────────────────────────────────────────────────────────────
app.post("/phonepe-initiate", async (req: Request, res: Response) => {
  try {
    const {
      merchantTransactionId,
      amount,
      callbackUrl,
      redirectUrl,
      mobileNumber,
      billingAddress,
    } = req.body as Record<string, unknown>;

    // Validate required fields
    const missingFields: string[] = [];
    if (!merchantTransactionId) missingFields.push("merchantTransactionId");
    if (amount === undefined || amount === null) missingFields.push("amount");
    if (!callbackUrl) missingFields.push("callbackUrl");
    if (!redirectUrl) missingFields.push("redirectUrl");

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    // Step 1: Get OAuth token
    const tokenData = await getPhonePeAccessToken();

    // Step 2: Build payment payload (PhonePe v2.0)
    const finalBillingAddress =
      typeof billingAddress === "string" && billingAddress.length >= 10
        ? billingAddress.substring(0, 500)
        : "Default Address - Payment Processing";

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantOrderId: merchantTransactionId,
      amount: Math.round((amount as number) * 100), // convert to paise
      expireAfter: 1200,
      billingAddress: finalBillingAddress,
      mobileNumber: mobileNumber || "",
      metaInfo: { transactionId: merchantTransactionId },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment for order",
        merchantUrls: {
          redirectUrl: redirectUrl || callbackUrl,
        },
        paymentModeConfig: {
          enabledPaymentModes: [
            { type: "UPI_COLLECT" },
            { type: "UPI_INTENT" },
            { type: "UPI_QR" },
            { type: "NET_BANKING" },
            {
              type: "CARD",
              cardTypes: ["DEBIT_CARD", "CREDIT_CARD"],
            },
          ],
        },
      },
    };

    // Step 3: Call PhonePe Create Payment API
    const paymentUrl =
      PHONEPE_ENV === "PRODUCTION"
        ? "https://api.phonepe.com/apis/pg/checkout/v2/pay"
        : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

    const paymentRes = await fetch(paymentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await paymentRes.json() as Record<string, unknown>;

    if (!paymentRes.ok) {
      res.status(paymentRes.status).json({
        success: false,
        code: "PAYMENT_API_ERROR",
        message:
          (data.message as string) ||
          (data.errorMsg as string) ||
          "Failed to initiate payment",
        details: data,
      });
      return;
    }

    const finalRedirectUrl =
      (data.data as Record<string, unknown>)?.redirectUrl ||
      data.redirectUrl;

    if (!finalRedirectUrl) {
      res.status(500).json({
        success: false,
        code: "NO_REDIRECT_URL",
        message: "PhonePe response missing redirectUrl",
        details: data,
      });
      return;
    }

    res.status(200).json({
      success: true,
      code: "SUCCESS",
      message: "Payment initiated successfully",
      data: { redirectUrl: finalRedirectUrl },
    });
  } catch (err) {
    console.error("[phonePeInitiate] Error:", err);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /phonepe-check-status
//  Checks PhonePe payment status for a given merchantTransactionId.
// ─────────────────────────────────────────────────────────────────────────────
app.post("/phonepe-check-status", async (req: Request, res: Response) => {
  try {
    const { merchantTransactionId } = req.body as Record<string, unknown>;

    if (!merchantTransactionId) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Missing required field: merchantTransactionId",
      });
      return;
    }

    const tokenData = await getPhonePeAccessToken();

    const statusUrl = `${PHONEPE_API_URL}/v2/checkout/order/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}/status`;

    const doRequest = async (token: string) =>
      fetch(statusUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${token}`,
        },
      });

    let statusRes = await doRequest(tokenData.access_token);

    // Auto-retry once on 401
    if (statusRes.status === 401) {
      console.log("[phonePeCheckStatus] Token expired, refreshing…");
      const fresh = await getPhonePeAccessToken();
      statusRes = await doRequest(fresh.access_token);
    }

    const data = await statusRes.json() as Record<string, unknown>;

    if (!statusRes.ok) {
      res.status(statusRes.status).json({
        success: false,
        code: "PAYMENT_API_ERROR",
        message:
          (data.message as string) || "Failed to check payment status",
        details: data,
      });
      return;
    }

    res.status(200).json({
      success: true,
      code: "SUCCESS",
      message: "Payment status retrieved successfully",
      data,
    });
  } catch (err) {
    console.error("[phonePeCheckStatus] Error:", err);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /phonepe-webhook
//  Called by PhonePe on payment success / failure.
//  Updates payment_transactions + orders in Firestore; deducts stock.
// ─────────────────────────────────────────────────────────────────────────────
app.post("/phonepe-webhook", async (req: Request, res: Response) => {
  try {
    // 1. Verify Authorization header (SHA256 of "username:password")
    const authHeader = req.headers["authorization"] as string | undefined;
    const expectedAuth = sha256Hex(
      `${PHONEPE_WEBHOOK_USERNAME}:${PHONEPE_WEBHOOK_PASSWORD}`
    );

    if (!authHeader || authHeader !== expectedAuth) {
      console.error("[phonePeWebhook] Unauthorized — bad auth header");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // 2. Parse webhook body
    const body = req.body as Record<string, unknown>;
    console.log("[phonePeWebhook] Payload:", JSON.stringify(body));

    const event = body.event as string;
    const payload = body.payload as Record<string, unknown> | undefined;
    const merchantOrderId = payload?.merchantOrderId as string | undefined;
    const state = payload?.state as string | undefined;
    const paymentDetails = payload?.paymentDetails as Array<Record<string, unknown>> | undefined;

    if (!merchantOrderId) {
      res.status(400).json({ error: "Missing merchantOrderId in payload" });
      return;
    }

    // 3. Determine payment status
    const SUCCESS_EVENTS = [
      "checkout.order.completed",
      "PAYMENT_SUCCESS",
      "payment.success",
    ];
    const SUCCESS_STATES = [
      "COMPLETED",
      "SUCCESS",
      "PAYMENT_SUCCESS",
    ];
    const FAILED_EVENTS = [
      "checkout.order.failed",
      "PAYMENT_ERROR",
      "payment.failed",
    ];
    const FAILED_STATES = ["FAILED", "FAILURE", "PAYMENT_ERROR", "ERROR"];

    let paymentStatus: "SUCCESS" | "FAILED" | "PENDING" = "PENDING";
    if (
      SUCCESS_EVENTS.includes(event) ||
      (state && SUCCESS_STATES.includes(state))
    ) {
      paymentStatus = "SUCCESS";
    } else if (
      FAILED_EVENTS.includes(event) ||
      (state && FAILED_STATES.includes(state))
    ) {
      paymentStatus = "FAILED";
    }

    // Extract payment detail for enriched data
    const paymentDetail = paymentDetails?.[0] || {};
    const phonepeTransactionId = paymentDetail.transactionId as string | undefined;
    const paymentMode = paymentDetail.paymentMode as string | undefined;
    const errorCode = paymentDetail.errorCode as string | undefined;
    const detailedErrorCode = paymentDetail.detailedErrorCode as string | undefined;

    // 4. Find matching payment_transaction in Firestore
    const txSnap = await db
      .collection("payment_transactions")
      .where("merchant_transaction_id", "==", merchantOrderId)
      .limit(1)
      .get();

    if (txSnap.empty) {
      console.error(
        "[phonePeWebhook] No transaction found for:",
        merchantOrderId
      );
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    const txDoc = txSnap.docs[0];
    const transactionData = txDoc.data();

    // 5. Update payment_transaction document
    await txDoc.ref.update({
      status: paymentStatus,
      phonepe_transaction_id: phonepeTransactionId || null,
      payment_method: paymentMode || null,
      response_code: errorCode || null,
      response_message: detailedErrorCode
        ? `${errorCode} - ${detailedErrorCode}`
        : errorCode || null,
      phonepe_response: body,
      updated_at: new Date().toISOString(),
    });

    console.log("[phonePeWebhook] Transaction updated:", txDoc.id);

    // 6. If payment successful → update order + deduct stock
    if (paymentStatus === "SUCCESS") {
      const orderId = transactionData.order_id as string | undefined;

      if (!orderId) {
        console.error("[phonePeWebhook] Transaction has no order_id");
        res.status(500).json({ error: "Transaction missing order_id" });
        return;
      }

      // Update order status
      const orderRef = db.collection("orders").doc(orderId);
      await orderRef.update({
        status: "paid",
        payment_id: merchantOrderId,
        updated_at: new Date().toISOString(),
      });

      console.log("[phonePeWebhook] Order marked paid:", orderId);

      // Deduct stock for each item in the order
      try {
        const orderSnap = await orderRef.get();
        const orderData = orderSnap.data();
        const items = (orderData?.items || []) as Array<{
          productId?: string;
          product_id?: string;
          quantity?: number;
        }>;

        if (items.length > 0) {
          const batch = db.batch();
          for (const item of items) {
            const productId = item.productId || item.product_id;
            const qty = item.quantity || 1;
            if (productId) {
              const productRef = db.collection("products").doc(productId);
              // Use FieldValue.increment for safe concurrent decrement
              batch.update(productRef, {
                stock: admin.firestore.FieldValue.increment(-qty),
              });
            }
          }
          await batch.commit();
          console.log("[phonePeWebhook] Stock deducted for", items.length, "items");
        }
      } catch (stockErr) {
        // Log but don't fail — order is already paid
        console.error("[phonePeWebhook] Stock deduction error:", stockErr);
      }
    } else if (paymentStatus === "FAILED") {
      console.log(
        "[phonePeWebhook] Payment failed — order remains in pending state"
      );
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      merchantOrderId,
      status: paymentStatus,
    });
  } catch (err) {
    console.error("[phonePeWebhook] Fatal error:", err);
    res.status(500).json({
      error: "Internal server error",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /telegram-notify  (HTTP endpoint — for manual testing if needed)
//  Also exposed as a Firestore onCreate trigger below.
// ─────────────────────────────────────────────────────────────────────────────
//  POST /send-email
//  Sends order confirmation emails to customers
// ─────────────────────────────────────────────────────────────────────────────
app.post("/send-email", async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      customerEmail,
      customerName,
      totalPrice,
      orderItems,
      address,
      paymentMethod,
      emailType = "confirmation",
      trackingNumber,
      carrierName,
      estimatedDeliveryDate,
    } = req.body as Record<string, unknown>;

    // Validate required fields
    if (!orderId || !customerEmail || !customerName) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: orderId, customerEmail, customerName",
      });
      return;
    }

    // Log SMTP configuration for debugging
    console.log("[Email] SMTP Config:", {
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER ? `${SMTP_USER.substring(0, 5)}***` : "MISSING",
      pass: SMTP_PASS ? "***" : "MISSING",
    });

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log("[Email] SMTP connection verified");
    } catch (smtpErr) {
      console.error("[Email] SMTP configuration error:", smtpErr);
      res.status(500).json({
        success: false,
        message: "Email service configuration error",
      });
      return;
    }

    // Build email HTML based on type
    let emailSubject = `Order Confirmed - #${String(orderId).slice(0, 8)}`;
    let emailHtml = "";

    if (emailType === "confirmation") {
      emailSubject = `Order Confirmed - #${String(orderId).slice(0, 8)}`;
      const itemsHtml = (Array.isArray(orderItems)
        ? (orderItems as Record<string, unknown>[])
        : []
      )
        .map(
          (item: Record<string, unknown>) =>
            `<tr><td style="padding:10px;border-bottom:1px solid #ddd;">${item.name}</td><td style="padding:10px;border-bottom:1px solid #ddd;">₹${item.price}</td></tr>`
        )
        .join("");

      emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #3b2a20;">Order Confirmation</h2>
          <p>Dear ${customerName},</p>
          <p>Thank you for your order! Here are your order details:</p>
          
          <table style="width:100%;border-collapse:collapse;">
            <tr style="background-color:#f5f5f5;">
              <th style="padding:10px;text-align:left;">Product</th>
              <th style="padding:10px;text-align:left;">Price</th>
            </tr>
            ${itemsHtml}
          </table>
          
          <p><strong>Total Amount:</strong> ₹${totalPrice}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
          <p><strong>Delivery Address:</strong> ${address}</p>
          
          <p>You can track your order using order ID: <strong>${orderId}</strong></p>
          
          <p>Thank you for choosing NewFit!</p>
        </body>
      </html>
      `;
    } else if (emailType === "shipped") {
      emailSubject = `Your Order #${String(orderId).slice(0, 8)} Has Been Shipped!`;
      emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #3b2a20;">Order Shipped</h2>
          <p>Dear ${customerName},</p>
          <p>Your order has been shipped!</p>
          
          <p><strong>Tracking Number:</strong> ${trackingNumber || "N/A"}</p>
          <p><strong>Carrier:</strong> ${carrierName || "N/A"}</p>
          <p><strong>Estimated Delivery:</strong> ${estimatedDeliveryDate || "Soon"}</p>
          
          <p>You can track your shipment using the tracking number above.</p>
          
          <p>Thank you for your patience!</p>
        </body>
      </html>
      `;
    } else if (emailType === "delivered") {
      emailSubject = `Your Order #${String(orderId).slice(0, 8)} Has Been Delivered!`;
      emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #3b2a20;">Order Delivered</h2>
          <p>Dear ${customerName},</p>
          <p>Great news! Your order has been delivered.</p>
          
          <p>We hope you enjoy your purchase. If you have any questions, please feel free to contact us.</p>
          
          <p>Thank you for shopping with NewFit!</p>
        </body>
      </html>
      `;
    }

    // Send email
    await transporter.sendMail({
      from: SMTP_USER,
      to: String(customerEmail),
      subject: emailSubject,
      html: emailHtml,
    });

    console.log(`[Email] Order confirmation email sent to ${customerEmail}`);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("[Email] Error sending email:", err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
app.post("/telegram-notify", async (req: Request, res: Response) => {
  try {
    const { record } = req.body as { record: Record<string, unknown> };
    if (!record) {
      res.status(400).json({ error: "No record provided" });
      return;
    }
    await sendTelegramNotification(record);
    res.status(200).json({ success: true, message: "Notification sent" });
  } catch (err) {
    console.error("[telegramNotify] Error:", err);
    res
      .status(500)
      .json({
        error: err instanceof Error ? err.message : "Internal server error",
      });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Shared Telegram helper
// ─────────────────────────────────────────────────────────────────────────────
async function sendTelegramNotification(
  record: Record<string, unknown>
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Bot token or chat ID not configured — skipping");
    return;
  }

  const status = record.status as string;
  if (status === "pending" || status === "cancelled") {
    console.log(`[Telegram] Skipping notification — status is ${status}`);
    return;
  }

  let customerName = (record.customer_name as string) || "Customer";
  let customerEmail = (record.customer_email as string) || "N/A";
  let customerPhone = (record.customer_phone as string) || "N/A";

  // Try enriching from Firestore if data is missing
  const userId = record.user_id as string | undefined;
  if ((customerEmail === "N/A" || customerPhone === "N/A") && userId) {
    try {
      const userSnap = await db.collection("users").doc(userId).get();
      if (userSnap.exists) {
        const u = userSnap.data() as Record<string, unknown>;
        customerName = (u.full_name as string) || customerName;
        customerEmail = (u.email as string) || customerEmail;
        customerPhone = (u.phone as string) || customerPhone;
      }
    } catch (dbErr) {
      console.error("[Telegram] DB fetch error:", dbErr);
    }
  }

  const orderId = ((record.id as string) || "").slice(0, 8);
  const totalPrice = parseFloat(String(record.total_amount || record.total_price || 0)).toFixed(2);
  const paymentMethod =
    record.payment_method === "online"
      ? "💳 Online Payment"
      : "💵 Cash on Delivery";
  const address = (record.address as string) || "N/A";

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

⏰ *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

🔗 [View Order Details](${SITE_URL}/admin/dashboard)
`.trim();

  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const tRes = await fetch(telegramUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });

  const result = await tRes.json() as Record<string, unknown>;
  if (!tRes.ok) {
    console.error("[Telegram] API error:", result);
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }
  console.log("[Telegram] Notification sent for order:", record.id);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Export the Express app as a single HTTP function  → /api/*
// ─────────────────────────────────────────────────────────────────────────────
export const api = functions.https.onRequest(app);

// ─────────────────────────────────────────────────────────────────────────────
//  Firestore trigger: when a new order document is created → send Telegram
//  Automatically notifies for successful orders (confirmed COD or online payment)
// ─────────────────────────────────────────────────────────────────────────────
export const onNewOrder = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap) => {
    const orderData = snap.data() as Record<string, unknown>;
    // Inject the document ID as `id` so the helper can use it
    orderData.id = snap.id;
    try {
      await sendTelegramNotification(orderData);
    } catch (error) {
      console.error("[onNewOrder] Telegram notification failed:", error);
    }
  });
