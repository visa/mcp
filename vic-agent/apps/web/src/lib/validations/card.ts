import { z } from "zod";

/**
 * Luhn algorithm for card number validation
 * @param cardNumber - Card number string (digits only)
 * @returns true if valid, false otherwise
 */
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let isEven = false;

  // Loop through digits from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate expiry date is not in the past
 * @param expiryDate - Expiry date in MM/YY format
 * @returns true if valid (not expired), false otherwise
 */
function isValidExpiryDate(expiryDate: string): boolean {
  const [month, year] = expiryDate.split("/").map(Number);
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Get last 2 digits of year
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed

  // Check if year is in the past
  if (year < currentYear) {
    return false;
  }

  // If same year, check if month is in the past
  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Check if card number is a Visa card
 * @param cardNumber - Card number string (digits only)
 * @returns true if Visa, false otherwise
 */
function isVisaCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, "");
  return /^4/.test(cleaned);
}

// Card number schema with Luhn validation and Visa-only restriction
export const cardNumberSchema = z
  .string()
  .min(13, "Card number must be at least 13 digits")
  .max(19, "Card number must be at most 19 digits")
  .regex(/^[0-9\s]+$/, "Card number must contain only digits")
  .transform((val) => val.replace(/\s/g, "")) // Remove spaces
  .refine(luhnCheck, "Invalid card number")
  .refine(isVisaCard, "Only Visa cards are supported at this time");

// Complete card form schema
export const cardFormSchema = z.object({
  cardNumber: cardNumberSchema,
  cardholderName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  expiryDate: z
    .string()
    .regex(
      /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
      "Invalid format. Use MM/YY (e.g., 12/25)",
    )
    .refine(isValidExpiryDate, "Card has expired"),
  cvv: z
    .string()
    .min(3, "CVV must be 3 or 4 digits")
    .max(4, "CVV must be 3 or 4 digits")
    .regex(/^[0-9]+$/, "CVV must contain only digits"),
});

// Type inference for form data
export type CardFormData = z.infer<typeof cardFormSchema>;
