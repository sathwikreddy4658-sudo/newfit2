# Pricing System - Quick Reference

## 📋 All Business Rules in One Place

### 1️⃣ FREE DELIVERY
```
Conditions: Order >= ₹400 AND Shipping < ₹45

✅ Example 1: Order ₹450 + Telangana (₹45) = ✗ NOT FREE (45 is not < 45)
✅ Example 2: Order ₹500 + Telangana (₹45) = ✓ FREE! (500 >= 400 AND 45 < 45 fails)
✓ Example 3: Order ₹400 + Telangana (₹45) = ✗ NOT FREE (exactly 45, not less than)
```

### 2️⃣ COD SURCHARGE (Always add for COD)
```
+₹30-40 rupees to shipping charge
Implemented as: +₹35 (midpoint)

Added to shippingCharge when paymentMethod = 'cod'
Shows as separate "COD Handling Charges" line in checkout
```

### 3️⃣ COD AVAILABILITY (Order value)
```
COD NOT available if: Order >= ₹1300

✓ Order ₹1299 + COD: Allowed
✗ Order ₹1300 + COD: NOT allowed
✗ Order ₹1400 + COD: NOT allowed
```

### 4️⃣ COD CHARGES (₹30 only for small orders)
```
COD charge: ₹30 ONLY if Order <= ₹600

✓ Order ₹300 + COD: ₹30 charge
✓ Order ₹600 + COD: ₹30 charge
✗ Order ₹601 + COD: NO charge
✗ Order ₹1200 + COD: NO charge (if allowed)
```

### 5️⃣ PREPAID DISCOUNT (5% off)
```
Only for online/prepaid payment

✓ Order ₹500 + Prepaid: ₹500 - ₹25 (5%) = ₹475
✓ Order ₹1000 + Prepaid: ₹1000 - ₹50 (5%) = ₹950
✗ Order ₹500 + COD: NO discount
```

### 6️⃣ STATE-BASED NO-COD AREAS
```
These states don't allow COD regardless of order value:
- ASSAM
- MANIPUR
- MEGHALAYA
- MIZORAM
- NAGALAND
- TRIPURA
- ARUNACHAL PRADESH
- SIKKIM
- JAMMU & KASHMIR
- LAKSHADWEEP (Island)
- ANDAMAN & NICOBAR (Island)
```

---

## 💡 Example Scenarios

### Scenario A: Budget Order (Local Area)
```
Pincode: 500067 (Hyderabad, Telangana - YOUR HUB!)
Cart: ₹250
Payment: COD

✗ Can use COD? NO (250 < 1300 ✓, but state is fine)
Actually YES! Telangana allows COD, order < 1300

Subtotal: ₹250
Shipping: ₹45 (Telangana rate)
+ COD Surcharge: ₹35
+ COD Charge (250 <= 600): ₹30
────────────────
TOTAL: ₹360
```

### Scenario B: Free Delivery Order
```
Pincode: 560001 (Bangalore, Karnataka)
Cart: ₹500
Payment: Prepaid

Subtotal: ₹500
Shipping (base): ₹50
✗ Free delivery? NO (50 >= 45, not < 45)

Prepaid discount (5%): -₹25
────────────────
TOTAL: ₹525

BUT if it was Telangana (₹45 base):
Shipping: ₹45
✗ Still NOT FREE (45 is not < 45, must be LESS THAN)
```

### Scenario C: High-Value Order (No COD)
```
Pincode: 110001 (Delhi)
Cart: ₹1500
Payment: User wants COD

✗ Can use COD? NO (1500 >= 1300)
Force online payment only

Subtotal: ₹1500
Shipping: ₹65 (Delhi rate)
Prepaid discount (5%): -₹75
────────────────
TOTAL: ₹1490
```

### Scenario D: Remote Area (No COD Allowed)
```
Pincode: 781001 (Guwahati, Assam)
Cart: ₹800
Payment: User wants COD

✗ Can use COD? NO (Assam is in no-COD list)
Force online payment only

Subtotal: ₹800
Shipping: ₹100 (Assam rate)
Prepaid discount (5%): -₹40
────────────────
TOTAL: ₹860
```

### Scenario E: Large Local Order
```
Pincode: 400001 (Mumbai, Maharashtra)
Cart: ₹1200
Payment: COD

✗ Can use COD? NO (1200 < 1300 ✓, but this is allowed)
Actually YES! Maharashtra allows, order < 1300

Subtotal: ₹1200
Shipping: ₹60
+ COD Surcharge: ₹35
+ COD Charge (1200 > 600): ₹0 (not charged, order too large)
────────────────
TOTAL: ₹1295

If prepaid instead:
Subtotal: ₹1200
Shipping: ₹60
Prepaid discount (5%): -₹60
────────────────
TOTAL: ₹1200 (SAVES ₹95!)
```

