# Telegram Bot Setup Guide - Complete Instructions

## 🤖 Overview
Get instant Telegram notifications on your phone/desktop whenever a customer places an order - works 24/7 even when your computer is off!

---

## 📋 Part 1: Create Your Telegram Bot (5 minutes)

### Step 1: Open Telegram & Find BotFather
1. Open Telegram app on your phone or desktop
2. Search for: **@BotFather** (official bot with blue checkmark)
3. Start a chat with BotFather

### Step 2: Create New Bot
1. Send command: `/newbot`
2. BotFather asks: "Alright, a new bot. How are we going to call it?"
3. Type your bot name (e.g., **"My Store Order Bot"**)
4. BotFather asks: "Now choose a username for your bot"
5. Type username ending in "bot" (e.g., **"mystoreorder_bot"**)

### Step 3: Save Your Bot Token
BotFather will reply with something like:
```
Done! Congratulations on your new bot...
Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

**IMPORTANT:** Copy this token! You'll need it later.
It looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789`

---

## 📱 Part 2: Get Your Chat ID (2 minutes)

### Step 1: Start Chat with Your Bot
1. Click the link BotFather sent (t.me/yourbotname)
2. Click **"Start"** button
3. Send any message to your bot (e.g., "Hello")

### Step 2: Get Your Chat ID
**Option A: Use IDBot (Easiest)**
1. Search for: **@myidbot** in Telegram
2. Start chat and send: `/getid`
3. Bot replies with your Chat ID (e.g., `123456789`)
4. Copy this number

**Option B: Use Web Browser**
1. Open: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
2. Replace `<YOUR_BOT_TOKEN>` with your actual token
3. Look for `"chat":{"id":123456789`
4. That number is your Chat ID

---

## ⚙️ Part 3: Configure Supabase (10 minutes)

### Step 1: Add Environment Variables
1. Go to **Supabase Dashboard** → Your Project
2. Click **Settings** (⚙️ icon in sidebar)
3. Click **Edge Functions** in the left menu
4. Scroll to **Secrets** section
5. Click **"Add Secret"** and add these 3 secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather | `1234567890:ABCdefGHI...` |
| `TELEGRAM_CHAT_ID` | Your Chat ID from IDBot | `123456789` |
| `SITE_URL` | Your website URL | `https://yourstore.com` |

6. Click **Save** after adding each secret

### Step 2: Deploy Edge Function
**Via Supabase CLI (Recommended):**

1. Open PowerShell/Terminal
2. Navigate to your project folder:
   ```powershell
   cd C:\Users\Deekshitha\Desktop\recipes\newfreelitpro\newfit2
   ```

3. Login to Supabase (if not already):
   ```powershell
   npx supabase login
   ```

4. Link your project (if not already):
   ```powershell
   npx supabase link --project-ref your-project-ref
   ```
   (Find project-ref in Supabase Dashboard → Settings → General)

5. Deploy the function:
   ```powershell
   npx supabase functions deploy telegram-order-notification
   ```

6. You'll see output like:
   ```
   Deployed Function telegram-order-notification
   URL: https://yourproject.supabase.co/functions/v1/telegram-order-notification
   ```

7. **Copy this URL** - you'll need it in next step!

### Step 3: Update Database Trigger
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the migration file: `supabase/migrations/20251202_telegram_notification_trigger.sql`
3. Find the line:
   ```sql
   webhook_url := 'YOUR_SUPABASE_URL/functions/v1/telegram-order-notification';
   ```
4. Replace `YOUR_SUPABASE_URL` with your actual URL from Step 2
5. Example:
   ```sql
   webhook_url := 'https://abcdefgh.supabase.co/functions/v1/telegram-order-notification';
   ```
6. Copy the entire SQL file content
7. Paste in SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. You should see: "Success. No rows returned"

---

## 🧪 Part 4: Test Your Bot (2 minutes)

### Quick Test - Manual Trigger
1. Open Telegram and find your bot chat
2. Go to **Supabase Dashboard** → **SQL Editor**
3. Run this test query:
   ```sql
   -- Test the notification function
   SELECT notify_telegram_new_order();
   ```

### Full Test - Place Real Order
1. Open your website in a new browser tab
2. Add items to cart
3. Complete checkout as a customer
4. **Check your Telegram** - you should receive a message like:

```
🎉 NEW ORDER RECEIVED!

📦 Order ID: a1b2c3d4
💰 Amount: ₹899
💵 Cash on Delivery

👤 Customer Details:
Name: John Doe
📧 Email: john@example.com
📱 Phone: 9876543210

📍 Delivery Address:
123 Main Street, Mumbai, Maharashtra - 400001

⏰ Time: 12/2/2024, 3:45:30 PM

🔗 View Order Details
```

---

## ✅ Verification Checklist

- [ ] Created bot with BotFather
- [ ] Got bot token (starts with numbers, contains colon)
- [ ] Started chat with your bot (sent "Start")
- [ ] Got Chat ID (just numbers, no letters)
- [ ] Added 3 secrets to Supabase Edge Functions
- [ ] Deployed Edge Function via CLI
- [ ] Updated trigger SQL with correct URL
- [ ] Ran trigger SQL in SQL Editor
- [ ] Tested with real order
- [ ] Received Telegram notification

