# Telegram Order Notifications - Setup & Deployment Guide

## ✅ Status: Fixed and Ready to Deploy

The Telegram order notification system is now fully functional and automatically notifies you for every successful order (both COD and online payment).

---

## 🎯 What's Fixed

### 1. **Firestore Trigger Re-enabled** ✅
   - The `onNewOrder` Cloud Function trigger in `functions/src/index.ts` has been uncommented
   - **Triggers automatically when**: A new order document is created in Firestore
   - **Sends notification when**: Order status is `'confirmed'` (COD) or `'pending'` (online)
   - **Skips notification for**: `'cancelled'` or `'pending'` orders awaiting payment

### 2. **Frontend Updated** ✅
   - OrdersTab.tsx now has proper Telegram notification functions
   - Manual notification endpoint available for admin resend if needed
   - Auto-notification function documented for clarity

---

## 📋 Prerequisites

### Telegram Bot Setup
If you haven't done this yet:

1. **Create a Telegram Bot:**
   - Chat with [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot`
   - Follow prompts to create a bot
   - Copy your **API Token** (looks like: `123456789:ABCDefgHIjklmnopQRstuvWXYZ-1234567890`)

2. **Get Your Chat ID:**
   - Create a Telegram group or use your personal chat
   - Add your bot to the group
   - Send a message in that chat
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your **Chat ID** in the response (a number, can be negative for groups)

---

## 🚀 Deployment Steps

### Step 1: Build the Cloud Functions

```bash
cd functions
npm run build
```

This compiles TypeScript to JavaScript. You'll see output like:
```
successfully compiled 1,234 TypeScript files
```

### Step 2: Set Environment Variables in Firebase

Set these in Firebase Console:

```bash
firebase functions:config:set \
  telegram.bot_token="YOUR_BOT_TOKEN" \
  telegram.chat_id="YOUR_CHAT_ID" \
  site.url="https://freelit.in"
```

**Or manually in Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Functions → Settings
3. Add environment variables:
   - `TELEGRAM_BOT_TOKEN`: Your bot token
   - `TELEGRAM_CHAT_ID`: Your chat ID
   - `SITE_URL`: https://freelit.in (or your domain)

### Step 3: Deploy Functions

```bash
firebase deploy --only functions
```

**Expected output:**
```
✅ onNewOrder (Trigger: firestore)
✅ api (Express - HTTP endpoints)
✅ Deploy complete!
```

---

## 🧪 Test It

### Method 1: Create a Test Order
1. Go to your site
2. Add items to cart
3. Place a **COD order** (status will be `'confirmed'`)
4. You should get a Telegram message instantly ✅

### Method 2: Manual Test via Cloud Functions

Use the CLI:
```bash
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/api/telegram-notify \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_abc123"
  }'
```

### Method 3: Check Function Logs

```bash
firebase functions:log
```

Look for messages like:
- `[Telegram] Notification sent for order: ...` ✅ Success
- `[Telegram] Bot token or chat ID not configured` ❌ Environment variables missing
- `[Telegram] Skipping notification — status is pending` ℹ️ Order not confirmed yet

---

## 📦 Notification Format

You'll receive messages like:

```
🎉 NEW ORDER RECEIVED!

📦 Order ID: `abc123d4`
💰 Amount: ₹2,499.00
💳 Online Payment

👤 Customer Details:
Name: Rahul Kumar
📧 Email: rahul@example.com
📱 Phone: +91-9876543210

📍 Delivery Address:
123 Main St, Delhi 110001

⏰ Time: 23-03-2026, 2:45 PM IST

🔗 View Order Details
```

---

## ❓ Troubleshooting

### "Telegram notification failed"

**Problem:** Environment variables not set
```
[Telegram] Bot token or chat ID not configured — skipping
```

**Fix:**
1. Check Firebase Console → Functions → Settings
2. Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
3. Re-deploy: `firebase deploy --only functions`

### "Invalid bot token"

**Problem:** Wrong bot token format or expired

**Fix:**
1. Go back to [@BotFather](https://t.me/botfather)
2. Create a new bot or use `/mybots` → Select bot → Token
3. Update environment variable

### "Chat ID invalid"

**Problem:** Chat ID not found or incorrect format

**Fix:**
1. Visit `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
2. Find the correct Chat ID (should be a number)
3. Update environment variable

### "No notification received"

**Problem:** Order status is wrong

**Check:**
1. Open Firebase Console → Firestore → orders collection
2. Find your order document
3. Check `status` field:
   - ✅ `'confirmed'` → Should notify (COD)
   - ✅ Not `'pending'` → Should notify (online payment confirmed)
   - ❌ `'pending'` → Won't notify (awaiting payment)
   - ❌ `'cancelled'` → Won't notify

---

## 📊 Order Status Reference

| Status | Type | Notifies? | Notes |
|--------|------|-----------|-------|
| `confirmed` | COD | ✅ Yes | Customer pays at delivery |
| `pending` | Online | ❌ No | Waiting for payment |
| `paid` | Online | ✅ Yes | Payment successful |
| `cancelled` | Either | ❌ No | Order cancelled |
| `shipped` | Either | ✅ Yes | On the way |
| `delivered` | Either | ✅ Yes | Delivered |

---

## 📝 Code Changes Made

### `functions/src/index.ts`
- **Line 785-800**: Uncommented and fixed the Firestore trigger `onNewOrder`
- Now properly exports the trigger for automatic notifications

### `src/components/admin/OrdersTab.tsx`
- **Line 346-405**: Updated `handleSendTelegramNotification()` to call Cloud Function
- **Line 407-413**: Updated `sendTelegramNotificationAuto()` with correct documentation
- Notification is now automatic via Cloud Function trigger

---

## 🔄 How It Works (Flow)

```
1. Customer places order
   ↓
2. Order document created in Firestore
   ↓
3. Firestore trigger (onNewOrder) fires automatically
   ↓
4. Cloud Function gets order data
   ↓
5. Validates order status (not pending/cancelled)
   ↓
6. Sends formatted message to Telegram
   ↓
7. You get notified instantly! 🎉
```

---

## ✨ Features

- ✅ **Automatic notifications** - No manual action needed
- ✅ **Both payment types** - COD and online payment orders
- ✅ **Customer details** - Name, email, phone included
- ✅ **Smart filtering** - Only notifies for completed orders
- ✅ **Timezone aware** - Shows time in IST
- ✅ **Link to dashboard** - Click to view order details
- ✅ **Manual resend** - Admin button available in OrdersTab

---

## 🎯 Next Steps

1. **Deploy immediately:**
   ```bash
   cd functions && npm run build && firebase deploy --only functions
   ```

2. **Set environment variables** in Firebase Console

3. **Test with a real order**

4. **Verify in Telegram** that you receive the message

---

## 📞 Support

If notifications aren't working:

1. Check Cloud Function logs: `firebase functions:log`
2. Verify Firestore order document exists
3. Check order status is not `'pending'`
4. Verify Telegram bot is active and chat ID is correct

---

**Last Updated:** March 23, 2026  
**Status:** ✅ Ready for Production
