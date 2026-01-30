/**
 * VTS (Visa Token Service) Utilities
 *
 * Shared utilities for VTS authentication and device management.
 */

/**
 * Generate or retrieve client device ID from localStorage
 *
 * Creates a VTS-compliant client device ID (24 characters) using alphanumeric
 * characters, hyphens, and underscores. The ID is stored in localStorage for
 * persistence across sessions.
 *
 * @returns VTS-compliant client device ID (24 characters)
 * @throws Error if localStorage is not available
 */
export function getClientDeviceId(): string {
  const storageKey = "vts_client_device_id";

  try {
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
      console.log("[VTS] Generating new client device ID");

      // Generate a VTS-compliant client device ID (24 characters)
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
      deviceId = "";
      for (let i = 0; i < 24; i++) {
        deviceId += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      localStorage.setItem(storageKey, deviceId);
      console.log("[VTS] Generated and stored new client device ID:", deviceId);
    } else {
      console.log("[VTS] Retrieved existing client device ID:", deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("[VTS] Error accessing localStorage:", error);
    throw new Error("Failed to generate or retrieve client device ID");
  }
}
/**
 * Generate or retrieve VTS client reference ID from localStorage
 *
 * Creates a VTS-compliant client reference ID (max 36 characters) using alphanumeric
 * characters and hyphens. The ID is stored in localStorage for persistence across sessions.
 *
 * Format: CR-{32 random chars} (total 35 characters)
 * - Alphabetic, numeric, and hyphens (-) only
 * - Maximum 36 characters
 *
 * @returns VTS-compliant client reference ID
 * @throws Error if localStorage is not available
 */
export function getClientReferenceId(): string {
  // Generate a VTS-compliant client reference ID
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "CR-" + result;
}

/**
 * Get or create VTS authentication iframe
 *
 * Finds existing iframe by id or creates a new one with proper configuration.
 * The iframe is hidden and configured with necessary permissions for VTS authentication.
 * Returns a Promise that resolves when the iframe is fully loaded.
 *
 * @param vtsBaseUrl - Base URL for VTS service
 * @returns Promise<HTMLIFrameElement> - Promise that resolves to the loaded VTS iframe element
 */
export function getVTSIframe(vtsBaseUrl: string): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    // Remove any existing iframe to prevent conflicts
    const existingIframe = document.getElementById("vts-auth-iframe");
    if (existingIframe) {
      console.log("[VTS] Removing existing iframe");
      existingIframe.remove();
    }

    console.log("[VTS] Creating new VTS iframe");

    const apiKey = process.env.NEXT_PUBLIC_VTS_API_KEY;
    const externalAppId = process.env.NEXT_PUBLIC_VTS_EXTERNAL_APP_ID;

    const iframe = document.createElement("iframe");
    iframe.id = "vts-auth-iframe";
    iframe.src = `${vtsBaseUrl}/vts-auth/authenticate?apikey=${apiKey}&externalAppId=${externalAppId}`;
    iframe.style.display = "none";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox publickey-credentials-get",
    );

    // Add load event listener
    iframe.onload = () => {
      console.log("[VTS] VTS Authentication iFrame loaded successfully");
      resolve(iframe);
    };

    iframe.onerror = (error) => {
      console.error("[VTS] Error loading VTS Authentication iFrame:", error);
      reject(new Error("Failed to load VTS authentication iframe"));
    };

    document.body.appendChild(iframe);

    // Fallback timeout in case onload doesn't fire
    setTimeout(() => {
      if (iframe.parentNode) {
        console.log("[VTS] Iframe creation completed (fallback timeout)");
        resolve(iframe);
      }
    }, 2000);
  });
}

/**
 * Clean up VTS iframe from DOM
 *
 * Removes the iframe element from the document body.
 * Safe to call even if iframe is null or already removed.
 *
 * @param iframe - The iframe element to remove
 */
export function cleanupVTSIframe(iframe: HTMLIFrameElement | null): void {
  if (!iframe) return;

  try {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
      console.log("[VTS] Removed VTS iframe from DOM");
    }
  } catch (error) {
    console.error("[VTS] Error removing iframe:", error);
  }
}
