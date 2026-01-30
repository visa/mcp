import { useState, useEffect, useRef } from "react";
import { CardDisplay, EmptyState } from "./card-display";
import { AddCardModal } from "./add-card-modal";
import { DeleteCardDialog } from "./delete-card-dialog";
import { type CardFormData } from "@/lib/validations/card";
import { detectCardBrand, getLastFourDigits } from "@/lib/utils/card-utils";
import { toast } from "sonner";
import {
  storeFullCardData,
  clearFullCardData,
  getTokenId,
} from "@/lib/card-storage";
import { useStreamContext } from "@/providers/Stream";

interface CardData {
  lastFourDigits: string;
  cardholderName: string;
  cardBrand: string;
  expiryDate: string;
  status: "active" | "in_progress";
}

const CARD_STORAGE_KEY = "visa-card-data";

export function CardSection() {
  const stream = useStreamContext();
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load card data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CARD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCardData(parsed);
      }
    } catch (error) {
      console.error("Failed to load card data:", error);
    }
  }, []);

  // Save card data to localStorage whenever it changes
  useEffect(() => {
    try {
      if (cardData) {
        localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(cardData));
      } else {
        localStorage.removeItem(CARD_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save card data:", error);
    }
  }, [cardData]);

  // Watch for cardDeletionSignal changes to trigger card clearing
  // Using a ref to track the last processed signal value
  const lastDeletionSignalRef = useRef<number>(0);

  useEffect(() => {
    const currentSignal = stream.values?.cardDeletionSignal ?? 0;

    // If signal incremented and we have card data, clear it
    if (currentSignal > lastDeletionSignalRef.current && cardData) {
      console.log("[CardSection] Deletion signal received, clearing UI");

      // Clear localStorage (full card data + token ID)
      clearFullCardData();

      // Clear React state for UI update
      setCardData(null);

      // Show success toast
      toast.success("Card removed successfully");

      // Update ref to prevent re-processing same signal
      lastDeletionSignalRef.current = currentSignal;

      console.log("=== UI: CARD DATA CLEARED ===");
    } else if (currentSignal > lastDeletionSignalRef.current) {
      // Signal incremented but no card data - update ref anyway
      console.log("=== UI: SIGNAL UPDATED (NO CARD) ===");
      lastDeletionSignalRef.current = currentSignal;
    }
  }, [stream.values?.cardDeletionSignal, cardData]);

  const handleCardSubmit = (formData: CardFormData) => {
    // Store full card data to localStorage (for backend submissions)
    storeFullCardData({
      cardNumber: formData.cardNumber,
      expiryDate: formData.expiryDate,
      cvv: formData.cvv,
      cardholderName: formData.cardholderName,
      email: formData.email,
    });

    // Transform form data to card data
    const newCardData: CardData = {
      lastFourDigits: getLastFourDigits(formData.cardNumber),
      cardholderName: formData.cardholderName,
      cardBrand: detectCardBrand(formData.cardNumber),
      expiryDate: formData.expiryDate,
      status: "in_progress", // Default to in_progress, will be activated later
    };

    // Set cardData state (triggers localStorage save via useEffect)
    setCardData(newCardData);

    // Show success toast
    toast.success("Card added successfully");

    // Close modal
    setModalOpen(false);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // Get token ID from localStorage to send to agent
    const tokenId = getTokenId();

    // Send action to agent to trigger delete card subgraph
    // Agent will call delete-token MCP API and signal UI to clear storage
    stream.submit(
      {
        action: "delete-card", // Public action field
        private_tokenId: tokenId, // Include token ID so agent can delete it
      },
      {
        streamMode: ["values"],
        config: {
          configurable: {
            model: stream.currentModel,
          },
        },
      },
    );

    // Note: Don't clear localStorage here - wait for agent signal
    // Agent will set shouldClearCardStorage: true after successful deletion
    // thread/index.tsx will handle the actual localStorage clearing
  };

  return (
    <>
      {cardData ? (
        <CardDisplay cardData={cardData} onDelete={handleDeleteClick} />
      ) : (
        <EmptyState onAddClick={() => setModalOpen(true)} />
      )}

      <AddCardModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCardSubmit}
      />

      {cardData && (
        <DeleteCardDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          lastFourDigits={cardData.lastFourDigits}
        />
      )}
    </>
  );
}