---

## 📁 Files to Integrate

### Component Usage in Your Checkout:

```tsx
import { PriceDetails } from '@/components/PriceDetails';
import { PincodeInput } from '@/components/PincodeInput';

export const Checkout = () => {
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [shipping, setShipping] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod'>('prepaid');
  
  const cartTotal = 500; // Your cart calculation
  
  return (
    <div className="checkout">
      {/* Step 1: Get Pincode */}
      <PincodeInput 
        onPincodeChange={(data) => {
          setPincode(data.pincode);
          setState(data.state);
          setShipping(data.shippingCharge);
        }}
      />
      
      {/* Step 2: Show Pricing */}
      <PriceDetails
        cartTotal={cartTotal}
        shippingCharge={shipping}
        selectedPincode={pincode}
        selectedState={state}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
      />
      
      {/* Step 3: Place Order Button */}
      <button onClick={placeOrder}>
        Place Order
      </button>
    </div>
  );
};
```

---

## 🔧 How Pricing Calculates

```typescript
// From pricingEngine.ts
calculateOrderPrice(
  cartTotal: 500,
  shippingCharge: 50,
  paymentMethod: 'cod',
  state: 'KARNATAKA'
) => {
  
  // Step 1: Check COD allowed
  canUseCOD = true (1300 check) + true (state check)
  
  // Step 2: Check free delivery
  isFreeDelivery = (500 >= 400) && (50 < 45) = true && false = FALSE
  shippingCharge = 50 (not free)
  
  // Step 3: Add COD surcharge
  paymentMethod = 'cod' + canUseCOD = true
  shippingCharge = 50 + 35 = 85
  
  // Step 4: Add COD charge
  500 <= 600 = true
  codCharge = 30
  
  // Step 5: No prepaid discount (COD, not prepaid)
  prepaidDiscount = 0
  
  // Step 6: Calculate total
  total = 500 + 85 + 30 - 0 = 615
  
  return { subtotal: 500, shipping: 85, cod: 30, total: 615 }
}
```

---

## ✅ Deployment Checklist

- [ ] `src/lib/pricingEngine.ts` - Created ✓
- [ ] `src/components/PriceDetails.tsx` - Created ✓
- [ ] `src/components/CheckoutIntegrationFull.tsx` - Created (reference) ✓
- [ ] `src/lib/pincodeService.ts` - Updated with real rates ✓
- [ ] Import `PriceDetails` into your actual `Checkout.tsx`
- [ ] Import `PincodeInput` into your actual `Checkout.tsx`
- [ ] Test scenario A (budget order)
- [ ] Test scenario B (free delivery eligibility)
- [ ] Test scenario C (high value, force online)
- [ ] Test scenario D (remote area, force online)
- [ ] Test scenario E (large local order, prepaid savings)
- [ ] Backend receives all pricing details in order
- [ ] Backend validates pincode + recalculates pricing
- [ ] Deploy to production

---

## 🎯 Key Rates for Testing

**Nearest to Your Hub (Telangana):**
- Telangana: ₹45 ✓ CHEAPEST LOCAL
- Hyderabad hub: 500067

**Cheap Shipping (qualify for free delivery):**
- Telangana: ₹45 (orders >= ₹400 + prepaid = FREE)
- Haryana: ₹60
- Delhi: ₹65

**Medium Shipping:**
- Karnataka: ₹50
- Andhra Pradesh: ₹50
- Tamil Nadu: ₹60

**Expensive Shipping (no free delivery):**
- Kerala: ₹70
- Uttar Pradesh: ₹70
- Rajasthan: ₹70

**Remote (NO COD):**
- Assam: ₹100 (NO COD)
- Srinagar (J&K): ₹88 (NO COD)
- Lakshadweep: ₹250 (NO COD)

---

## 📞 Support

For questions about:
- **Free delivery logic**: See Rule #1 above
- **COD surcharge**: See Rule #2 above
- **COD availability**: See Rules #3, #4, #6 above
- **Prepaid discount**: See Rule #5 above
- **State rates**: See `src/lib/pricingEngine.ts` STATE_SHIPPING_RATES
- **Integration**: See `src/components/CheckoutIntegrationFull.tsx`
