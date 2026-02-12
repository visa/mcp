import { z } from "zod";

/**
 * OTP code schema with validation
 * - Must be exactly 6 digits
 * - Only numeric characters allowed
 * - Required field
 */
export const otpCodeSchema = z
  .string()
  .min(1, "OTP code is required")
  .length(6, "OTP code must be exactly 6 digits")
  .regex(/^[0-9]+$/, "OTP code must contain only digits");

// Type inference for OTP data
export type OtpFormData = z.infer<typeof otpCodeSchema>;
