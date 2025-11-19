/**
 * COMPLETE PRICING SYSTEM
 * Includes:
 * - State-based shipping rates
 * - COD charges
 * - Free delivery eligibility
 * - Prepaid discounts
 * - Order total calculations
 */

/**
 * State-based shipping rates (500g parcel base)
 * Based on actual Shipneer rates observed
 */
export const STATE_SHIPPING_RATES: Record<string, { charge: number; estimatedDays: number; codAvailable: boolean }> = {
  // Southern States - Based on Karnataka observation (45-55)
  'KARNATAKA': { charge: 50, estimatedDays: 2, codAvailable: true },
  'TELANGANA': { charge: 45, estimatedDays: 1, codAvailable: true },
  'ANDHRA PRADESH': { charge: 50, estimatedDays: 2, codAvailable: true },
  'TAMIL NADU': { charge: 60, estimatedDays: 3, codAvailable: true },
  'KERALA': { charge: 70, estimatedDays: 3, codAvailable: true },

  // Western States
  'MAHARASHTRA': { charge: 60, estimatedDays: 2, codAvailable: true },
  'GUJARAT': { charge: 55, estimatedDays: 2, codAvailable: true },
  'GOA': { charge: 75, estimatedDays: 3, codAvailable: true },

  // Northern States
  'DELHI': { charge: 65, estimatedDays: 2, codAvailable: true },
  'UTTAR PRADESH': { charge: 70, estimatedDays: 3, codAvailable: true },
  'HARYANA': { charge: 60, estimatedDays: 2, codAvailable: true },
  'PUNJAB': { charge: 65, estimatedDays: 2, codAvailable: true },
  'RAJASTHAN': { charge: 70, estimatedDays: 3, codAvailable: true },
  'HIMACHAL PRADESH': { charge: 75, estimatedDays: 3, codAvailable: true },
  'JAMMU & KASHMIR': { charge: 88, estimatedDays: 5, codAvailable: false }, // Based on Srinagar observation
  'UTTARAKHAND': { charge: 75, estimatedDays: 3, codAvailable: true },

  // Eastern States
  'WEST BENGAL': { charge: 75, estimatedDays: 3, codAvailable: true },
  'BIHAR': { charge: 75, estimatedDays: 3, codAvailable: true },
  'JHARKHAND': { charge: 75, estimatedDays: 3, codAvailable: true },
  'ORISSA': { charge: 70, estimatedDays: 3, codAvailable: true },

  // North Eastern States (Remote - Higher rates, NO COD)
  'ASSAM': { charge: 100, estimatedDays: 4, codAvailable: false },
  'MANIPUR': { charge: 120, estimatedDays: 5, codAvailable: false },
  'MEGHALAYA': { charge: 120, estimatedDays: 5, codAvailable: false },
  'MIZORAM': { charge: 120, estimatedDays: 5, codAvailable: false },
  'NAGALAND': { charge: 120, estimatedDays: 5, codAvailable: false },
  'TRIPURA': { charge: 110, estimatedDays: 4, codAvailable: false },
  'ARUNACHAL PRADESH': { charge: 120, estimatedDays: 5, codAvailable: false },
  'SIKKIM': { charge: 110, estimatedDays: 4, codAvailable: false },

  // Central States
  'MADHYA PRADESH': { charge: 65, estimatedDays: 2, codAvailable: true },
  'CHATTISGARH': { charge: 65, estimatedDays: 2, codAvailable: true },

  // Union Territories & Special
  'CHANDIGARH U.T.': { charge: 60, estimatedDays: 2, codAvailable: true },
  'PONDICHERRY U.T.': { charge: 75, estimatedDays: 3, codAvailable: true },
  'LAKSHADWEEP U.T.': { charge: 250, estimatedDays: 7, codAvailable: false },
  'ANDAMAN & NICOBAR U.T.': { charge: 250, estimatedDays: 7, codAvailable: false },
  'DADRA & NAGAR HAVELI U.T.': { charge: 55, estimatedDays: 2, codAvailable: true },
  'DAMAN & DIU U.T.': { charge: 55, estimatedDays: 2, codAvailable: true },
};

/**
 * COD Charges
 * Apply only if order value <= 600
 */
export const COD_CHARGES = {
  BELOW_600: 30, // ₹30 COD charge for orders <= 600
};

/**
 * Pricing Rules
 */
