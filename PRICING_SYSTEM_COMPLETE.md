# Complete Pricing System - Implementation Guide

## Overview
This document describes the complete pricing system for your e-commerce checkout with all business rules:
- State-based shipping rates (actual Shipneer 500g tier rates)
- Free delivery eligibility (₹400+ order with shipping < ₹45)
- COD (Cash on Delivery) rules and restrictions
- Prepaid discount (5% off for online payments)
- COD surcharge (+₹30-40 for COD orders)

## Files Created/Updated

### 1. `src/lib/pricingEngine.ts`
**Purpose:** Core pricing calculation engine

**Key Functions:**
```typescript
calculateOrderPrice(
  cartTotal: number,
  shippingCharge: number,
  paymentMethod: 'prepaid' | 'cod',
  state: string
): PricingDetails
```

**Pricing Rules Implemented:**

| Rule | Details |
|------|---------|
| **Base Rates** | State-based (28 states + 7 UTs) from actual Shipneer 500g tier |
| **Free Delivery** | If order ≥ ₹400 AND shipping < ₹45 |
| **COD Surcharge** | +₹30-40 added to shipping for COD orders |
| **COD Availability** | Only for orders < ₹1300 |
| **COD Charges** | ₹30 charge only for orders ≤ ₹600 |
| **Prepaid Discount** | 5% off cart total for online/prepaid payments |

**Example Calculation:**
```
Cart Total: ₹500
Pincode: 560001 (Karnataka)
Payment: COD

Calculation:
├─ Subtotal: ₹500 (MRP inclusive of all taxes)
├─ Shipping (original): ₹50
├─ Qualifies for free delivery: YES (500 >= 400 AND 50 < 45)
│   ✗ Actually NO! (50 is not < 45, so no free delivery)
├─ Shipping charge: ₹50
├─ COD surcharge: +₹35
├─ COD charge (500 <= 600): +₹30
└─ Total: ₹615

If prepaid instead:
├─ Subtotal: ₹500
├─ Shipping: ₹50
├─ Prepaid discount (5%): -₹25
└─ Total: ₹525 (SAVES ₹90!)
```

### 2. `src/components/PriceDetails.tsx`
**Purpose:** Checkout UI component displaying all pricing breakdowns

**Props:**
```typescript
interface PriceDetailsProps {
  cartTotal: number;           // Total price of items in cart
  shippingCharge: number;      // Base shipping from pincode validation
  selectedPincode: string;     // User's delivery pincode
  selectedState: string;       // State from pincode data
  paymentMethod: 'prepaid' | 'cod';  // Selected payment method
  onPaymentMethodChange: (method) => void;  // Callback when user changes method
}
```

**Display Features:**
- ✅ **Subtotal:** "MRP inclusive of all taxes" (cart total)
- ✅ **Shipping:** Shows either actual charge or "Free Delivery" with strikethrough original
- ✅ **COD Charges:** Shows ₹30 only if order ≤ ₹600
- ✅ **Prepaid Discount:** Shows 5% discount amount in green highlight
- ✅ **Order Total:** Large highlighted total in orange
- ✅ **Payment Options:** Radio buttons for Online/COD with actual final amounts
- ✅ **Warnings:** Shows when COD unavailable (order too high or state restrictions)

**UI Sections:**
```
┌─────────────────────────────────┐
│     Price Details               │
├─────────────────────────────────┤
│ Subtotal (MRP...)    ₹500       │
│ Delivery Charges     ₹50        │
│ COD Charges         ₹30        │
│ Prepaid Discount -   ₹25  GREEN │
├─────────────────────────────────┤
│ ORDER TOTAL         ₹615  BIG  │
├─────────────────────────────────┤
│ ◉ Online Payment     Save ₹25   │
│ ◯ Cash on Delivery              │
└─────────────────────────────────┘
```

### 3. `src/components/CheckoutIntegrationFull.tsx`
**Purpose:** Complete example of how to integrate pricing system into checkout

**Integration Pattern:**
```typescript
<PincodeInput 
  onPincodeChange={(data) => {
    setSelectedPincode(data.pincode);
    setShippingCharge(data.shippingCharge);
    setSelectedState(data.state);
  }}
/>

<PriceDetails 
  cartTotal={cartTotal}
  shippingCharge={shippingCharge}
  selectedPincode={selectedPincode}
  selectedState={selectedState}
  paymentMethod={paymentMethod}
  onPaymentMethodChange={setPaymentMethod}
/>
```

### 4. `src/lib/pincodeService.ts`
**Updated with actual Shipneer 500g tier rates:**

**Rate Examples:**
```typescript
'KARNATAKA': { charge: 50, estimatedDays: 2, codAvailable: true },
'TELANGANA': { charge: 45, estimatedDays: 1, codAvailable: true },
'JAMMU & KASHMIR': { charge: 88, estimatedDays: 5, codAvailable: false },
'ASSAM': { charge: 100, estimatedDays: 4, codAvailable: false },
```

