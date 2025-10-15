/**
 * Utility functions for phone number parsing and normalization.
 */

/**
 * Parses a full phone number string into country code and local number.
 * Assumes country code starts with '+' and is 1-3 digits.
 * 
 * @param {string} fullPhone - Full phone number with country code, e.g. '+917608045737'
 * @returns {{ countryCode: string, localNumber: string }} Parsed parts
 */
function parsePhoneNumber(fullPhone) {
  if (!fullPhone || typeof fullPhone !== 'string') {
    return { countryCode: '', localNumber: '' };
  }
  // Special case for India country code +91 with 10 digit local number
  let match = fullPhone.match(/^(\+91)(\d{10})$/);
  if (match) {
    return { countryCode: match[1], localNumber: match[2] };
  }
  // First, try 1-2 digits for country code if local is 10 digits
  match = fullPhone.match(/^(\+\d{1,2})(\d+)$/);
  if (match && match[2].length === 10) {
    return { countryCode: match[1], localNumber: match[2] };
  }
  // Then, try 1-3 digits
  match = fullPhone.match(/^(\+\d{1,3})(\d+)$/);
  if (match) {
    return { countryCode: match[1], localNumber: match[2] };
  }
  // If no country code, assume empty country code and full number as local
  return { countryCode: '', localNumber: fullPhone };
}

/**
 * Normalizes phone number for storage (local number only).
 * 
 * @param {string} fullPhone - Full phone number with country code
 * @returns {string} Local phone number without country code
 */
function normalizeForStorage(fullPhone) {
  const { localNumber } = parsePhoneNumber(fullPhone);
  return localNumber;
}

/**
 * Formats phone number for sending OTP (country code + local number).
 * 
 * @param {string} countryCode 
 * @param {string} localNumber 
 * @returns {string} Full phone number with country code
 */
function formatForSending(countryCode, localNumber) {
  return `${countryCode}${localNumber}`;
}

module.exports = {
  parsePhoneNumber,
  normalizeForStorage,
  formatForSending,
};
