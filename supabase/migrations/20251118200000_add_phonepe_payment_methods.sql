-- Add additional PhonePe payment methods to the enum
-- PhonePe supports: UPI, Credit Cards, Debit Cards, Net Banking, and Digital Wallets

DO $$
BEGIN
    -- Add UPI variants
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'UPI_QR' AND enumtypid = 'public.payment_method'::regtype) THEN
            ALTER TYPE public.payment_method ADD VALUE 'UPI_QR';
        END IF;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'UPI_COLLECT' AND enumtypid = 'public.payment_method'::regtype) THEN
            ALTER TYPE public.payment_method ADD VALUE 'UPI_COLLECT';
        END IF;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'UPI_INTENT' AND enumtypid = 'public.payment_method'::regtype) THEN
            ALTER TYPE public.payment_method ADD VALUE 'UPI_INTENT';
        END IF;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    -- Add Card types
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DEBIT_CARD' AND enumtypid = 'public.payment_method'::regtype) THEN
            ALTER TYPE public.payment_method ADD VALUE 'DEBIT_CARD';
        END IF;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CREDIT_CARD' AND enumtypid = 'public.payment_method'::regtype) THEN
            ALTER TYPE public.payment_method ADD VALUE 'CREDIT_CARD';
        END IF;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    -- Add Unknown fallback
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'UNKNOWN' AND enumtypid = 'public.payment_method'::regtype) THEN
            ALTER TYPE public.payment_method ADD VALUE 'UNKNOWN';
        END IF;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END$$;

-- Add comment
COMMENT ON TYPE public.payment_method IS 'Payment methods supported by PhonePe: UPI (QR/Collect/Intent), Cards (Debit/Credit), Net Banking, Wallet, and Pay Page';
