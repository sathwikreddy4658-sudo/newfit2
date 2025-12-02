-- Create Database Webhook to trigger Telegram notifications
-- This triggers the Edge Function whenever a new order is inserted

-- First, create the webhook trigger function
CREATE OR REPLACE FUNCTION notify_telegram_new_order()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  -- Get the webhook URL from environment or use default
  -- You'll replace this with your actual Supabase function URL after deployment
  webhook_url := 'YOUR_SUPABASE_URL/functions/v1/telegram-order-notification';
  
  -- Call the Edge Function asynchronously using pg_net extension
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on orders table
DROP TRIGGER IF EXISTS telegram_order_notification_trigger ON orders;

CREATE TRIGGER telegram_order_notification_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_telegram_new_order();

COMMENT ON TRIGGER telegram_order_notification_trigger ON orders IS 
  'Sends Telegram notification via Edge Function when new order is placed';