export const PRICING_RULES = {
  FREE_DELIVERY_MIN_ORDER: 400, // ₹400 minimum for free delivery (only if shipping < ₹45)
  FREE_DELIVERY_MAX_SHIPPING: 45, // Only if shipping cost < ₹45
  FREE_DELIVERY_GUARANTEED: 600, // ₹600+ orders get free delivery regardless of shipping cost
  COD_MAX_ORDER_VALUE: 1300, // COD only available for orders < ₹1300
  COD_CHARGE_MAX_ORDER: 600, // COD charges apply only for orders <= ₹600
  COD_CHARGE_AMOUNT: 30, // ₹30 COD charge
  PREPAID_DISCOUNT: 0.05, // 5% discount for online/prepaid payment
};

/**
 * Calculate complete order pricing
 */
export function calculateOrderPrice(
  cartTotal: number,
  shippingCharge: number,
  paymentMethod: 'prepaid' | 'cod',
  state: string
): {
  subtotal: number;
  shippingCharge: number;
  shippingChargeOriginal: number;
  isFreeDelivery: boolean;
  codCharge: number;
  prepaidDiscount: number;
  total: number;
  canUseCOD: boolean;
} {
  const response = {
    subtotal: cartTotal,
    shippingCharge: 0,
    shippingChargeOriginal: shippingCharge,
    isFreeDelivery: false,
    codCharge: 0,
    prepaidDiscount: 0,
    total: 0,
    canUseCOD: true,
  };

  // Check if COD is allowed for this order value
  if (cartTotal >= PRICING_RULES.COD_MAX_ORDER_VALUE) {
    response.canUseCOD = false;
  }

  // Check state COD availability
  const stateRate = STATE_SHIPPING_RATES[state?.toUpperCase().trim() || ''];
  if (stateRate && !stateRate.codAvailable) {
    response.canUseCOD = false;
  }

  // Calculate free delivery eligibility
  // Orders ₹600+ always get free delivery
  if (cartTotal >= PRICING_RULES.FREE_DELIVERY_GUARANTEED) {
    response.isFreeDelivery = true;
    response.shippingCharge = 0;
  }
  // Orders ₹400-₹599 get free delivery only if shipping < ₹45
  else if (
    cartTotal >= PRICING_RULES.FREE_DELIVERY_MIN_ORDER &&
    shippingCharge < PRICING_RULES.FREE_DELIVERY_MAX_SHIPPING
  ) {
    response.isFreeDelivery = true;
    response.shippingCharge = 0;
  } else {
    response.shippingCharge = shippingCharge;
  }

  // Add COD handling charges (flat ₹35 for all COD orders)
  if (paymentMethod === 'cod' && response.canUseCOD) {
    // Flat COD handling charge
    response.codCharge = 35;
  }

  // Apply prepaid discount (5% off)
  if (paymentMethod === 'prepaid') {
    response.prepaidDiscount = cartTotal * PRICING_RULES.PREPAID_DISCOUNT;
  }

  // Calculate total
  response.total =
    response.subtotal +
    response.shippingCharge +
    response.codCharge -
    response.prepaidDiscount;

  return response;
}

/**
 * Validate if order can proceed with selected payment method
 */
export function validatePaymentMethod(
  cartTotal: number,
  paymentMethod: 'prepaid' | 'cod',
  state: string
): {
  valid: boolean;
  message: string;
  canUseCOD: boolean;
} {
  // Check state COD availability
  const stateRate = STATE_SHIPPING_RATES[state?.toUpperCase().trim() || ''];
  if (paymentMethod === 'cod' && stateRate && !stateRate.codAvailable) {
    return {
      valid: false,
      message: 'Cash on Delivery is not available for this location.',
      canUseCOD: false,
    };
  }

  // Check order value for COD
  if (paymentMethod === 'cod' && cartTotal >= PRICING_RULES.COD_MAX_ORDER_VALUE) {
    return {
      valid: false,
      message: `Cash on Delivery is only available for orders below ₹${PRICING_RULES.COD_MAX_ORDER_VALUE}. Please choose online payment.`,
      canUseCOD: false,
    };
  }

  return {
    valid: true,
    message: '',
    canUseCOD: true,
  };
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `₹${Math.round(amount)}`;
}

export default {
  STATE_SHIPPING_RATES,
  COD_CHARGES,
  PRICING_RULES,
  calculateOrderPrice,
  validatePaymentMethod,
  formatPrice,
};