**Rate Sources:**
- Karnataka: ₹45-55 observed → Using ₹50
- Srinagar: ₹85-90 observed → Using ₹88
- Remote areas: Higher rates, NO COD available
- Local areas: Lower rates, COD available

## Business Rules Summary

### ✅ Rule 1: Base Shipping Charges
**State-based pricing using actual Shipneer 500g tier rates**
- Local states (Karnataka, Telangana): ₹45-50
- Northern plains: ₹65-75
- Remote areas (NE states, islands): ₹100-250
- Island territories: NO COD allowed

### ✅ Rule 2: Free Delivery Eligibility
**Conditions (ALL must be true):**
1. Order value ≥ ₹400
2. Shipping cost < ₹45
3. Payment method is prepaid (online)

**Example:**
```
✓ Order ₹500 + Shipping ₹40 (Telangana) = FREE
✗ Order ₹500 + Shipping ₹50 (Karnataka) = NOT FREE (50 >= 45)
✗ Order ₹300 + Shipping ₹30 (any state) = NOT FREE (300 < 400)
```

### ✅ Rule 3: COD Availability Restrictions
**COD NOT available if ANY of these are true:**
1. Order value ≥ ₹1300
2. State is marked as no-COD (NE states, remote areas)
3. Pincode's COD flag is disabled in database

**States with NO COD:**
- All NE states (Assam, Manipur, Meghalaya, Mizoram, Nagaland, Tripura, Arunachal, Sikkim)
- Jammu & Kashmir
- Islands (Lakshadweep, Andaman & Nicobar)

### ✅ Rule 4: COD Surcharge
**+₹30-40 added to shipping for COD orders**
- Implemented as: +₹35 (midpoint)
- Added only when payment method = 'cod'
- Shows separately in checkout as "COD Handling Charges"

### ✅ Rule 5: COD Transaction Charges
**₹30 charge applies ONLY if:**
- Order value ≤ ₹600
- Payment method = COD

**Examples:**
```
Order ₹400 + COD = ₹400 + Shipping + ₹30 COD charge
Order ₹600 + COD = ₹600 + Shipping + ₹30 COD charge
Order ₹700 + COD = ₹700 + Shipping + ₹0 COD charge (no charge)
```

### ✅ Rule 6: Prepaid Discount
**5% discount on cart total when using online payment**

**Examples:**
```
Order ₹500 prepaid = ₹500 - ₹25 (5%) = ₹475 (before shipping)
Order ₹1000 prepaid = ₹1000 - ₹50 (5%) = ₹950 (before shipping)
```

**Display:** Shows in green "Prepaid Discount" with amount and savings message

## Checkout Integration Steps

### Step 1: Add PincodeInput Component
```typescript
<PincodeInput
  onPincodeChange={(data) => {
    setSelectedPincode(data.pincode);
    setShippingCharge(data.shippingCharge);
    setSelectedState(data.state);
    setIsCODAvailable(data.codAvailable);
  }}
/>
```

### Step 2: Add PriceDetails Component
```typescript
<PriceDetails
  cartTotal={cartTotal}
  shippingCharge={shippingCharge}
  selectedPincode={selectedPincode}
  selectedState={selectedState}
  paymentMethod={paymentMethod}
  onPaymentMethodChange={setPaymentMethod}
/>
```

### Step 3: Handle Order Placement
```typescript
const handlePlaceOrder = () => {
  if (!selectedPincode) {
    alert('Please enter delivery pincode');
    return;
  }
  
  // Order is valid - create order object
  const order = {
    items: cartItems,
    subtotal: cartTotal,
    shippingCharge: calculatedShipping,
    paymentMethod: paymentMethod,
    deliveryPincode: selectedPincode,
    deliveryState: selectedState,
  };
  
  // Send to backend/payment gateway
  submitOrder(order);
};
```

## Price Calculation Logic

### Pseudo-code for `calculateOrderPrice()`:

```
function calculateOrderPrice(cartTotal, shippingCharge, paymentMethod, state):
  
  // Initialize response
  response = {
    subtotal: cartTotal,
    shippingCharge: shippingCharge,
    isFreeDelivery: false,
    codCharge: 0,
    prepaidDiscount: 0,
    total: 0,
    canUseCOD: true
  }
  
  // Check COD availability by order value
  if cartTotal >= 1300:
    canUseCOD = false
  
  // Check COD availability by state
  if state has NO_COD flag:
    canUseCOD = false
  
  // Calculate free delivery
  if cartTotal >= 400 AND shippingCharge < 45:
    isFreeDelivery = true
    shippingCharge = 0
  
  // Add COD surcharge if COD selected
  if paymentMethod == 'cod' AND canUseCOD:
    shippingCharge += 35  // +30-40 rupees
    
    // Add COD transaction charge only for orders <= 600
    if cartTotal <= 600:
      codCharge = 30
  
  // Apply prepaid discount if online payment
  if paymentMethod == 'prepaid':
    prepaidDiscount = cartTotal * 0.05
  
  // Calculate final total
  total = cartTotal + shippingCharge + codCharge - prepaidDiscount
  
  return response
```

