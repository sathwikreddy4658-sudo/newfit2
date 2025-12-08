-- Enable pg_net extension for webhook calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the telegram notification trigger function with correct webhook URL
CREATE OR REPLACE FUNCTION notify_telegram_new_order()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  -- For UPDATE events, only trigger if status changed to confirmed/completed/paid
  IF TG_OP = 'UPDATE' THEN
    -- Skip if status didn't change to a confirmed state
    IF NEW.status NOT IN ('confirmed', 'completed', 'processing', 'paid', 'shipped', 'delivered') THEN
      RETURN NEW;
    END IF;
    -- Skip if status was already the same (avoid duplicate notifications)
    IF OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Skip pending status on INSERT - we only notify non-pending orders
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    RETURN NEW;
  END IF;
  
  -- Set webhook URL to the actual Supabase function
  webhook_url := 'https://osromibanfzzthdmhyzp.supabase.co/functions/v1/telegram-order-notification';
  
  -- Call the Edge Function asynchronously using pg_net extension
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists and is active
DROP TRIGGER IF EXISTS telegram_order_notification_trigger ON orders;

CREATE TRIGGER telegram_order_notification_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_telegram_new_order();

COMMENT ON TRIGGER telegram_order_notification_trigger ON orders IS 
  'Automatically sends Telegram notification when order is placed (non-pending) or status is updated to confirmed/paid/shipped/delivered';

-- Test log to verify trigger is set up
-- You can check this by running: SELECT * FROM pg_trigger WHERE tgname = 'telegram_order_notification_trigger';
