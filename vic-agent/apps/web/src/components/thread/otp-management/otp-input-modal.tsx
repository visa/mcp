import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { otpCodeSchema } from "@/lib/validations/otp";
import { toast } from "sonner";

interface OtpInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (otpCode: string) => void;
}

export function OtpInputModal({
  open,
  onOpenChange,
  onSubmit,
}: OtpInputModalProps) {
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        const input = document.getElementById("otpCode");
        if (input) {
          (input as HTMLInputElement).focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleChange = (value: string) => {
    // Only allow digits
    const formattedValue = value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(formattedValue);

    // Clear error when user starts typing
    if (error) {
      setError(undefined);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateField();
  };

  const validateField = () => {
    try {
      otpCodeSchema.parse(otpCode);
      setError(undefined);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errors" in err) {
        const zodError = err as { errors: Array<{ message: string }> };
        setError(zodError.errors[0]?.message);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark as touched
    setTouched(true);

    // Validate
    try {
      const validatedCode = otpCodeSchema.parse(otpCode);
      onSubmit?.(validatedCode);
      // Reset form
      setOtpCode("");
      setError(undefined);
      setTouched(false);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errors" in err) {
        const zodError = err as { errors: Array<{ message: string }> };
        setError(zodError.errors[0]?.message);
        toast.error("Please enter a valid 6-digit OTP code");
      }
    }
  };

  const handleCancel = () => {
    // Reset form when canceling
    setOtpCode("");
    setError(undefined);
    setTouched(false);
    onOpenChange(false);
  };

  // Check if form is valid for submit button
  const isValid = otpCode.length === 6 && /^[0-9]+$/.test(otpCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--visa-blue-primary)] font-semibold">
            Enter Verification Code
          </DialogTitle>
          <DialogDescription>
            Please enter the 6-digit verification code sent to your device.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* OTP Code Input */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="otpCode"
              className="text-sm font-medium text-[var(--visa-blue-primary)]"
            >
              Verification Code
            </Label>
            <Input
              id="otpCode"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              aria-invalid={touched && !!error}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
            {touched && error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={!isValid}>
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
