import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CardSection } from "./card-management/card-section";
import { getAvailableModels } from "@/lib/models";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: string;
  onModelChange: (model: string) => void;
  onStartNewThread: () => void;
}

export function SettingsPanel({
  open,
  onOpenChange,
  currentModel,
  onModelChange,
  onStartNewThread,
}: SettingsPanelProps) {
  const [tempModel, setTempModel] = useState(currentModel);
  const modelChanged = tempModel !== currentModel;
  const hasChanges = modelChanged;

  const handleApply = () => {
    if (modelChanged) {
      onModelChange(tempModel);
    }
    if (hasChanges) {
      onStartNewThread(); // Force new thread when settings change
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-[var(--visa-blue-primary)]">
            Settings
          </SheetTitle>
          <SheetDescription className="text-base">
            Configure your agent settings
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 mt-6 px-4">
          {/* Card Section */}
          <CardSection />

          {/* Separator */}
          <Separator />

          <div className="flex flex-col gap-3">
            <Label
              htmlFor="settings-model"
              className="text-base font-semibold text-[var(--visa-blue-primary)]"
            >
              Model
            </Label>
            <p className="text-base text-muted-foreground">
              Select the language model for the agent. Changing the model will
              start a new conversation thread.
            </p>
            <Select value={tempModel} onValueChange={setTempModel}>
              <SelectTrigger id="settings-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAvailableModels().map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Separator */}
          <Separator />

          {hasChanges && (
            <div className="bg-[var(--visa-gold)]/10 border-2 border-[var(--visa-gold)] rounded-md p-4 text-base">
              <p className="font-semibold text-[var(--visa-blue-primary)] mb-2">
                Note:
              </p>
              <p className="text-[var(--visa-blue-primary)]">
                Changing settings will start a new conversation thread. Your
                current conversation will be saved in history.
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={!hasChanges}>
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
