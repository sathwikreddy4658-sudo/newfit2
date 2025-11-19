# Pincode Serviceability & Shipping Implementation

## Overview
This system enables you to validate customer pincodes at checkout, apply shipping charges, and manage COD availability based on Shipneer's deliverable pincodes list.

## Architecture

### 1. Database Table: `pincodes`
```
- id: Primary key
- pincode: Integer (unique, indexed)
- delivery_available: Boolean (Y/N from Excel)
- cod_available: Boolean (Y/N from Excel)
- city_state: Text (optional)
- shipping_charge: Decimal (will be calculated)
- estimated_days: Integer (delivery days)
```

### 2. Data Flow

```
Excel Sheet → Upload Script → Supabase (21,233 pincodes)
                                    ↓
                           Checkout Page
                                    ↓
                    User enters pincode → Validation
                                    ↓
                    Get shipping rate & COD availability
```

## Setup Steps

### Step 1: Create Database Table
```bash
# Option A: Using Supabase Dashboard
1. Go to Supabase → SQL Editor
2. Paste content of: supabase/migrations/create_pincodes_table.sql
3. Click "Run"

# Option B: Using Supabase CLI
supabase db push
```

### Step 2: Upload Pincodes from Excel
```bash
# First, ensure environment variables are set
# VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be available

# Then run:
node scripts/upload-pincodes-to-supabase.js
```

This will:
- Read the Excel file (21,233 pincodes)
- Transform the data
- Upload in batches (1000 at a time)
- Show progress and statistics

### Step 3: Add Custom Rates (Manual Approach)

Since Shipneer doesn't provide an API, you have two options:

#### Option A: Manual Rate Calculator (Recommended for now)
1. Use Shipneer's website rate calculator
2. Calculate rates for representative pincodes (maybe 50-100)
3. Group by regions/rate tiers
4. Update the SHIPPING_RATES configuration in `src/lib/pincodeService.ts`

#### Option B: Add Specific Pincode Rates
```javascript
// In pincodeService.ts, use addCustomRates() function:
addCustomRates([
  { pincode: 110001, charge: 50, estimatedDays: 2, codAvailable: true },
  { pincode: 110002, charge: 50, estimatedDays: 2, codAvailable: true },
  { pincode: 560001, charge: 80, estimatedDays: 3, codAvailable: true },
  // ... more pincodes
]);
```

### Step 4: Integrate into Checkout Page

Add the PincodeInput component to your checkout form:

```tsx
import PincodeInput from '@/components/PincodeInput';

export const CheckoutForm = () => {
  const [shippingCharge, setShippingCharge] = useState(0);
  const [codAvailable, setCodAvailable] = useState(false);

  return (
    <form>
      <PincodeInput
        onPincodeChange={(pincode) => console.log('Pincode:', pincode)}
        onRateUpdate={(rate) => {
          setShippingCharge(rate.charge);
        }}
        onCODAvailabilityChange={(available) => {
          setCodAvailable(available);
        }}
        required={true}
      />
      
      {/* Rest of checkout form */}
    </form>
  );
};
```

## Usage Guide

### For Checkout Validation
```typescript
import { validatePincodeForCheckout } from '@/lib/pincodeService';

// Check if pincode is serviceable for COD
const result = await validatePincodeForCheckout(560001, true);
if (result.valid) {
  console.log('✓ Delivery available and COD enabled');
} else {
  console.log('✗', result.message);
}
```

### For Getting Shipping Rate
```typescript
import { getShippingRate } from '@/lib/pincodeService';

const rate = await getShippingRate(560001);
console.log('Charge:', rate.charge);
console.log('Days:', rate.estimatedDays);
console.log('COD Available:', rate.codAvailable);
```

### For Checking Serviceability
```typescript
import { checkPincodeServiceability } from '@/lib/pincodeService';

const pincode = await checkPincodeServiceability(560001);
if (pincode && pincode.delivery_available) {
  console.log('✓ Serviceable');
}
```

## Current Approach (What You Have Now)

1. **Excel Data**: 21,233 pincodes with Y/N for Delivery & COD
2. **Basic Rate Logic**: Region-based (local/regional/national/remote)
3. **COD Control**: Disable COD for remote areas

## Recommended Next Steps

### Phase 1: Immediate (This Week)
- [ ] Create database table
- [ ] Upload pincodes from Excel
- [ ] Add PincodeInput component to checkout
- [ ] Test with sample pincodes

### Phase 2: Rate Configuration (Next Week)
- [ ] Use Shipneer rate calculator for 50-100 sample pincodes
- [ ] Group into rate tiers
- [ ] Update SHIPPING_RATES configuration
- [ ] Test shipping charge display

### Phase 3: COD Management (Future)
- [ ] Disable COD for pincodes marked as 'N' in Excel
- [ ] Show COD availability message in checkout
- [ ] Restrict payment methods based on pincode

### Phase 4: Scale (When You're Bigger)
- [ ] Negotiate API access with Shipneer for real-time rates
- [ ] Implement distance-based calculations
- [ ] Add zone-based pricing

## Troubleshooting

### Issue: "Cannot find pincodes table"
**Solution**: Run the SQL migration first

### Issue: "Upload script fails"
**Solution**: 
- Check SUPABASE_SERVICE_ROLE_KEY is set
- Ensure you have permission to insert into pincodes table
- Check file path to shipneer pincodes.xlsx

### Issue: "Slow pincode lookups"
**Solution**: 
- Ensure index on pincode column (created by migration)
- Batch queries if possible
- Consider caching frequent lookups

## File Locations

```
src/
├── lib/
│   └── pincodeService.ts          ← Main utility functions
├── components/
│   └── PincodeInput.tsx            ← Checkout component
└── pages/
    └── Checkout.tsx               ← Add PincodeInput here

scripts/
├── upload-pincodes.js             ← Excel reader (test)
└── upload-pincodes-to-supabase.js ← Upload to DB

supabase/
└── migrations/
    └── create_pincodes_table.sql   ← Database schema

shipneer pincodes.xlsx             ← Source data (root)
```

## Key Features

✅ Check if pincode is serviceable
✅ Get shipping charges based on regions
✅ Validate COD availability
✅ Prevent COD for restricted areas
✅ Show estimated delivery days
✅ Real-time validation at checkout
✅ Beautiful UI feedback

## Notes

- You have 21,233 pincodes to cover most of India
- COD availability is already in your data (Y/N)
- Shipping charges need to be calculated/configured
- Remote areas (no COD) can be identified automatically
- Solution scales as you grow - can integrate real API later

## Questions?

Feel free to ask if you need help with:
- Calculating shipping rates
- Integrating into AddressForm
- Testing the system
- Adjusting configurations
