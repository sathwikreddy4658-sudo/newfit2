/**
 * Static JSON-based Pincode Service
 * Loads pincode data from /pincodes.json (served from public/) and caches in memory.
 * Format: { "500100": ["TELANGANA", "HYDERABAD", 1], ... }
 *   index 0 = state name (uppercase)
 *   index 1 = district name
 *   index 2 = cod available (1 = yes, 0 = no)
 * All entries are deliverable (non-deliverable pincodes are excluded from the file).
 */

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

// In-memory cache for the full pincode lookup table.
// Format: { "500100": ["TELANGANA", "HYDERABAD", 1], ... }
type PincodeMap = Record<string, [string, string, 0 | 1]>;
let pincodeCache: PincodeMap | null = null;
let loadPromise: Promise<PincodeMap> | null = null;

async function loadPincodeData(): Promise<PincodeMap> {
  if (pincodeCache) return pincodeCache;
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/pincodes.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load pincodes.json: ${res.status}`);
      return res.json() as Promise<PincodeMap>;
    })
    .then(data => {
      pincodeCache = data;
      return data;
    })
    .catch(err => {
      loadPromise = null; // allow retry on next call
      console.error('Failed to load pincode data:', err);
      return {} as PincodeMap;
    });

  return loadPromise;
}

/**
 * Check if a pincode is serviceable.
 * Returns a data object compatible with the old Firestore shape, or null.
 */
export async function checkPincodeServiceability(pincode: number) {
  const map = await loadPincodeData();
  const entry = map[String(pincode)];
  if (!entry) return null;
  const [state, district, cod] = entry;
  return { pincode, state, district, delivery: 'Y', cod: cod ? 'Y' : 'N' };
}

/**
 * Get shipping rate for a pincode (STATE-BASED PRICING).
 * Loads data from /pincodes.json — no Firestore reads needed.
 */
export async function getShippingRate(pincode: number) {
  const NOT_SERVICEABLE = {
    charge: null as number | null,
    estimatedDays: null as number | null,
    codAvailable: false,
    serviceable: false,
    state: undefined as string | undefined,
    district: undefined as string | undefined,
  };

  try {
    const map = await loadPincodeData();
    const entry = map[String(pincode)];

    if (!entry) return NOT_SERVICEABLE;

    const [stateName, district, codFlag] = entry;
    const stateRate = STATE_SHIPPING_RATES[stateName.toUpperCase().trim()];

    if (!stateRate) {
      return {
        charge: 100 as number | null,
        estimatedDays: 3 as number | null,
        codAvailable: codFlag === 1,
        serviceable: true,
        state: stateName || undefined,
        district: district || undefined,
      };
    }

    // Combine per-pincode COD flag with state-level COD rule
    const codAvailable = codFlag === 1 && stateRate.codAvailable;

    return {
      charge: stateRate.charge as number | null,
      estimatedDays: stateRate.estimatedDays as number | null,
      codAvailable,
      serviceable: true,
      state: stateName || undefined,
      district: district || undefined,
    };
  } catch (error) {
    console.error('Error getting shipping rate:', error);
    return NOT_SERVICEABLE;
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
}export default {
  checkPincodeServiceability,
  getShippingRate,
  validatePincodeForCheckout,
  getCheckoutInfo,
  STATE_SHIPPING_RATES,
};
