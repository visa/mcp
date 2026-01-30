import { useEffect, useState, useRef } from "react";
import { useStreamContext } from "@/providers/Stream";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { sendAuthenticateMessageToExistingIframe } from "@/lib/vts-service";

/**
 * VTS Authenticate Handler Component
 *
 * Handles ONLY the AUTHENTICATE message flow (awaiting_authenticate_message interrupt)
 * Flow: Reuses existing iframe → sends AUTHENTICATE message → waits for completion
 *
 * Reuses iframe from initial auth to avoid nested iframe issues with popup approach
 */

export function VtsAuthenticateHandler() {
  const stream = useStreamContext();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only run once per mount
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    console.log(
      "[VTS Authenticate] Starting AUTHENTICATE flow with visible iframe",
    );

    // Get authentication context from stream.values
    const registerAttestationOptions =
      stream.values?.registerAttestationOptions;
    const authContext = registerAttestationOptions?.data?.authenticationContext;

    // Get requestID from sessionStorage (set during initial auth)
    const vtsRequestID = sessionStorage.getItem("vts_requestID");

    if (!authContext?.identifier || !authContext?.payload || !vtsRequestID) {
      console.error("[VTS Authenticate] Missing required data:", {
        hasIdentifier: !!authContext?.identifier,
        hasPayload: !!authContext?.payload,
        hasRequestID: !!vtsRequestID,
      });
      setStatus("error");
      setErrorMessage("Missing required authentication data");
      return;
    }

    // Call iframe-reuse function
    sendAuthenticateMessageToExistingIframe(
      {
        identifier: authContext.identifier,
        endpoint: authContext.endpoint || "",
        payload: authContext.payload,
        action: authContext.action || "",
        requestID: vtsRequestID,
        authenticationPreferencesEnabled: (authContext as any)
          .authenticationPreferencesEnabled,
      },
      stream,
      {
        onSuccess: () => {
          console.log("[VTS Authenticate] AUTHENTICATE completed successfully");
          setStatus("success");
        },
        onError: (error: string) => {
          console.error("[VTS Authenticate] AUTHENTICATE failed:", error);
          setStatus("error");
          setErrorMessage(error);
        },
      },
    );
  }, []); // Empty deps - only run once per mount

  // Render UI for authenticate flow
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {status === "loading" && (
          <>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Loader2 className="w-5 h-5 text-[var(--visa-blue-primary)] animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--visa-blue-primary)] mb-1">
                Processing Device Authentication
              </p>
              <p className="text-sm text-gray-700">
                Processing device authentication...
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 mb-1">
                Authentication Completed
              </p>
              <p className="text-sm text-gray-700">
                Device authentication has been completed successfully.
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600 mb-1">
                Authentication Failed
              </p>
              <p className="text-sm text-gray-700">
                {errorMessage ||
                  "Unable to complete authentication. Please try again."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
