/**
 * SHIPPING RATE CONFIGURATION
 * 
 * This file contains the shipping rates for different regions.
 * You should customize these based on:
 * 1. Your actual shipping costs with Shipneer
 * 2. Distance from manufacturing hub (500067)
 * 3. Your business margins
 * 
 * HOW TO USE:
 * 1. Use Shipneer's rate calculator on their website for sample pincodes
 * 2. Group pincodes by similar rates
 * 3. Define rate tiers below
 * 4. Update the rate detection logic in pincodeService.ts
 */

export const REGION_RATES = {
  // Telangana & Nearby States (500067 hub)
  // Sample pincodes: 500001-500100, etc.
  telangana: {
    charge: 40,
    estimatedDays: 1,
    codAvailable: true,
    description: 'Telangana & nearby areas',
  },

  // Neighboring States (AP, Karnataka, Maharashtra)
  // Distance: ~200-400km
  neighboring: {
    charge: 60,
    estimatedDays: 2,
    codAvailable: true,
    description: 'Neighboring states',
  },

  // North India (Delhi, UP, Rajasthan, etc.)
  // Distance: ~1000-1500km
  north: {
    charge: 90,
    estimatedDays: 3,
    codAvailable: true,
    description: 'North India',
  },

  // South India (Kerala, TN, etc.)
  // Distance: ~500-1000km
  south: {
    charge: 80,
    estimatedDays: 3,
    codAvailable: true,
    description: 'South India',
  },

  // East India (WB, Odisha, etc.)
  // Distance: ~1200-1500km
  east: {
    charge: 100,
    estimatedDays: 4,
    codAvailable: true,
    description: 'East India',
  },

  // North East India
  // Distance: >1500km, Limited transport
  northeast: {
    charge: 150,
    estimatedDays: 5,
    codAvailable: false,
    description: 'North East India',
  },

  // Islands & Remote Areas
  // Distance: Very far, Limited transport
  remote: {
    charge: 200,
    estimatedDays: 7,
    codAvailable: false,
    description: 'Remote/Island areas',
  },
};

/**
 * PINCODE TO REGION MAPPING
 * 
 * This maps pincode prefixes to regions.
 * You can enhance this with actual distance calculations later.
 * 
 * Format: First 2-3 digits of pincode indicate region
 */
export const PINCODE_REGION_MAP = {
  // Telangana (500000 - 509999)
  '5': 'telangana',

  // Andhra Pradesh (517000-533199)
  '51': 'neighboring',
  '52': 'neighboring',
  '53': 'neighboring',

  // Karnataka (560000-591999)
  '56': 'neighboring',
  '57': 'neighboring',
  '58': 'neighboring',
  '59': 'neighboring',

  // Maharashtra (400000-445402)
  '40': 'neighboring',
  '41': 'neighboring',
  '42': 'neighboring',
  '43': 'neighboring',
  '44': 'neighboring',

  // Gujarat (360000-396521)
  '36': 'neighboring',
  '37': 'neighboring',
  '38': 'neighboring',
  '39': 'neighboring',

  // Delhi (110001-110097)
  '11': 'north',

  // Uttar Pradesh (201001-285203)
  '20': 'north',
  '21': 'north',
  '22': 'north',
  '23': 'north',
  '24': 'north',
  '25': 'north',
  '26': 'north',
  '27': 'north',
  '28': 'north',

  // Rajasthan (300001-345033)
  '30': 'north',
  '31': 'north',
  '32': 'north',
  '33': 'north',
  '34': 'north',

  // Haryana & Punjab
  '12': 'north',
  '13': 'north',
  '14': 'north',
  '15': 'north',
  '16': 'north',

  // Himachal & J&K
  '17': 'north',
  '19': 'north',

  // Tamil Nadu & Puducherry (600001-643252)
  '60': 'south',
  '61': 'south',
  '62': 'south',
  '63': 'south',
  '64': 'south',

  // Kerala (670001-695613)
  '67': 'south',
  '68': 'south',
  '69': 'south',

  // West Bengal (700001-743714)
  '70': 'east',
  '71': 'east',
  '72': 'east',
  '73': 'east',
  '74': 'east',

  // Odisha (751001-770069)
  '75': 'east',
  '76': 'east',
  '77': 'east',

  // Jharkhand (813001-835325)
  '81': 'east',
  '82': 'east',
  '83': 'east',

  // Bihar (800001-855107)
  '80': 'east',
  '84': 'east',
  '85': 'east',

  // Assam & North East
  '78': 'northeast',
  '79': 'northeast',
  '78': 'northeast',
  '79': 'northeast',
  '79': 'northeast',
};

/**
 * SPECIAL CASE PINCODES
 * 
 * Some pincodes might have special handling:
 * - High altitudes (slower delivery)
 * - Islands (more expensive)
 * - Conflict areas (special requirements)
 */
export const SPECIAL_PINCODES = {
  // Lakshadweep Islands
  682551: { charge: 300, estimatedDays: 7, codAvailable: false },
  682552: { charge: 300, estimatedDays: 7, codAvailable: false },
  682553: { charge: 300, estimatedDays: 7, codAvailable: false },

  // Andaman & Nicobar (too remote, skip)
  // 744101: { serviceable: false },

  // Ladakh (special handling)
  194401: { charge: 250, estimatedDays: 7, codAvailable: false },
};

/**
 * HOW TO CUSTOMIZE:
 * 
 * 1. Get your actual rates from Shipneer for key pincodes:
 *    - 110001 (Delhi)
 *    - 400001 (Mumbai)
 *    - 560001 (Bangalore)
 *    - 700001 (Kolkata)
 *    - 600001 (Chennai)
 *    - 500001 (Hyderabad)
 *    - etc.
 * 
 * 2. Update the REGION_RATES above with your actual costs
 * 
 * 3. Refine the PINCODE_REGION_MAP based on distance calculations
 * 
 * 4. Add any special cases to SPECIAL_PINCODES
 * 
 * 5. In pincodeService.ts, enhance the getShippingRate() function
 *    to use this configuration
 */

export default {
  REGION_RATES,
  PINCODE_REGION_MAP,
  SPECIAL_PINCODES,
};
