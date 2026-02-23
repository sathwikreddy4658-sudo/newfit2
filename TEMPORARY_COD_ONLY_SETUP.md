# Temporary Checkout Without PhonePe (COD Only)

If you can't deploy edge functions yet, here's how to temporarily disable online payments:

## Quick Fix (5 minutes)

Go to your checkout page component and comment out the online payment option:

### File: `src/pages/CheckoutPage.tsx` or similar

Find the payment method selection and hide PhonePe:

```typescript
// Temporarily hide online payment option
{/* <div>
  <input type="radio" value="online" ... />
  <label>Online Payment (PhonePe)</label>
</div> */}

// Keep COD visible
<div>
  <input type="radio" value="cod" ... />
  <label>Cash on Delivery</label>
</div>
```

## What Works Now (Without Edge Functions)

✅ **Cash on Delivery (COD)**
- Creates order successfully
- Uses `confirm_cod_order` database function
- No edge functions needed

❌ **Online Payment (PhonePe)**
- Requires edge functions deployed
- Will show CORS error without deployment

## Important: Database Functions Still Needed

Even for COD, you MUST run `DEPLOY_ALL_CHECKOUT_FUNCTIONS.sql`:

1. Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/sql
2. Copy all content from `DEPLOY_ALL_CHECKOUT_FUNCTIONS.sql`
3. Paste and run
4. Wait for "Success" message

This creates:
- `create_order_with_items` function (used by COD)
- `confirm_cod_order` function (used by COD)
- Required database columns
- Order status enum with "confirmed"

## When Edge Functions Are Deployed

1. Uncomment the online payment option
2. Add the 4 PhonePe secrets in Supabase Dashboard
3. Test online payment flow

## Testing COD Now

```javascript
// In browser console on checkout page:
// 1. Add products to cart
// 2. Fill in address details
// 3. Select "Cash on Delivery"
// 4. Click "Place Order"
// 5. Should redirect to thank you page
```

## Need Help?

Share the exact error you're getting with CLI deployment and I can help troubleshoot!
