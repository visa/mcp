/**
 * Card storage utilities for securely handling full card data.
 *
 * Security approach:
 * - Full card data stored in localStorage (persists across tabs and sessions)
 * - Display data (last 4 digits) stored in localStorage (persists)
 * - Full data cleared when user explicitly removes the card
 */

const FULL_CARD_DATA_KEY = "visa-full-card-data";

export interface FullCardData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  email: string;
}

/**
 * Store full card data in localStorage.
 * This data will persist across tabs and browser sessions.
 *
 * @param cardData - Full card data including sensitive information
 */
export function storeFullCardData(cardData: FullCardData): void {
  try {
    localStorage.setItem(FULL_CARD_DATA_KEY, JSON.stringify(cardData));
  } catch (error) {
    console.error("Failed to store card data:", error);
  }
}

/**
 * Retrieve full card data from localStorage.
 *
 * @returns Full card data or null if not found
 */
export function getFullCardData(): FullCardData | null {
  try {
    const data = localStorage.getItem(FULL_CARD_DATA_KEY);
    if (!data) return null;
    return JSON.parse(data) as FullCardData;
  } catch (error) {
    console.error("Failed to retrieve card data:", error);
    return null;
  }
}

/**
 * Clear full card data from localStorage.
 * Should be called when user explicitly removes the card.
 * Also clears the associated token ID.
 */
export function clearFullCardData(): void {
  try {
    localStorage.removeItem(FULL_CARD_DATA_KEY);
    clearTokenId(); // Also clear token ID when card is removed
    console.log("[Card Storage] Card data and token ID cleared");
  } catch (error) {
    console.error("Failed to clear card data:", error);
  }
}

/**
 * Check if full card data exists in localStorage.
 *
 * @returns true if card data exists, false otherwise
 */
export function hasFullCardData(): boolean {
  try {
    return localStorage.getItem(FULL_CARD_DATA_KEY) !== null;
  } catch (error) {
    console.error("Failed to check card data:", error);
    return false;
  }
}

// Token ID storage
const TOKEN_ID_KEY = "visa-token-id";

/**
 * Store token ID in localStorage.
 * Token ID is provisioned by Visa tokenization service and persists across sessions.
 *
 * @param tokenId - Provisioned token ID from agent
 */
export function storeTokenId(tokenId: string): void {
  try {
    localStorage.setItem(TOKEN_ID_KEY, tokenId);
    console.log("[Card Storage] Token ID stored");
  } catch (error) {
    console.error("[Card Storage] Failed to store token ID:", error);
  }
}

/**
 * Retrieve token ID from localStorage.
 *
 * @returns Token ID or null if not found
 */
export function getTokenId(): string | null {
  try {
    return localStorage.getItem(TOKEN_ID_KEY);
  } catch (error) {
    console.error("[Card Storage] Failed to get token ID:", error);
    return null;
  }
}

/**
 * Clear token ID from localStorage.
 * Should be called when user explicitly removes the card or token becomes invalid.
 */
export function clearTokenId(): void {
  try {
    localStorage.removeItem(TOKEN_ID_KEY);
    console.log("[Card Storage] Token ID cleared");
  } catch (error) {
    console.error("[Card Storage] Failed to clear token ID:", error);
  }
}

/**
 * Check if token ID exists in localStorage.
 *
 * @returns true if token ID exists, false otherwise
 */
export function hasTokenId(): boolean {
  try {
    return localStorage.getItem(TOKEN_ID_KEY) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Update card status in localStorage.
 * Used to transition card from "in_progress" to "active" after device binding.
 *
 * @param status - New status to set ("active" | "in_progress")
 */
export function updateCardStatus(status: "active" | "in_progress"): void {
  try {
    const cardDataStr = localStorage.getItem("visa-card-data");
    if (cardDataStr) {
      const cardData = JSON.parse(cardDataStr);
      cardData.status = status;
      localStorage.setItem("visa-card-data", JSON.stringify(cardData));
      console.log(`[Card Storage] Card status updated to: ${status}`);
    } else {
      console.warn("[Card Storage] No card data found to update status");
    }
  } catch (error) {
    console.error("[Card Storage] Failed to update card status:", error);
  }
}
