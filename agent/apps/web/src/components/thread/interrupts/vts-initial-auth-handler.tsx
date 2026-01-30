import { useEffect, useState, useRef } from "react";
import { useStreamContext } from "@/providers/Stream";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getClientReferenceId } from "@/lib/vts-utils";
import {
  initializeVTSAuth,
  type AuthenticationSessionData,
} from "@/lib/vts-service";

/**
 * VTS Initial Authentication Handler Component
 *
 * Handles ONLY the initial VTS authentication flow (awaiting_vts_authentication interrupt)
 * Flow: Creates hidden iframe → AUTH_READY → CREATE_AUTH_SESSION → AUTH_SESSION_CREATED
 *
 * The AUTHENTICATE flow (device attestation) is handled by VtsAuthenticateHandler
 */

export function VtsInitialAuthHandler() {
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

    console.log("[VTS Initial Auth] Starting initial VTS auth flow");

    const cleanup = initializeVTSAuth({
      onSuccess: (authData: AuthenticationSessionData) => {
        console.log("[VTS Initial Auth] Auth successful");
        setStatus("success");

        // Generate client reference ID
        let clientReferenceId: string | undefined;
        try {
          clientReferenceId = getClientReferenceId();
          console.log(
            "[VTS Initial Auth] Using client reference ID:",
            clientReferenceId,
          );
        } catch (error) {
          console.error(
            "[VTS Initial Auth] Failed to get client reference ID:",
            error,
          );
        }

        console.log(
          "[VTS Initial Auth] Submitting auth data to agent:",
          authData,
        );

        // Submit authentication data back to agent
        stream.submit(
          {
            private_vtsAuthenticationSessionData: authData,
            private_vtsRetryCount:
              ((stream.values as any).private_vtsRetryCount || 0) + 1,
            ...(clientReferenceId && { clientReferenceId }),
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
      },
      onError: (error: string) => {
        console.error("[VTS Initial Auth] Auth failed:", error);
        setStatus("error");
        setErrorMessage(error);

        // Submit error to agent
        stream.submit(
          {
            private_vtsAuthenticationSessionData: null,
            private_vtsRetryCount:
              ((stream.values as any).private_vtsRetryCount || 0) + 1,
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
      },
      onStatusChange: setStatus,
    });

    // Cleanup on unmount
    return cleanup;
  }, []); // Empty deps - only run once per mount

  // Render UI for initial auth flow
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
                Authenticating with Visa Token Service
              </p>
              <p className="text-sm text-gray-700">
                Please wait while we verify your payment method...
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
                Authentication Successful
              </p>
              <p className="text-sm text-gray-700">
                Your payment method has been verified and secured.
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
                  "We're experiencing technical difficulties. Please try again later."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
