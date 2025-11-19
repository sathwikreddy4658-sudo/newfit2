-- Update RLS policies to allow upsert operations

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.pincodes;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.pincodes;

-- Create new policies that allow anon to insert/update
CREATE POLICY "Allow insert for all" ON public.pincodes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for all" ON public.pincodes
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete for all" ON public.pincodes
  FOR DELETE
  USING (true);
