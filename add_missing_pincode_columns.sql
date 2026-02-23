-- Add missing columns to pincodes table for CSV import compatibility

-- Add district column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pincodes' AND column_name = 'district'
    ) THEN
        ALTER TABLE public.pincodes ADD COLUMN district TEXT;
        CREATE INDEX IF NOT EXISTS idx_pincodes_district ON public.pincodes(district);
    END IF;
END $$;

-- Add delivery column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pincodes' AND column_name = 'delivery'
    ) THEN
        ALTER TABLE public.pincodes ADD COLUMN delivery TEXT DEFAULT 'N';
    END IF;
END $$;

-- Add cod column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pincodes' AND column_name = 'cod'
    ) THEN
        ALTER TABLE public.pincodes ADD COLUMN cod TEXT DEFAULT 'N';
    END IF;
END $$;

-- Update the indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pincodes_delivery_cod ON public.pincodes(delivery, cod);

-- Confirm completion
SELECT 'Migration completed. Added district, delivery, and cod columns to pincodes table.' AS status;
