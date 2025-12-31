# 🚀 Manual Deployment Steps for Telegram Notification Fix

Since Docker is not running, please follow these manual steps:

---

## Step 1: Deploy the Edge Function via Supabase Dashboard

### Option A: Using Supabase CLI (if you have it set up)
```bash
# Make sure you're logged in
supabase login

# Deploy the function
supabase functions deploy telegram-order-notification --project-ref osromibanfzzthdmhyzp
```

### Option B: Using Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/functions
2. Click on **telegram-order-notification** function
3. Click **Edit Function**
4. Copy the entire content from: `supabase/functions/telegram-order-notification/index.ts`
5. Paste it in the editor
6. Click **Deploy**

---

## Step 2: Run the Database Migration

1. Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql/new
2. Copy and paste this SQL:

```sql
-- Fix Telegram notifications for COD and online payment orders
-- This migration ensures notifications are sent for confirmed and paid orders

-- Drop existing trigger to recreate it
DROP TRIGGER IF EXISTS telegram_order_notification_trigger ON orders;

-- Recreate the notification function with better logging and error handling
CREATE OR REPLACE FUNCTION notify_telegram_new_order()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  request_id bigint;
BEGIN
  -- Log the trigger event for debugging
  RAISE NOTICE 'Telegram trigger fired: TG_OP=%, OLD.status=%, NEW.status=%', 
    TG_OP, 
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status;
  
  -- For UPDATE events, only trigger if status changed to a confirmed state
  IF TG_OP = 'UPDATE' THEN
    -- Skip if status didn't change
    IF OLD.status = NEW.status THEN
      RAISE NOTICE 'Skipping: Status unchanged (%)' , NEW.status;
      RETURN NEW;
    END IF;
    
    -- Only notify for these statuses
    IF NEW.status NOT IN ('confirmed', 'paid', 'shipped', 'delivered', 'processing', 'completed') THEN
      RAISE NOTICE 'Skipping: Status not in notification list (%)' , NEW.status;
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Sending notification: Status changed from % to %', OLD.status, NEW.status;
  END IF;
  
  -- For INSERT events, only notify for confirmed/paid orders (skip pending)
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' THEN
      RAISE NOTICE 'Skipping INSERT: Order is pending';
      RETURN NEW;
    END IF;
    
    IF NEW.status = 'cancelled' THEN
      RAISE NOTICE 'Skipping INSERT: Order is cancelled';
      RETURN NEW;
    END IF;
    
    RAISE NOTICE 'Sending notification: New order with status %', NEW.status;
  END IF;
  
  -- Set webhook URL to the Telegram notification Edge Function
  webhook_url := 'https://osromibanfzzthdmhyzp.supabase.co/functions/v1/telegram-order-notification';
  
  -- Call the Edge Function asynchronously using pg_net extension
  -- This returns immediately and doesn't block the transaction
  SELECT net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW),
      'event_type', TG_OP,
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
    )
  ) INTO request_id;
  
  RAISE NOTICE 'Telegram notification queued: request_id=%', request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error in telegram notification trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on orders table
CREATE TRIGGER telegram_order_notification_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_telegram_new_order();

COMMENT ON TRIGGER telegram_order_notification_trigger ON orders IS 
  'Sends Telegram notification when order is placed (confirmed/paid) or status is updated to confirmed/paid/shipped/delivered';

-- Verify the trigger was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'telegram_order_notification_trigger'
  ) THEN
    RAISE NOTICE '✅ Telegram notification trigger created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create telegram notification trigger';
  END IF;
END $$;
```

3. Click **Run** or press `Ctrl+Enter`
4. You should see: `✅ Telegram notification trigger created successfully`

---

## Step 3: Verify the Deployment

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if trigger exists and is enabled
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'telegram_order_notification_trigger';
```

**Expected Result:** One row showing the trigger is enabled

---

## Step 4: Test with a Real Order

### Test COD Order:
1. Go to your website
2. Add items to cart
3. Proceed to checkout
4. Select **Cash on Delivery (COD)**
5. Complete the order
6. **Check your Telegram** within 2-3 seconds
7. You should receive a notification!

### Test Online Payment Order:
1. Place an order with online payment
2. Complete the payment on PhonePe
3. **Check your Telegram** within 2-3 seconds after payment
4. You should receive a notification!

---

## 🔍 Troubleshooting

If notifications don't arrive, check:

### 1. Edge Function Logs
- Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/functions/telegram-order-notification/logs
- Look for any errors

### 2. Check Recent Orders
```sql
SELECT id, status, customer_name, created_at, updated_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Manually Test the Trigger
```sql
-- Update an existing order status to trigger notification
UPDATE orders
SET status = 'confirmed'
WHERE id = 'YOUR_ORDER_ID_HERE'
AND status = 'pending';
```

Replace `YOUR_ORDER_ID_HERE` with an actual order ID from your database.

---

## ✅ Success Indicators

- ✅ SQL migration runs without errors
- ✅ Trigger shows as enabled in database
- ✅ Edge Function is deployed
- ✅ COD orders send Telegram notifications
- ✅ Online payment orders send Telegram notifications
- ✅ Notifications arrive within 1-3 seconds

---

## 📞 Need Help?

If you encounter any issues:
1. Check the Edge Function logs
2. Check the database trigger status
3. Verify your Telegram bot token and chat ID are set correctly
4. Share any error messages you see

The fix is safe and won't affect any existing functionality!
