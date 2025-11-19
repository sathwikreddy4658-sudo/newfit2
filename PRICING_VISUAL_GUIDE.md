# Pricing System - Visual Guide

## 🎨 Checkout Display (PriceDetails Component)

```
┌──────────────────────────────────────┐
│          Price Details               │
├──────────────────────────────────────┤
│                                      │
│ Subtotal (MRP incl. taxes)  ₹500    │
│                                      │
│ 🚚 Delivery Charges         ₹50     │
│                                      │
│ 📱 COD Charges              ₹30     │
│    (only if order ≤ ₹600)           │
│                                      │
│ 🎁 Prepaid Discount (5%)   -₹25  ✨ │
│    Save ₹25 with online payment     │
│                                      │
├──────────────────────────────────────┤
│ ORDER TOTAL              ₹555     💰  │
│ (Large, bold, highlighted)           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│       Select Payment Method          │
├──────────────────────────────────────┤
│                                      │
│ ◉ Online Payment (Prepaid)          │
│   🔐 100% Secure                     │
│   💳 Credit/Debit/UPI                │
│   ✨ Get 5% discount + Save ₹25      │
│                                      │
│ ◯ Cash on Delivery                  │
│   💵 Pay when you receive            │
│   📦 Full inspection before payment  │
│   ⚠️  +₹35 Handling Charges          │
│   ⚠️  +₹30 for orders ≤ ₹600         │
│                                      │
└──────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
User enters Pincode
        ↓
  [PincodeInput]
        ↓
  validates pincode in DB
        ↓
  returns: { pincode, state, shipping, cod_available }
        ↓
  [PriceDetails] receives:
  ├─ cartTotal (from cart)
  ├─ shippingCharge (from PincodeInput)
  ├─ selectedState (from PincodeInput)
  └─ paymentMethod (from radio selection)
        ↓
  calculateOrderPrice() applies all rules:
  ├─ FREE DELIVERY check (₹400 + shipping < ₹45)
  ├─ COD AVAILABILITY (< ₹1300 + state allows)
  ├─ COD SURCHARGE (+₹35 if COD)
  ├─ COD CHARGE (₹30 if <= ₹600 and COD)
  ├─ PREPAID DISCOUNT (5% if online)
  └─ FINAL TOTAL
        ↓
  Display breakdown + place order
        ↓
  Send to backend with all details
```

---

## 💳 Payment Method Impact

### Online Payment (Prepaid)
```
Cart ₹500
├─ Shipping ₹50
├─ Prepaid Discount -₹25 (5%)
└─ Total: ₹525 ✓ CHEAPEST
```

### COD Payment
```
Cart ₹500
├─ Shipping ₹50
├─ COD Surcharge +₹35
├─ COD Charge +₹30 (if ≤ ₹600)
└─ Total: ₹615 ❌ ₹90 MORE

Difference: ₹90 MORE for COD!
```

---

## 🎯 Decision Tree

### Can Customer Use COD?

```
START
  ↓
Is order value < ₹1300?
  ├─ NO → ❌ COD NOT AVAILABLE
  │        (Force online payment)
  └─ YES → Continue
     ↓
Is state in no-COD list?
(Assam, Manipur, Meghalaya, Mizoram, Nagaland, 
 Tripura, Arunachal, Sikkim, J&K, Islands)
  ├─ YES → ❌ COD NOT AVAILABLE
  │        (Location doesn't support COD)
  └─ NO → Continue
     ↓
Does pincode allow COD in DB?
  ├─ NO → ❌ COD NOT AVAILABLE
  │        (Pincode flagged as COD unavailable)
  └─ YES → ✅ COD AVAILABLE
     
Choose COD option
  ↓
Add ₹35 COD surcharge to shipping
  ↓
If order ≤ ₹600: Add ₹30 COD charge
If order > ₹600: No COD charge (₹0)
  ↓
Show final total
```

---

## 📊 Pricing Rules Summary Table

| Rule | Condition | Action | Example |
|------|-----------|--------|---------|
| **Free Delivery** | Order ≥ ₹400 AND Shipping < ₹45 | Remove shipping charge | ₹400 order + ₹40 shipping = FREE |
| **COD Unavailable** | Order ≥ ₹1300 | Block COD option | ₹1300+ = Prepaid only |
| **COD Unavailable** | State is remote (NE/Islands) | Block COD option | Assam = Prepaid only |
| **COD Surcharge** | Payment = COD | +₹30-40 to shipping | ₹50 shipping becomes ₹85 |
| **COD Charge** | COD + Order ≤ ₹600 | Add ₹30 charge | ₹500 order = +₹30 |
| **COD Charge** | COD + Order > ₹600 | No charge | ₹700 order = ₹0 charge |
| **Prepaid Discount** | Payment = Online | -5% of cart | ₹500 order = -₹25 |

---

## 🧮 Real-World Pricing Examples

