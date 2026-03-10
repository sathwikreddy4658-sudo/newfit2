"use strict";
/**
 * Firebase Cloud Functions — NewFit Payment & Notification Backend
 *
 * Replaces Supabase Edge Functions:
 *   phonepe-initiate      → POST /api/phonepe-initiate
 *   phonepe-check-status  → POST /api/phonepe-check-status
 *   phonepe-webhook       → POST /api/phonepe-webhook  (called by PhonePe)
 *   telegram notification → Firestore onCreate trigger on orders/{orderId}
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNewOrder = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto = __importStar(require("crypto"));
// ─── Firebase Admin init ─────────────────────────────────────────────────────
admin.initializeApp();
const db = admin.firestore();
// ─── Environment variables ─────────────────────────────────────────────────────
// Read from process.env — set via functions/.env (local) or Firebase environment config
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "";
const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID || "";
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || "";
const PHONEPE_ENV = process.env.PHONEPE_ENV || "PRODUCTION";
const PHONEPE_API_URL = process.env.PHONEPE_API_URL || "https://api.phonepe.com/apis/pg";
// PhonePe Webhook credentials (used to verify incoming webhooks)
const PHONEPE_WEBHOOK_USERNAME = process.env.PHONEPE_WEBHOOK_USERNAME || "";
const PHONEPE_WEBHOOK_PASSWORD = process.env.PHONEPE_WEBHOOK_PASSWORD || "";
// Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const SITE_URL = process.env.SITE_URL || "https://freelit.in";
// ─── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Compute SHA-256 hex digest of a string (synchronous via Node crypto)
 */
function sha256Hex(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}
/**
 * Encode a plain object as application/x-www-form-urlencoded
 */
function urlEncode(obj) {
    return new URLSearchParams(obj).toString();
}
/**
 * Get (or refresh) a PhonePe OAuth access token.
 * Stateless — always fetches fresh, suitable for serverless.
 */
