# Enable Automatic Telegram Notifications for Orders

## What This Does
Automatically sends Telegram notifications whenever an order is placed (if it's not pending) or when an order status is updated to confirmed/paid/shipped/delivered.

## How to Set It Up

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `osromibanfzzthdmhyzp`

2. **Enable pg_net Extension**
   - Go to: **SQL Editor**
   - Click **New Query**
   - Paste this and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

3. **Update Telegram Notification Trigger**
   - Still in SQL Editor, click **New Query** again
   - Copy the entire content from:
     `supabase/migrations/20251208_enable_telegram_webhook.sql`
   - Paste and run it

4. **Verify It's Working**
   - Go to: **Table Editor** → **orders**
   - Create a test order with status "confirmed" or "paid" (not pending)
   - Wait 5-10 seconds
   - Check your Telegram group - you should receive the notification automatically!

### Option 2: Using Supabase CLI

```bash
cd /path/to/newfit2

# Push the migration to your Supabase project
npx supabase db push
```

## What Happens Now

✅ **On Order Placement:**
- If the order status is NOT "pending", Telegram notification is sent automatically

✅ **On Order Status Update:**
- If order is updated to: confirmed, paid, shipped, or delivered
- Telegram notification is sent automatically

✅ **Notification Content:**
- Order ID
- Amount
- Payment method
- Customer details (name, email, phone)
- Delivery address
- Timestamp

## Testing

1. **Test COD Order:**
   - Place a COD order through checkout
   - Order is created with status "confirmed"
   - ✅ Telegram notification sent automatically within seconds

2. **Test Online Payment Order:**
   - Place an online payment order
   - Order is created with status "pending"
   - ❌ No notification (pending orders don't notify)
   - After payment confirmation, status changes to "paid"
   - ✅ Telegram notification sent automatically

3. **Test Manual Admin Notification:**
   - Go to Admin → Orders
   - Find any non-pending order
   - Click "Send Telegram Notification" button
   - ✅ Manual notification sent immediately

## Troubleshooting

**Issue: Notifications not sending automatically**

1. Check if pg_net extension is enabled:
   ```sql
   -- Go to Supabase SQL Editor and run:
   SELECT extname FROM pg_extension WHERE extname = 'pg_net';
   -- Should return one row with 'pg_net'
   ```

2. Verify the trigger exists:
   ```sql
   -- Go to Supabase SQL Editor and run:
   SELECT * FROM pg_trigger WHERE tgname = 'telegram_order_notification_trigger';
   -- Should return one row
   ```

3. Check Supabase Edge Function logs:
   - Go to: **Edge Functions** → **telegram-order-notification**
   - Check the logs for errors

4. Verify environment variables in Supabase:
   - Go to: **Project Settings** → **Edge Functions**
   - Make sure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set

## Files Modified

- `supabase/migrations/20251208_enable_telegram_webhook.sql` - Webhook trigger setup

## Next Steps

After setting up:
1. Test by placing a COD order
2. Verify Telegram notification arrives automatically
3. Share the success with your team!
