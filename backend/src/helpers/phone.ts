// helpers/phone.ts

/**
 * Normalize phone number to E.164 format
 * E.164: +[country code][subscriber number]
 * Example: +12025551234
 */
export const normalizePhone = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If it starts with 1 (US/Canada), add +
  if (digits.startsWith("1") && digits.length === 11) {
    return `+${digits}`;
  }

  // If it's 10 digits, assume US/Canada (+1)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it already has country code (starts with +)
  if (phone.startsWith("+")) {
    return `+${digits}`;
  }

  // Otherwise return with +
  return `+${digits}`;
};

/**
 * Validate E.164 format
 */
export const isValidE164 = (phone: string): boolean => {
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

/**
 * Format phone for display (US format)
 * +12025551234 -> (202) 555-1234
 */
export const formatPhoneDisplay = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7);
    return `(${areaCode}) ${prefix}-${line}`;
  }

  return phone; // Return as-is if not US format
};
