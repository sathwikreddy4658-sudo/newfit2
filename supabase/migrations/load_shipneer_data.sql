-- Update Shipneer pincodes data in table
-- This script shows how to populate the pincodes table with Shipneer CSV data
-- The CSV should have these columns: pincode, state, district, delivery, cod

-- STEP 1: If you have the CSV ready, use Supabase CSV import
-- Go to: Supabase Console → SQL Editor → Import data from CSV
-- And upload your Shipneer pincodes CSV file

-- STEP 2: Once imported, you can verify the data:
SELECT COUNT(*) as total_pincodes FROM pincodes;
SELECT COUNT(*) as deliverable FROM pincodes WHERE delivery = 'Y';
SELECT COUNT(*) as cod_available FROM pincodes WHERE cod = 'Y';

-- STEP 3: Check a specific pincode (replace 560001 with your test pincode)
SELECT pincode, state, district, delivery, cod FROM pincodes WHERE pincode = 560001;

-- STEP 4: If you need to update delivery status for pincodes:
-- This updates all pincodes with delivery = 'Y' to have delivery_available = true
UPDATE pincodes SET delivery_available = true WHERE delivery = 'Y';
UPDATE pincodes SET cod_available = true WHERE cod = 'Y';

-- STEP 5: Test specific pincodes
-- Replace with your actual test pincodes
SELECT pincode, state, district, delivery, cod 
FROM pincodes 
WHERE pincode IN (560001, 500067, 110001, 400001, 700001)
ORDER BY pincode;

-- STEP 6: Find all deliverable pincodes in a specific state
SELECT pincode, state, district, delivery, cod 
FROM pincodes 
WHERE state = 'KARNATAKA' AND delivery = 'Y'
LIMIT 10;

-- STEP 7: Find pincodes with COD available
SELECT pincode, state, district, delivery, cod 
FROM pincodes 
WHERE cod = 'Y'
LIMIT 10;

-- STEP 8: Check pincodes where delivery is available but COD is not
SELECT pincode, state, district, delivery, cod 
FROM pincodes 
WHERE delivery = 'Y' AND cod = 'N'
LIMIT 10;
