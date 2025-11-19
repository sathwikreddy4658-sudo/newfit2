import { supabase } from '@/integrations/supabase/client';

/**
 * Shipping rate configuration based on distance/regions
 * You can customize these based on your business logic
 */
const SHIPPING_RATES = {
  // Local delivery (same state/nearby)
  local: {
    charge: 40,
    estimatedDays: 1,
    codAvailable: true,
  },
  // Regional delivery (within 500km)
  regional: {
    charge: 60,
    estimatedDays: 2,
    codAvailable: true,
  },
  // National delivery (500-1000km)
  national: {
    charge: 100,
    estimatedDays: 3,
    codAvailable: true,
  },
  // Remote areas (>1000km or specific regions)
  remote: {
    charge: 150,
    estimatedDays: 4,
    codAvailable: false,
  },
};

// Manufacturing hub
const MANUFACTURING_PINCODE = 500067;

// You can provide rate data for specific pincodes from Shipneer's calculator
// This is manually created based on your rate calculator results
const CUSTOM_RATES = {
  // Example: Add pincodes that you've manually calculated rates for
  // Format: { pincode: { charge: 50, estimatedDays: 2, codAvailable: true } }
};

/**
 * Check if a pincode is serviceable
 * @param {number} pincode - The pincode to check
 * @returns {Promise<Object>} - Serviceability data or null if not serviceable
 */
export async function checkPincodeServiceability(pincode) {
  try {
    const { data, error } = await supabase
      .from('pincodes')
      .select('*')
      .eq('pincode', pincode)
      .single();

    if (error) {
      console.error('Pincode lookup error:', error);
      return null;
    }

    if (!data || !data.delivery_available) {
      return null; // Not serviceable
    }

    return data;
  } catch (error) {
    console.error('Error checking pincode serviceability:', error);
    return null;
  }
}

/**
 * Get shipping rate for a pincode
 * @param {number} pincode - The pincode to get rate for
 * @returns {Promise<Object>} - Shipping rate and COD availability
 */
export async function getShippingRate(pincode) {
  // Check if we have custom rate for this pincode
  if (CUSTOM_RATES[pincode]) {
    return CUSTOM_RATES[pincode];
  }

  // Check serviceability first
  const serviceable = await checkPincodeServiceability(pincode);
  if (!serviceable) {
    return {
      charge: null,
      estimatedDays: null,
      codAvailable: false,
      serviceable: false,
    };
  }

  // For now, use a default rate based on regions
  // You can enhance this by:
  // 1. Calculating actual distance from 500067
  // 2. Storing region info in the database
  // 3. Using Shipneer's rate calculator API once you scale

  let rateType = 'regional'; // Default

  // Simple heuristic: pincodes starting with 5 (Telangana/nearby states)
  const pincodeStr = String(pincode);
  if (pincodeStr.startsWith('5') || pincodeStr.startsWith('50')) {
    rateType = 'local'; // Telangana/nearby
  } else if (pincodeStr.startsWith('1') || pincodeStr.startsWith('2') || pincodeStr.startsWith('3')) {
    rateType = 'national'; // Northern India
  } else if (pincodeStr.startsWith('6') || pincodeStr.startsWith('7') || pincodeStr.startsWith('8')) {
    rateType = 'national'; // Eastern/Southern India
  }

  const rate = SHIPPING_RATES[rateType];

  return {
    charge: rate.charge,
    estimatedDays: rate.estimatedDays,
    codAvailable: serviceable.cod_available && rate.codAvailable,
    serviceable: true,
    rateType,
  };
}

/**
 * Validate pincode for checkout
 * @param {number} pincode - The pincode to validate
 * @param {boolean} isCOD - Whether user is trying to use COD
 * @returns {Promise<Object>} - Validation result
 */
export async function validatePincodeForCheckout(pincode, isCOD = false) {
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
 * Get checkout summary for a pincode
 * @param {number} pincode - The pincode
 * @returns {Promise<Object>} - Complete checkout info
 */
export async function getCheckoutInfo(pincode) {
  const rate = await getShippingRate(pincode);

  return {
    pincode,
    serviceable: rate.serviceable,
    shippingCharge: rate.charge,
    estimatedDeliveryDays: rate.estimatedDays,
    codAvailable: rate.codAvailable,
    rateType: rate.rateType,
  };
}

/**
 * Add custom rate for a pincode (admin function)
 * Call this after you manually calculate rates from Shipneer's calculator
 */
export function addCustomRate(pincode, charge, estimatedDays, codAvailable = true) {
  CUSTOM_RATES[pincode] = {
    charge,
    estimatedDays,
    codAvailable,
  };
}

/**
 * Bulk add custom rates from your rate calculator results
 */
export function addCustomRates(ratesArray) {
  // ratesArray format: [
  //   { pincode: 110001, charge: 50, estimatedDays: 1, codAvailable: true },
  //   { pincode: 110002, charge: 50, estimatedDays: 1, codAvailable: true },
  // ]
  ratesArray.forEach(rate => {
    CUSTOM_RATES[rate.pincode] = {
      charge: rate.charge,
      estimatedDays: rate.estimatedDays,
      codAvailable: rate.codAvailable !== false,
    };
  });
}

export default {
  checkPincodeServiceability,
  getShippingRate,
  validatePincodeForCheckout,
  getCheckoutInfo,
  addCustomRate,
  addCustomRates,
};