async function getPhonePeAccessToken() {
    const oauthUrl = PHONEPE_ENV === "PRODUCTION"
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
    const data = await res.json();
    if (!res.ok || !data.access_token) {
        throw new Error(`PhonePe OAuth failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return {
        access_token: data.access_token,
        token_type: data.token_type || "O-Bearer",
    };
}
// ─── CORS middleware ───────────────────────────────────────────────────────────
const corsOptions = (0, cors_1.default)({
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
const app = (0, express_1.default)();
// Explicitly handle OPTIONS preflight for all routes BEFORE other middleware.
// Without this, preflight requests fall through to Express routing and return
// a response with no CORS headers, causing the browser to block the request.
app.options("*", corsOptions);
app.use(corsOptions);
app.use(express_1.default.json());
// ─────────────────────────────────────────────────────────────────────────────
//  POST /phonepe-initiate
//  Initiates a PhonePe payment via v2 API and returns a redirect URL.
// ─────────────────────────────────────────────────────────────────────────────
app.post("/phonepe-initiate", async (req, res) => {
    var _a;
    try {
        const { merchantTransactionId, amount, callbackUrl, redirectUrl, mobileNumber, billingAddress, } = req.body;
        // Validate required fields
        const missingFields = [];
        if (!merchantTransactionId)
            missingFields.push("merchantTransactionId");
        if (amount === undefined || amount === null)
            missingFields.push("amount");
        if (!callbackUrl)
            missingFields.push("callbackUrl");
        if (!redirectUrl)
            missingFields.push("redirectUrl");
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
        const finalBillingAddress = typeof billingAddress === "string" && billingAddress.length >= 10
            ? billingAddress.substring(0, 500)
            : "Default Address - Payment Processing";
        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantOrderId: merchantTransactionId,
            amount: Math.round(amount * 100), // convert to paise
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
        const paymentUrl = PHONEPE_ENV === "PRODUCTION"
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
        const data = await paymentRes.json();
        if (!paymentRes.ok) {
            res.status(paymentRes.status).json({
                success: false,
                code: "PAYMENT_API_ERROR",
                message: data.message ||
                    data.errorMsg ||
                    "Failed to initiate payment",
                details: data,
            });
            return;
        }
        const finalRedirectUrl = ((_a = data.data) === null || _a === void 0 ? void 0 : _a.redirectUrl) ||
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
    }
    catch (err) {
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
app.post("/phonepe-check-status", async (req, res) => {
    try {
        const { merchantTransactionId } = req.body;
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
        const doRequest = async (token) => fetch(statusUrl, {
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
        const data = await statusRes.json();
        if (!statusRes.ok) {
            res.status(statusRes.status).json({
                success: false,
                code: "PAYMENT_API_ERROR",
                message: data.message || "Failed to check payment status",
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
    }
    catch (err) {
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
app.post("/phonepe-webhook", async (req, res) => {
    try {
        // 1. Verify Authorization header (SHA256 of "username:password")
        const authHeader = req.headers["authorization"];
        const expectedAuth = sha256Hex(`${PHONEPE_WEBHOOK_USERNAME}:${PHONEPE_WEBHOOK_PASSWORD}`);
        if (!authHeader || authHeader !== expectedAuth) {
            console.error("[phonePeWebhook] Unauthorized — bad auth header");
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // 2. Parse webhook body
        const body = req.body;
        console.log("[phonePeWebhook] Payload:", JSON.stringify(body));
        const event = body.event;
        const payload = body.payload;
        const merchantOrderId = payload === null || payload === void 0 ? void 0 : payload.merchantOrderId;
        const state = payload === null || payload === void 0 ? void 0 : payload.state;
        const paymentDetails = payload === null || payload === void 0 ? void 0 : payload.paymentDetails;
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
        let paymentStatus = "PENDING";
        if (SUCCESS_EVENTS.includes(event) ||
            (state && SUCCESS_STATES.includes(state))) {
            paymentStatus = "SUCCESS";
        }
        else if (FAILED_EVENTS.includes(event) ||
            (state && FAILED_STATES.includes(state))) {
            paymentStatus = "FAILED";
        }
        // Extract payment detail for enriched data
        const paymentDetail = (paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails[0]) || {};
        const phonepeTransactionId = paymentDetail.transactionId;
        const paymentMode = paymentDetail.paymentMode;
        const errorCode = paymentDetail.errorCode;
        const detailedErrorCode = paymentDetail.detailedErrorCode;
        // 4. Find matching payment_transaction in Firestore
        const txSnap = await db
            .collection("payment_transactions")
            .where("merchant_transaction_id", "==", merchantOrderId)
            .limit(1)
            .get();
        if (txSnap.empty) {
            console.error("[phonePeWebhook] No transaction found for:", merchantOrderId);
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
            const orderId = transactionData.order_id;
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
                const items = ((orderData === null || orderData === void 0 ? void 0 : orderData.items) || []);
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
            }
            catch (stockErr) {
                // Log but don't fail — order is already paid
                console.error("[phonePeWebhook] Stock deduction error:", stockErr);
            }
        }
        else if (paymentStatus === "FAILED") {
            console.log("[phonePeWebhook] Payment failed — order remains in pending state");
        }
        res.status(200).json({
            success: true,
            message: "Webhook processed successfully",
            merchantOrderId,
            status: paymentStatus,
        });
    }
    catch (err) {
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
app.post("/telegram-notify", async (req, res) => {
    try {
        const { record } = req.body;
        if (!record) {
            res.status(400).json({ error: "No record provided" });
            return;
        }
        await sendTelegramNotification(record);
        res.status(200).json({ success: true, message: "Notification sent" });
    }
    catch (err) {
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
async function sendTelegramNotification(record) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("[Telegram] Bot token or chat ID not configured — skipping");
        return;
    }
    const status = record.status;
    if (status === "pending" || status === "cancelled") {
        console.log(`[Telegram] Skipping notification — status is ${status}`);
        return;
    }
    let customerName = record.customer_name || "Customer";
    let customerEmail = record.customer_email || "N/A";
    let customerPhone = record.customer_phone || "N/A";
    // Try enriching from Firestore if data is missing
    const userId = record.user_id;
    if ((customerEmail === "N/A" || customerPhone === "N/A") && userId) {
        try {
            const userSnap = await db.collection("users").doc(userId).get();
            if (userSnap.exists) {
                const u = userSnap.data();
                customerName = u.full_name || customerName;
                customerEmail = u.email || customerEmail;
                customerPhone = u.phone || customerPhone;
            }
        }
        catch (dbErr) {
            console.error("[Telegram] DB fetch error:", dbErr);
        }
    }
    const orderId = (record.id || "").slice(0, 8);
    const totalPrice = parseFloat(String(record.total_price || 0)).toFixed(2);
    const paymentMethod = record.payment_method === "online"
        ? "💳 Online Payment"
        : "💵 Cash on Delivery";
    const address = record.address || "N/A";
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
    const result = await tRes.json();
    if (!tRes.ok) {
        console.error("[Telegram] API error:", result);
        throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }
    console.log("[Telegram] Notification sent for order:", record.id);
}
// ─────────────────────────────────────────────────────────────────────────────
//  Export the Express app as a single HTTP function  → /api/*
// ─────────────────────────────────────────────────────────────────────────────
// Gen 2 HTTP function with configuration
exports.api = (0, https_1.onRequest)({
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 10,
}, app);
// ─────────────────────────────────────────────────────────────────────────────
//  Firestore trigger: when a new order document is created → send Telegram
// ─────────────────────────────────────────────────────────────────────────────
exports.onNewOrder = (0, firestore_1.onDocumentCreated)("orders/{orderId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const orderData = snap.data();
    // Inject the document ID as `id` so the helper can use it
    orderData.id = snap.id;
    await sendTelegramNotification(orderData);
});
//# sourceMappingURL=index.js.map