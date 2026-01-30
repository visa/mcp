import { useState } from "react";
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
import { cardFormSchema, type CardFormData } from "@/lib/validations/card";
import { formatCardNumber, formatExpiryDate } from "@/lib/utils/card-utils";
import { toast } from "sonner";

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (cardData: CardFormData) => void;
  onCardAdded?: (cardData: CardFormData) => void;
}

interface FormErrors {
  cardNumber?: string;
  cardholderName?: string;
  email?: string;
  expiryDate?: string;
  cvv?: string;
}

export function AddCardModal({
  open,
  onOpenChange,
  onSubmit,
  onCardAdded,
}: AddCardModalProps) {
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardholderName: "",
    email: "",
    expiryDate: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof typeof formData, value: string) => {
    let formattedValue = value;

    // Apply formatting for specific fields
    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiryDate") {
      formattedValue = formatExpiryDate(value);
    } else if (field === "cvv") {
      // Only allow digits for CVV
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: keyof typeof formData) => {
    try {
      // Validate individual field
      const fieldSchema = cardFormSchema.shape[field];
      fieldSchema.parse(formData[field]);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        setErrors((prev) => ({
          ...prev,
          [field]: zodError.errors[0]?.message,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      cardNumber: true,
      cardholderName: true,
      email: true,
      expiryDate: true,
      cvv: true,
    });

    // Validate all fields
    try {
      const validatedData = cardFormSchema.parse(formData);
      onSubmit?.(validatedData);
      onCardAdded?.(validatedData);
      // Reset form
      setFormData({
        cardNumber: "",
        cardholderName: "",
        email: "",
        expiryDate: "",
        cvv: "",
      });
      setErrors({});
      setTouched({});
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>;
        };
        const newErrors: FormErrors = {};
        zodError.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please check your card details");
      }
    }
  };

  const handleCancel = () => {
    // Reset form when canceling
    setFormData({
      cardNumber: "",
      cardholderName: "",
      email: "",
      expiryDate: "",
      cvv: "",
    });
    setErrors({});
    setTouched({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--visa-blue-primary)] font-semibold">
            Add Visa Card
          </DialogTitle>
          <DialogDescription>
            Enter your Visa card details to link a payment method. Only Visa
            cards are supported at this time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Card Number */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="cardNumber"
              className="text-sm font-medium text-[var(--visa-blue-primary)]"
            >
              Card Number
            </Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => handleChange("cardNumber", e.target.value)}
              onBlur={() => handleBlur("cardNumber")}
              aria-invalid={touched.cardNumber && !!errors.cardNumber}
              maxLength={23} // 19 digits + 4 spaces
            />
            {touched.cardNumber && errors.cardNumber && (
              <p className="text-xs text-destructive mt-1">
                {errors.cardNumber}
              </p>
            )}
          </div>

          {/* Cardholder Name */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="cardholderName"
              className="text-sm font-medium text-[var(--visa-blue-primary)]"
            >
              Cardholder Name
            </Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="John Doe"
              value={formData.cardholderName}
              onChange={(e) => handleChange("cardholderName", e.target.value)}
              onBlur={() => handleBlur("cardholderName")}
              aria-invalid={touched.cardholderName && !!errors.cardholderName}
            />
            {touched.cardholderName && errors.cardholderName && (
              <p className="text-xs text-destructive mt-1">
                {errors.cardholderName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-[var(--visa-blue-primary)]"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              aria-invalid={touched.email && !!errors.email}
            />
            {touched.email && errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          {/* Expiry Date and CVV */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <Label
                htmlFor="expiryDate"
                className="text-sm font-medium text-[var(--visa-blue-primary)]"
              >
                Expiry Date
              </Label>
              <Input
                id="expiryDate"
                type="text"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
                onBlur={() => handleBlur("expiryDate")}
                aria-invalid={touched.expiryDate && !!errors.expiryDate}
                maxLength={5} // MM/YY
              />
              {touched.expiryDate && errors.expiryDate && (
                <p className="text-xs text-destructive mt-1">
                  {errors.expiryDate}
                </p>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <Label
                htmlFor="cvv"
                className="text-sm font-medium text-[var(--visa-blue-primary)]"
              >
                CVV
              </Label>
              <Input
                id="cvv"
                type="password"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleChange("cvv", e.target.value)}
                onBlur={() => handleBlur("cvv")}
                aria-invalid={touched.cvv && !!errors.cvv}
                maxLength={4}
              />
              {touched.cvv && errors.cvv && (
                <p className="text-xs text-destructive mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="brand">
              Add Card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
