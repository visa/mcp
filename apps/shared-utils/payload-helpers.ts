/**
 * Common payload helper utilities
 * Shared functions for building tool payloads across different tools
 */

/**
 * Generates a Unix timestamp string (seconds since epoch) for the current time
 * @returns Unix timestamp string (max 12 characters as required by API)
 */
export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Generates a Unix timestamp string (seconds since epoch) for a future date
 * @param yearsFromNow Number of years from now (default: 1)
 * @returns Unix timestamp string (max 12 characters as required by API)
 */
export function generateEffectiveUntil(yearsFromNow: number = 1): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + yearsFromNow);
  return Math.floor(date.getTime() / 1000).toString();
}

/**
 * Generates a national identifier string
 * @param countryCode Country code (e.g., 'US', 'CA')
 * @returns National identifier string in format "COUNTRY-ID-RANDOM"
 */
export function generateNationalIdentifier(countryCode: string): string {
  const randomInt = Math.floor(Math.random() * 1000000);
  return `${countryCode}-ID-${randomInt}`;
}

/**
 * Builds a mandate object for purchase instructions
 * @param options - Optional configuration for the mandate
 * @param options.mandateId - Unique mandate identifier (generates UUID if not provided)
 * @param options.amount - Transaction amount (default: '800.00')
 * @param options.currencyCode - Currency code (default: 'USD')
 * @param options.isRecurring - Whether mandate is recurring (default: false)
 * @param options.effectiveUntilTime - Expiration timestamp (generates 1 year from now if not provided)
 * @returns Mandate object with all required fields
 */
export function buildMandate(options?: {
  mandateId?: string;
  amount?: string;
  currencyCode?: string;
  isRecurring?: boolean;
  effectiveUntilTime?: string;
}): Record<string, unknown> {
  const mandateId = options?.mandateId || crypto.randomUUID();
  const amount = options?.amount || '800.00';
  const currencyCode = options?.currencyCode || 'USD';
  const isRecurring = options?.isRecurring ?? false;
  const effectiveUntilTime = options?.effectiveUntilTime || generateEffectiveUntil(1);

  const mandate: Record<string, unknown> = {
    mandateId,
    preferredMerchantName: 'Best Buy',
    merchantCategory: 'Electronics',
    merchantCategoryCode: '1234',
    declineThreshold: {
      amount,
      currencyCode,
    },
    effectiveUntilTime,
    quantity: '1',
    description: 'Iphone 16',
  };

  // Only add recurringFrequency if mandate is recurring
  if (isRecurring) {
    mandate.recurringFrequency = 'WEEKLY';
  }

  return mandate;
}
