import { supabase } from '@/integrations/supabase/client';

/**
 * State-based shipping rate configuration
 * Actual rates from Shipneer (500g parcel tier)
 * Base rates observed: Karnataka ₹45-55, Srinagar ₹85-90
 * These include the 500g base tier (no increase from 250g)
 */
const STATE_SHIPPING_RATES: Record<string, { charge: number; estimatedDays: number; codAvailable: boolean }> = {
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
  'JAMMU & KASHMIR': { charge: 88, estimatedDays: 5, codAvailable: false }, // Based on Srinagar observation (85-90)
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
 * Check if a pincode is serviceable using Shipneer's Delivery column
 * Looks for 'Y' in the Delivery column to determine deliverability
 */
export async function checkPincodeServiceability(pincode: number) {
  try {
    const { data, error } = await (supabase
      .from('pincodes' as any)
      .select('*')
      .eq('pincode', pincode)
      .single() as any);

    if (error || !data) {
      return null;
    }

    // Check if delivery column has 'Y' (Shipneer format)
    const isDeliverable = data.delivery === 'Y' || data.delivery_available === true;

    if (!isDeliverable) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error checking pincode serviceability:', error);
    return null;
  }
}

/**
 * Get shipping rate for a pincode (STATE-BASED PRICING!)
 * Uses Shipneer's Delivery column ('Y' = deliverable)
 * Uses Shipneer's COD column ('Y' = COD available)
 */
export async function getShippingRate(pincode: number) {
  try {
    const { data, error } = await (supabase
      .from('pincodes' as any)
      .select('*')
      .eq('pincode', pincode)
      .single() as any);

    if (error || !data) {
      return {
        charge: null,
        estimatedDays: null,
        codAvailable: false,
        serviceable: false,
      };
    }

    // Check Shipneer's Delivery column for 'Y' (meaning deliverable)
    const isDeliverable = data.delivery === 'Y' || data.delivery_available === true;

    if (!isDeliverable) {
      return {
        charge: null,
        estimatedDays: null,
        codAvailable: false,
        serviceable: false,
      };
    }

    // Get state-based rate
    const stateName = (data.state || '').toUpperCase().trim();
    const stateRate = STATE_SHIPPING_RATES[stateName];

    if (!stateRate) {
      // Fallback to generic rate if state not found
      const codAvailableInShipneer = data.cod === 'Y' || data.cod_available === true;
      return {
        charge: 100,
        estimatedDays: 3,
        codAvailable: codAvailableInShipneer,
        serviceable: true,
        state: data.state,
        district: data.district,
      };
    }

    // Check Shipneer's COD column for 'Y' (meaning COD available for this pincode)
    const shipneerCodAvailable = data.cod === 'Y' || data.cod_available === true;
    // Combine Shipneer's COD flag with state-based rule
    const codAvailable = shipneerCodAvailable && stateRate.codAvailable;

    return {
      charge: stateRate.charge,
      estimatedDays: stateRate.estimatedDays,
      codAvailable,
      serviceable: true,
      state: data.state,
      district: data.district,
    };
  } catch (error) {
    console.error('Error getting shipping rate:', error);
    return {
      charge: null,
      estimatedDays: null,
      codAvailable: false,
      serviceable: false,
    };
  }
}

/**
 * Validate pincode for checkout
 */
export async function validatePincodeForCheckout(pincode: number, isCOD = false) {
  if (!pincode || isNaN(pincode)) {
    return {
      valid: false,
      message: 'Please enter a valid pincode',
    };
  }

  const rate = await getShippingRate(pincode);

  if (!rate.serviceable) {
    return {
      valid: false,
      message: 'Delivery not available for this pincode',
      serviceable: false,
    };
  }

  if (isCOD && !rate.codAvailable) {
    return {
      valid: false,
      message: 'Cash on Delivery not available for this pincode. Please choose prepaid payment.',
      codAvailable: false,
    };
  }

  return {
    valid: true,
    message: 'Pincode is serviceable',
    rate,
    serviceable: true,
  };
}

/**
 * Get checkout info for a pincode
 */
export async function getCheckoutInfo(pincode: number) {
  const rate = await getShippingRate(pincode);

  return {
    pincode,
    serviceable: rate.serviceable,
    shippingCharge: rate.charge,
    estimatedDeliveryDays: rate.estimatedDays,
    codAvailable: rate.codAvailable,
    state: rate.state,
    district: rate.district,
  };
}

export default {
  checkPincodeServiceability,
  getShippingRate,
  validatePincodeForCheckout,
  getCheckoutInfo,
  STATE_SHIPPING_RATES,
};
