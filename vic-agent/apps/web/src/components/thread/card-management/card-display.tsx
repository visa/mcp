import { CreditCard, Trash2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VisaLogoSVG } from "@/components/icons/visa";

interface CardData {
  lastFourDigits: string;
  cardholderName: string;
  cardBrand: string;
  expiryDate: string;
  status: "active" | "in_progress";
}

interface CardDisplayProps {
  cardData: CardData;
  onDelete: () => void;
}

export function CardDisplay({ cardData, onDelete }: CardDisplayProps) {
  const { lastFourDigits, cardholderName, cardBrand, expiryDate, status } =
    cardData;

  return (
    <Card className="border-[var(--visa-blue-primary)]/20 bg-gradient-to-br from-[var(--visa-blue-primary)]/5 to-transparent">
      <CardHeader className="flex-row justify-between items-start">
        <div className="flex items-center gap-2">
          {cardBrand === "Visa" ? (
            <VisaLogoSVG width={50} variant="blue" />
          ) : (
            <CreditCard className="size-8 text-[var(--visa-blue-primary)]" />
          )}
        </div>
        <Badge variant={status === "active" ? "success" : "warning"}>
          {status === "active" ? "Active" : "In Progress"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="text-lg font-medium">•••• {lastFourDigits}</div>
        <div className="text-sm text-[var(--visa-blue-primary)]">
          {cardholderName}
        </div>
        <div className="text-xs text-muted-foreground">
          Expires {expiryDate}
        </div>
        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4 mr-2" />
            Remove Card
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div
      onClick={onAddClick}
      className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[var(--visa-blue-primary)]/20 rounded-lg p-6 hover:border-[var(--visa-blue-light)] hover:bg-[var(--visa-blue-primary)]/5 cursor-pointer transition-all duration-200"
    >
      <VisaLogoSVG width={60} variant="blue" />
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-base font-semibold text-[var(--visa-blue-primary)]">
          Payment Card
        </h3>
        <p className="text-sm text-muted-foreground">
          To make purchases, enter your Visa card details
        </p>
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <span className="size-2 rounded-full bg-destructive" />
          Card not linked
        </p>
      </div>
      <Button variant="brand" size="sm" onClick={onAddClick}>
        Add Visa Card
      </Button>
    </div>
  );
}
