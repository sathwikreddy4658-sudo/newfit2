-- Add 'confirmed' status to order_status enum for COD orders
-- This allows COD orders to be marked as confirmed

-- Check if 'confirmed' status already exists, if not add it
DO $$ 
BEGIN
    -- Add 'confirmed' to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'confirmed' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'order_status'
        )
    ) THEN
        ALTER TYPE order_status ADD VALUE 'confirmed';
    END IF;
END $$;
