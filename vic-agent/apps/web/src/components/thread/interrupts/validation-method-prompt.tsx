import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStreamContext } from "@/providers/Stream";
import { Shield, Mail, Phone, Smartphone, HeadphonesIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Map method types to icons and labels
 */
const METHOD_INFO: Record<
  string,
  { icon: React.ComponentType<any>; label: string }
> = {
  OTPEMAIL: { icon: Mail, label: "Email" },
  OTPSMS: { icon: Phone, label: "SMS" },
  OTPONLINEBANKING: { icon: Smartphone, label: "Online Banking" },
  CUSTOMERSERVICE: { icon: HeadphonesIcon, label: "Customer Service" },
  "APP-TO-APP": { icon: Smartphone, label: "App to App" },
  OUTBOUNDCALL: { icon: Phone, label: "Outbound Call" },
};

/**
 * Validation method prompt component shown when the graph interrupts waiting for validation method selection.
 * Displays available validation methods and allows user to select one.
 */
export function ValidationMethodPrompt() {
  const stream = useStreamContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get validation methods from state
  const validationMethods = stream.values?.validationMethods || [];

  const handleMethodSelect = (selectedMethod: {
    method: string;
    value: string;
  }) => {
    // Send only method and value - backend will find identifier from deviceBindingResponse
    stream.submit(
      {
        private_selectedValidationMethod: {
          method: selectedMethod.method,
          value: selectedMethod.value,
          // identifier will be added by backend in expectValidationMethod node
        },
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
              Validation Method Required
            </p>
            <p className="text-sm text-gray-700">
              Please choose your preferred validation method to continue
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="brand"
          className="w-full sm:w-auto"
        >
          <Shield className="w-4 h-4 mr-2" />
          Select Method
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Validation Method</DialogTitle>
            <DialogDescription>
              Select how you would like to verify your identity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {validationMethods.map((method, index) => {
              const methodInfo = METHOD_INFO[method.method] || {
                icon: Shield,
                label: method.method,
              };
              const Icon = methodInfo.icon;

              return (
                <button
                  key={index}
                  onClick={() => handleMethodSelect(method)}
                  className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
                >
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="w-5 h-5 text-[var(--visa-blue-primary)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {methodInfo.label}
                    </p>
                    <p className="text-sm text-gray-600">{method.value}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
