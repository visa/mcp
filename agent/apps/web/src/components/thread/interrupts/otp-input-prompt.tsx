import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OtpInputModal } from "../otp-management/otp-input-modal";
import { useStreamContext } from "@/providers/Stream";
import { Shield } from "lucide-react";

/**
 * OTP input prompt component shown when the graph interrupts waiting for OTP code.
 * Displays a message asking the user to enter the verification code and provides a button to open the modal.
 */
export function OtpInputPrompt() {
  const stream = useStreamContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOtpSubmit = (otpCode: string) => {
    // Resume the graph with OTP code
    stream.submit(
      {
        private_otpCode: otpCode,
      } as any,
      {
        streamMode: ["values"],
        config: {
          configurable: {
            model: stream.currentModel,
          },
        },
      },
    );

    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-5 h-5 text-[var(--visa-blue-primary)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--visa-blue-primary)] mb-1">
              One-Time Password Required
            </p>
            <p className="text-sm text-gray-700">
              Please enter the 6-digit verification code sent to your device.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="brand"
          className="w-full sm:w-auto"
        >
          <Shield className="w-4 h-4 mr-2" />
          Enter Code
        </Button>
      </div>

      <OtpInputModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleOtpSubmit}
      />
    </>
  );
}