### Customer 1: Budget Shopper (Local Area)
```
Location: Hyderabad, Telangana (YOUR HUB!)
Cart Total: ₹300
Payment Choice: COD

├─ Can use COD? 
│  ├─ Order < ₹1300? YES ✓
│  ├─ State allows COD? YES ✓ (Telangana)
│  └─ Pincode allows COD? YES ✓
│
├─ Pricing:
│  ├─ Subtotal: ₹300
│  ├─ Shipping: ₹45 (Telangana base)
│  ├─ COD Surcharge: +₹35 = ₹80
│  ├─ COD Charge (300 ≤ 600): +₹30
│  └─ TOTAL: ₹410
│
└─ If chose Prepaid instead:
   ├─ Subtotal: ₹300
   ├─ Shipping: ₹45
   ├─ Prepaid Discount: -₹15 (5%)
   └─ TOTAL: ₹330 ✓ SAVES ₹80!
```

### Customer 2: Premium Shopper (Remote Area)
```
Location: Srinagar, Jammu & Kashmir
Cart Total: ₹1500
Payment: (User wants COD)

├─ Can use COD? NO ❌
│  ├─ Order < ₹1300? NO (1500 ≥ 1300)
│  ├─ Plus: State blocks COD anyway
│
├─ Forced to Prepaid:
│  ├─ Subtotal: ₹1500
│  ├─ Shipping: ₹88 (Srinagar rate - high!)
│  ├─ Prepaid Discount: -₹75 (5%)
│  └─ TOTAL: ₹1513
│
└─ Note: If COD were allowed, would cost ₹1665
   (saving ₹152 by using prepaid!)
```

### Customer 3: Mid-Range Buyer
```
Location: Mumbai, Maharashtra
Cart Total: ₹800
Payment: COD

├─ Can use COD? YES ✓
│  ├─ Order < ₹1300? YES ✓
│  └─ State allows COD? YES ✓
│
├─ Pricing:
│  ├─ Subtotal: ₹800
│  ├─ Shipping: ₹60
│  ├─ COD Surcharge: +₹35 = ₹95
│  ├─ COD Charge (800 > 600): ₹0
│  └─ TOTAL: ₹895
│
└─ If chose Prepaid:
   ├─ Subtotal: ₹800
   ├─ Shipping: ₹60
   ├─ Prepaid Discount: -₹40 (5%)
   └─ TOTAL: ₹820 ✓ SAVES ₹75!
```

---

## 🚀 State Shipping Rates Quick Reference

### Cheapest Shipping States (qualify for free delivery consideration)
```
Telangana:          ₹45 ← Your hub state!
Haryana:            ₹60
Delhi:              ₹65
Punjab:             ₹65
```

### Mid-Range Shipping
```
Karnataka:          ₹50
Andhra Pradesh:     ₹50
Gujarat:            ₹55
Tamil Nadu:         ₹60
Maharashtra:        ₹60
```

### Expensive Shipping
```
Kerala:             ₹70
Uttar Pradesh:      ₹70
Rajasthan:          ₹70
Himachal Pradesh:   ₹75
```

### Remote (HIGH COST + NO COD)
```
Assam:              ₹100 (NO COD)
Srinagar (J&K):     ₹88 (NO COD)
Arunachal Pradesh:  ₹120 (NO COD)
Lakshadweep Island: ₹250 (NO COD)
Andaman Islands:    ₹250 (NO COD)
```

---

## 📱 Mobile Checkout Flow

```
┌─────────────────────────────────┐
│      Your Shopping Cart         │
│      Total: ₹500                │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│    📍 Enter Delivery Pincode     │
│    ┌──────────────────────────┐  │
│    │ 560001                   │  │
│    └──────────────────────────┘  │
│    ✓ Bangalore, Karnataka       │
│    Shipping: ₹50                │
│    Estimated: 2 days            │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│      💰 Price Details           │
│                                 │
│ Subtotal      ₹500             │
│ Shipping      ₹50              │
│ ─────────────────────           │
│ Total:        ₹550             │
│                                 │
│ ◉ Online (Save ₹27.50)         │
│ ◯ Cash on Delivery             │
│                                 │
│  [PLACE ORDER]                  │
└─────────────────────────────────┘
```

---

## ⚙️ Technical Integration Points

### 1. PincodeInput → PriceDetails
```
PincodeInput emits:
{
  pincode: "560001",
  state: "KARNATAKA",
  shippingCharge: 50,
  codAvailable: true,
  estimatedDays: 2
}
  ↓
PriceDetails receives as props:
{
  cartTotal: 500,
  shippingCharge: 50,
  selectedState: "KARNATAKA",
  ...
}
```

### 2. PriceDetails → Order Object
```
PriceDetails calculates pricing and returns:
{
  subtotal: 500,
  shippingCharge: 50,
  codCharge: 0,
  prepaidDiscount: 25,
  paymentMethod: "prepaid",
  total: 525
}
  ↓
Merged with order details:
{
  items: [...],
  pincode: "560001",
  state: "KARNATAKA",
  pricing: { ...above... },
  timestamp: "2025-11-19..."
}
```

### 3. Backend Validation
```
Receive order with pricing
  ↓
Verify pincode exists
  ↓
Recalculate pricing using same rules
  ↓
Compare: frontend total === backend total
  ├─ Match → Accept order
  └─ Mismatch → Reject (fraud/error)
  ↓
Store order with all pricing details
```

---

## ✅ Deployment Readiness

- ✅ All files created and committed
- ✅ All business rules implemented
- ✅ All state rates configured (28 states + 7 UTs)
- ✅ Full documentation provided
- ✅ Testing scenarios documented
- ✅ Integration examples provided
- ✅ Backend integration points defined

**Ready to integrate into your checkout!**
