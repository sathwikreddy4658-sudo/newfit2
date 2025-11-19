import { supabase } from '@/integrations/supabase/client';

/**
 * State-based shipping rate configuration
 * You can customize these based on your actual rates from Shipneer
 */
const STATE_SHIPPING_RATES: Record<string, { charge: number; estimatedDays: number; codAvailable: boolean }> = {
  // Southern States
  'KARNATAKA': { charge: 60, estimatedDays: 2, codAvailable: true },
  'TELANGANA': { charge: 40, estimatedDays: 1, codAvailable: true },
  'ANDHRA PRADESH': { charge: 60, estimatedDays: 2, codAvailable: true },
  'TAMIL NADU': { charge: 80, estimatedDays: 3, codAvailable: true },
  'KERALA': { charge: 90, estimatedDays: 3, codAvailable: true },

  // Western States
  'MAHARASHTRA': { charge: 60, estimatedDays: 2, codAvailable: true },
  'GUJARAT': { charge: 70, estimatedDays: 2, codAvailable: true },
  'GOA': { charge: 100, estimatedDays: 3, codAvailable: true },

  // Northern States
  'DELHI': { charge: 80, estimatedDays: 2, codAvailable: true },
  'UTTAR PRADESH': { charge: 90, estimatedDays: 3, codAvailable: true },
  'HARYANA': { charge: 70, estimatedDays: 2, codAvailable: true },
  'PUNJAB': { charge: 80, estimatedDays: 2, codAvailable: true },
  'RAJASTHAN': { charge: 90, estimatedDays: 3, codAvailable: true },
  'HIMACHAL PRADESH': { charge: 100, estimatedDays: 3, codAvailable: true },
  'JAMMU & KASHMIR': { charge: 150, estimatedDays: 5, codAvailable: false },
  'UTTARAKHAND': { charge: 100, estimatedDays: 3, codAvailable: true },

  // Eastern States
  'WEST BENGAL': { charge: 100, estimatedDays: 3, codAvailable: true },
  'BIHAR': { charge: 100, estimatedDays: 3, codAvailable: true },
  'JHARKHAND': { charge: 100, estimatedDays: 3, codAvailable: true },
  'ORISSA': { charge: 90, estimatedDays: 3, codAvailable: true },

  // North Eastern States
  'ASSAM': { charge: 120, estimatedDays: 4, codAvailable: false },
  'MANIPUR': { charge: 150, estimatedDays: 5, codAvailable: false },
  'MEGHALAYA': { charge: 150, estimatedDays: 5, codAvailable: false },
  'MIZORAM': { charge: 150, estimatedDays: 5, codAvailable: false },
  'NAGALAND': { charge: 150, estimatedDays: 5, codAvailable: false },
  'TRIPURA': { charge: 140, estimatedDays: 4, codAvailable: false },
  'ARUNACHAL PRADESH': { charge: 150, estimatedDays: 5, codAvailable: false },
  'SIKKIM': { charge: 140, estimatedDays: 4, codAvailable: false },

  // Central States
  'MADHYA PRADESH': { charge: 80, estimatedDays: 2, codAvailable: true },
  'CHATTISGARH': { charge: 80, estimatedDays: 2, codAvailable: true },

  // Union Territories & Special
  'CHANDIGARH U.T.': { charge: 70, estimatedDays: 2, codAvailable: true },
  'PONDICHERRY U.T.': { charge: 100, estimatedDays: 3, codAvailable: true },
  'LAKSHADWEEP U.T.': { charge: 300, estimatedDays: 7, codAvailable: false },
  'ANDAMAN & NICOBAR U.T.': { charge: 300, estimatedDays: 7, codAvailable: false },
  'DADRA & NAGAR HAVELI U.T.': { charge: 70, estimatedDays: 2, codAvailable: true },
  'DAMAN & DIU U.T.': { charge: 70, estimatedDays: 2, codAvailable: true },
};

/**
 * Check if a pincode is serviceable
 */
export async function checkPincodeServiceability(pincode: number) {
  try {
    const { data, error } = await (supabase
      .from('pincodes' as any)
      .select('*')
      .eq('pincode', pincode)
      .single() as any);

    if (error || !data || !data.delivery_available) {
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
 */
export async function getShippingRate(pincode: number) {
  try {
    const { data, error } = await (supabase
      .from('pincodes' as any)
      .select('*')
      .eq('pincode', pincode)
      .single() as any);

    if (error || !data || !data.delivery_available) {
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
      return {
        charge: 100,
        estimatedDays: 3,
        codAvailable: data.cod_available,
        serviceable: true,
        state: data.state,
        district: data.district,
      };
    }

    // Combine Shipneer's COD flag with state rate
    const codAvailable = data.cod_available && stateRate.codAvailable;

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
