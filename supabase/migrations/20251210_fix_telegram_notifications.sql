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
