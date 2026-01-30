import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  lastFourDigits: string;
}

export function DeleteCardDialog({
  open,
  onOpenChange,
  onConfirm,
  lastFourDigits,
}: DeleteCardDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--visa-blue-primary)] font-semibold">
            Remove Card
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the card ending in {lastFourDigits}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            Remove Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