## Testing Scenarios

### Scenario 1: Local Order with Free Delivery
```
Pincode: 560001 (Bangalore, Karnataka)
Cart: ₹450
Payment: Prepaid (Online)

Result:
- Subtotal: ₹450
- Shipping (40 < 45): FREE
- Prepaid Discount (5%): -₹22.50
- Total: ₹427.50 ✓
```

### Scenario 2: High-value COD Order
```
Pincode: 110001 (Delhi)
Cart: ₹1500
Payment: COD

Result:
- Can use COD? NO (1500 >= 1300)
- Show error: "COD not available for orders >= ₹1300"
- Force online payment ✓
```

### Scenario 3: Remote Area with No COD
```
Pincode: 781001 (Guwahati, Assam)
Cart: ₹300
Payment: COD

Result:
- Can use COD? NO (state = Assam, no COD)
- Show error: "COD not available for this location"
- Force online payment ✓
```

### Scenario 4: Mid-range COD Order
```
Pincode: 400001 (Mumbai, Maharashtra)
Cart: ₹500
Payment: COD

Result:
- Subtotal: ₹500
- Shipping: ₹60
- COD Surcharge: +₹35
- COD Charge (500 <= 600): +₹30
- Total: ₹625 ✓
```

### Scenario 5: Large Order (No COD Charge)
```
Pincode: 400001 (Mumbai, Maharashtra)
Cart: ₹1200
Payment: COD (if available)

Result:
- Can use COD? NO (1200 < 1300 but let's say it's allowed)
- Subtotal: ₹1200
- Shipping: ₹60
- COD Surcharge: +₹35
- COD Charge (1200 > 600): ₹0 (not charged)
- Total: ₹1295 ✓
```

## Database Integration

**The pricingEngine works with `src/lib/pincodeService.ts`:**

1. User enters pincode in `PincodeInput`
2. `pincodeService.getShippingRate(pincode)` returns:
   ```typescript
   {
     charge: 50,           // Base shipping from state
     estimatedDays: 2,
     codAvailable: true,   // From state config
     state: 'KARNATAKA',
     district: 'BENGALURU'
   }
   ```

3. `PriceDetails` receives this data
4. `calculateOrderPrice()` applies all business rules
5. Display shows final total with breakdown

## State Pricing Reference

**South India:**
- Karnataka: ₹50
- Telangana: ₹45 (your hub state!)
- Andhra Pradesh: ₹50
- Tamil Nadu: ₹60
- Kerala: ₹70

**North India:**
- Delhi: ₹65
- Uttar Pradesh: ₹70
- Haryana: ₹60
- Punjab: ₹65
- Rajasthan: ₹70

**Remote/Island:**
- Lakshadweep: ₹250 (NO COD)
- Andaman: ₹250 (NO COD)
- NE States: ₹100-120 (NO COD)

## Deployment Checklist

- [ ] Verify all files created:
  - `src/lib/pricingEngine.ts`
  - `src/components/PriceDetails.tsx`
  - `src/components/CheckoutIntegrationFull.tsx`
  - `src/lib/pincodeService.ts` (updated)

- [ ] Add PriceDetails to your actual Checkout component
- [ ] Connect PincodeInput output to PriceDetails input
- [ ] Test with real pincodes and payment methods
- [ ] Verify free delivery logic (≥₹400 AND shipping < ₹45)
- [ ] Verify COD restrictions (< ₹1300 AND state allows)
- [ ] Verify prepaid discount displays correctly (5%)
- [ ] Test COD charges for orders ≤ ₹600
- [ ] Confirm backend receives all pricing details in order object
- [ ] Deploy to production

## API/Backend Considerations

**What to send with order:**
```typescript
{
  // Cart
  items: [...],
  subtotal: 500,
  
  // Delivery
  pincode: 560001,
  state: 'KARNATAKA',
  estimatedDeliveryDays: 2,
  
  // Pricing breakdown
  shippingCharge: 50,
  codCharge: 0,  // or 30
  prepaidDiscount: 25,
  paymentMethod: 'prepaid',  // or 'cod'
  
  // Final
  total: 525,
  createdAt: '2025-11-19T...'
}
```

**Backend validation:**
- Verify pincode is serviceable
- Verify COD is allowed for pincode + order value
- Recalculate pricing (don't trust frontend alone!)
- Apply payment gateway rules
- Create order with all pricing details
