/**
 * Detect card brand from card number
 * @param cardNumber - Card number (with or without spaces)
 * @returns Card brand name (Visa, Mastercard, Amex, Discover, or Unknown)
 */
export function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, "");

  // Visa: starts with 4
  if (/^4/.test(cleaned)) {
    return "Visa";
  }

  // Mastercard: 51-55 or 2221-2720
  if (
    /^5[1-5]/.test(cleaned) ||
    /^2(22[1-9]|2[3-9]|[3-6]|7[01]|720)/.test(cleaned)
  ) {
    return "Mastercard";
  }

  // American Express: starts with 34 or 37
  if (/^3[47]/.test(cleaned)) {
    return "Amex";
  }

  // Discover: starts with 6011, 622126-622925, 644-649, or 65
  if (/^6011|^622[1-9]|^64[4-9]|^65/.test(cleaned)) {
    return "Discover";
  }

  return "Unknown";
}

/**
 * Format card number with spaces (4-digit groups)
 * @param value - Raw card number input
 * @returns Formatted card number with spaces
 */
export function formatCardNumber(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, "");

  // Limit to 19 digits (max card number length)
  const limited = cleaned.slice(0, 19);

  // Add spaces every 4 digits
  const formatted = limited.replace(/(\d{4})(?=\d)/g, "$1 ");

  return formatted;
}

/**
 * Format expiry date (MM/YY with auto-slash)
 * @param value - Raw expiry date input
 * @returns Formatted expiry date MM/YY
 */
export function formatExpiryDate(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, "");

  // Limit to 4 digits (MMYY)
  const limited = cleaned.slice(0, 4);

  // Add slash after MM
  if (limited.length >= 2) {
    return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  }

  return limited;
}

/**
 * Get last 4 digits of card number
 * @param cardNumber - Full card number (with or without spaces)
 * @returns Last 4 digits
 */
export function getLastFourDigits(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, "");
  return cleaned.slice(-4);
}
