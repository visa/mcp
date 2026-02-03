import { CardDataPrompt } from "./interrupts/card-data-prompt";
import { VtsInitialAuthHandler } from "./interrupts/vts-initial-auth-handler";
import { VtsAuthenticateHandler } from "./interrupts/vts-authenticate-handler";
import { ValidationMethodPrompt } from "./interrupts/validation-method-prompt";
import { OtpInputPrompt } from "./interrupts/otp-input-prompt";
import { useStreamContext } from "@/providers/Stream";

/**
 * Centralized Interrupt Handler
 *
 * Renders interrupt-specific UI components based on the current interrupt value.
 * This ensures only one instance of each interrupt UI exists at any time.
 *
 * Supported interrupts with special UI:
 * - awaiting_card_data: Prompts user to enter card information
 * - awaiting_vts_authentication: Triggers initial VTS authentication flow (iframe-based)
 * - awaiting_authenticate_message: Triggers VTS device attestation flow (popup-based)
 * - awaiting_validation_method: Prompts user to select validation method
 * - awaiting_otp: Prompts user to enter one-time password
 *
 * Interrupts that don't need special UI (just wait for user input):
 * - awaiting_input: Used by expectUserIntent - no special UI needed
 */
export function InterruptHandler() {
  const { interrupt } = useStreamContext();

  if (!interrupt?.value || typeof interrupt.value !== "string") {
    return null;
  }

  // Map interrupt values to their UI components
  // Note: Only interrupts that need special UI are listed here
  // Interrupts like "awaiting_input" don't need special handling
  // Note: awaiting_vts_authentication uses iframe, awaiting_authenticate_message uses popup
  const interruptComponents: Record<string, React.ReactNode> = {
    awaiting_card_data: <CardDataPrompt key="card-data-prompt" />,
    awaiting_vts_authentication: (
      <VtsInitialAuthHandler key="vts-initial-auth" />
    ),
    awaiting_validation_method: (
      <ValidationMethodPrompt key="validation-method-prompt" />
    ),
    awaiting_otp: <OtpInputPrompt key="otp-input-prompt" />,
    awaiting_authenticate_message: (
      <VtsAuthenticateHandler key="vts-authenticate" />
    ),
  };

  const component = interruptComponents[interrupt.value];

  if (!component) {
    // No special UI for this interrupt type - user will just type naturally
    return null;
  }

  return <div className="flex items-start mr-auto gap-2">{component}</div>;
}
