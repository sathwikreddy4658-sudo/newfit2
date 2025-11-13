/**
 * Validation utilities for Indian addresses and phone numbers
 */

/**
 * Validate Indian phone number
 * Accepts: 10-digit numbers with or without country code (+91)
 */
export function validateIndianPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's 10 digits (without country code)
  if (cleaned.length === 10) {
    // Check if it starts with a valid Indian prefix (6-9 for mobile, 1-9 for landline)
    return /^[6-9]\d{9}$/.test(cleaned);
  }
  
  // Check if it's 12 digits with country code 91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return /^91[6-9]\d{9}$/.test(cleaned);
  }
  
  return false;
}

/**
 * Format phone number to standard format
 * Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, or XXXXXXXXXX
 * Returns: 10-digit number without country code
 */
export function formatIndianPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.substring(2);
  }
  
  return phone; // Return original if validation fails
}

/**
 * Validate address
 */
export function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  // Address should be at least 10 characters and at most 500
  return trimmed.length >= 10 && trimmed.length <= 500;
}

/**
 * Get formatted address error message
 */
export function getAddressErrorMessage(address: string): string {
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return 'Address is required';
  }
  if (trimmed.length < 10) {
    return 'Address must be at least 10 characters';
  }
  if (trimmed.length > 500) {
    return 'Address must not exceed 500 characters';
  }
  return '';
}

/**
 * Get formatted phone number error message
 */
export function getPhoneNumberErrorMessage(phone: string): string {
  if (!phone) {
    return 'Phone number is required';
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  
  if (cleaned.length > 12) {
    return 'Phone number is too long';
  }
  
  if (!validateIndianPhoneNumber(phone)) {
    return 'Please enter a valid Indian phone number (10 digits starting with 6-9)';
  }
  
  return '';
}