---

## 🎯 What You'll Get

### Every Time an Order is Placed:
1. **Instant notification** on your phone (1-2 seconds)
2. **Complete order details**:
   - Order ID
   - Total amount
   - Payment method
   - Customer name, email, phone
   - Delivery address
   - Timestamp
3. **Clickable link** to view full order in admin dashboard
4. **Message history** - all orders saved in chat

### Works When:
- ✅ Computer is off
- ✅ Browser is closed
- ✅ Website not open
- ✅ You're sleeping
- ✅ You're traveling
- ✅ No internet on your PC (phone needs internet)

---

## 🔧 Troubleshooting

### "Bot token is invalid"
**Cause:** Token copied incorrectly or expired
**Fix:**
1. Go back to BotFather
2. Send: `/mybots`
3. Select your bot
4. Click "API Token"
5. Copy the token again carefully

### "Chat ID not working"
**Cause:** Haven't started chat with bot or wrong ID
**Fix:**
1. Open your bot in Telegram
2. Click **Start** button
3. Send any message
4. Get Chat ID again using @myidbot

### "Not receiving notifications"
**Check:**
1. ✅ Bot token added to Supabase secrets?
2. ✅ Chat ID added to Supabase secrets?
3. ✅ Edge Function deployed successfully?
4. ✅ SQL trigger created (check SQL Editor history)?
5. ✅ Started chat with bot (clicked Start button)?

**Test the function manually:**
```powershell
# Test Edge Function directly
curl -X POST "https://yourproject.supabase.co/functions/v1/telegram-order-notification" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"record": {"id": "test123", "total_price": 100, "payment_method": "online", "name": "Test User", "email": "test@test.com", "phone": "1234567890", "address": "Test Address"}}'
```

### "Function deployed but not triggering"
**Check Supabase Logs:**
1. Go to **Edge Functions** → **telegram-order-notification**
2. Click **Logs** tab
3. Look for errors when order is placed
4. Common issues:
   - Missing environment variables
   - Wrong Telegram token/chat ID
   - Network/firewall issues

---

## 🚀 Advanced Configuration

### Multiple Notification Recipients
Want notifications to go to multiple people?

1. Create a **Telegram Group**:
   - Create new group in Telegram
   - Add your bot to the group
   - Make bot an admin
   
2. Get Group Chat ID:
   - Send a message in the group
   - Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Look for group chat ID (negative number like `-123456789`)
   
3. Update `TELEGRAM_CHAT_ID` in Supabase:
   - Use the group ID instead of personal chat ID

### Customize Message Format
Edit `supabase/functions/telegram-order-notification/index.ts`:

```typescript
// Change the message template (lines 27-47)
const message = `
🛍️ *YOUR CUSTOM TITLE*
// ... your custom format
`;
```

### Add Buttons to Messages
Add inline buttons for quick actions:

```typescript
body: JSON.stringify({
  chat_id: TELEGRAM_CHAT_ID,
  text: message,
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [[
      { text: "✅ Accept Order", callback_data: `accept_${orderId}` },
      { text: "❌ Cancel Order", callback_data: `cancel_${orderId}` }
    ]]
  }
}),
```

### Notification Sounds
Telegram allows custom notification sounds:
1. Open Telegram Settings
2. Notifications → Message Notifications
3. Set custom sound for your bot chat

---

## 💡 Pro Tips

1. **Pin Your Bot Chat**
   - Long-press bot chat → Pin
   - Never miss a notification

2. **Enable Notification Preview**
   - See order details in notification popup
   - Settings → Notifications → Show Preview

3. **Mute During Sleep**
   - Create notification schedule in Telegram
   - Settings → Notifications → Notification Exceptions

4. **Use Telegram Desktop**
   - Install on your work computer
   - Notifications appear even when phone is away

5. **Create Shortcuts**
   - Android: Long-press bot → Add to Home Screen
   - iOS: Share → Add to Home Screen

---

## 📊 Cost & Limits

### Telegram Bot API:
- **FREE** - No limits on messages
- **FREE** - No expiry
- **FREE** - Unlimited recipients

### Supabase Edge Functions:
- **FREE tier:** 500K invocations/month
- Each order = 1 invocation
- 500K orders/month before paid tier needed

---

## 🎉 You're Done!

Your Telegram bot is now active and will notify you instantly whenever orders are placed!

**Test it now:**
1. Place a test order on your website
2. Check your Telegram within 2 seconds
3. You should see the notification!

**Need help?** Check:
- Supabase Edge Function logs
- SQL Editor history (trigger created?)
- Telegram bot settings (token valid?)

---

## 📁 Files Created

1. `supabase/functions/telegram-order-notification/index.ts` - Edge Function
2. `supabase/migrations/20251202_telegram_notification_trigger.sql` - Database trigger
3. `TELEGRAM_BOT_SETUP.md` - This guide

**Enjoy your 24/7 order notifications! 🎉**
