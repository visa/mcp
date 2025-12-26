/**
 * Zod schemas for validating MCP tool responses
 * Ensures runtime type safety and catches API contract changes
 */

import { z } from 'zod';

/**
 * Base response schema - common fields across all tool responses
 */
export const BaseToolResponseSchema = z.object({
  correlationId: z.string().min(1, 'Correlation ID is required'),
});

/**
 * Enroll card response schema
 */
export const EnrollCardResponseSchema = BaseToolResponseSchema.extend({
  data: z.object({
    clientReferenceId: z.string().min(1),
    status: z.string(),
    pendingEvents: z.array(z.string()).optional(),
  }),
});

export type EnrollCardResponse = z.infer<typeof EnrollCardResponseSchema>;

/**
 * Initiate purchase instruction response schema
 */
export const InitiatePurchaseInstructionResponseSchema = BaseToolResponseSchema.extend({
  data: z.object({
    clientReferenceId: z.string().min(1),
    instructionId: z.string().min(1),
    status: z.string().optional(),
    pendingEvents: z.array(z.string()).optional(),
  }),
});

export type InitiatePurchaseInstructionResponse = z.infer<
  typeof InitiatePurchaseInstructionResponseSchema
>;

/**
 * Update purchase instruction response schema
 */
export const UpdatePurchaseInstructionResponseSchema = BaseToolResponseSchema.extend({
  data: z.object({
    clientReferenceId: z.string().min(1),
    instructionId: z.string().min(1),
    status: z.string().optional(),
    pendingEvents: z.array(z.string()).optional(),
  }),
});

export type UpdatePurchaseInstructionResponse = z.infer<
  typeof UpdatePurchaseInstructionResponseSchema
>;

/**
 * Cancel purchase instruction response schema
 */
export const CancelPurchaseInstructionResponseSchema = BaseToolResponseSchema.extend({
  data: z.object({
    clientReferenceId: z.string().min(1),
    instructionId: z.string().min(1),
    status: z.string().optional(),
  }),
});

export type CancelPurchaseInstructionResponse = z.infer<
  typeof CancelPurchaseInstructionResponseSchema
>;

/**
 * Retrieve payment credentials response schema
 */
export const RetrievePaymentCredentialsResponseSchema = BaseToolResponseSchema.extend({
  data: z.object({
    clientReferenceId: z.string().min(1),
    credentials: z.array(
      z.object({
        cardNumber: z.string(),
        expirationDate: z.string(),
        cvv: z.string(),
        cardholderName: z.string().optional(),
      })
    ),
  }),
});

export type RetrievePaymentCredentialsResponse = z.infer<
  typeof RetrievePaymentCredentialsResponseSchema
>;

/**
 * Confirm transaction events response schema
 */
export const ConfirmTransactionEventsResponseSchema = BaseToolResponseSchema.extend({
  data: z.object({
    clientReferenceId: z.string().min(1),
  }),
});

export type ConfirmTransactionEventsResponse = z.infer<
  typeof ConfirmTransactionEventsResponseSchema
>;

/**
 * Map of tool names to their response schemas
 * Used for automatic response validation based on tool name
 */
export const ToolResponseSchemas: Record<string, z.ZodSchema> = {
  'enroll-card': EnrollCardResponseSchema,
  'initiate-purchase-instruction': InitiatePurchaseInstructionResponseSchema,
  'update-purchase-instruction': UpdatePurchaseInstructionResponseSchema,
  'cancel-purchase-instruction': CancelPurchaseInstructionResponseSchema,
  'retrieve-payment-credentials': RetrievePaymentCredentialsResponseSchema,
  'confirm-transaction-events': ConfirmTransactionEventsResponseSchema,
};

/**
 * Validates a tool response against its schema
 *
 * @param toolName - Name of the tool
 * @param response - Response data to validate
 * @returns Validated and typed response
 * @throws {z.ZodError} If validation fails
 */
export function validateToolResponse<T = unknown>(toolName: string, response: unknown): T {
  const schema = ToolResponseSchemas[toolName];

  if (!schema) {
    // No schema defined for this tool, return response as-is
    return response as T;
  }

  return schema.parse(response) as T;
}
