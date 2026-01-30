import { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { GraphState } from "../../utils/state.js";
import { ToolRegistry } from "../../utils/mcp/index.js";
import { MCP_TOOLS } from "../../utils/constant.js";

/**
 * Enroll Card node that calls the enroll-card MCP server tool.
 *
 * This node:
 * 1. Validates that assuranceData exists in private_authenticateMessageResult
 * 2. Calls the enroll-card MCP tool with empty payload (to be filled in next task)
 * 3. Saves the result to state
 * 4. Handles errors gracefully with user-friendly messages
 *
 * @param state - Current graph state with authentication result
 * @param config - RunnableConfig containing tool registry
 * @returns Partial state update with enroll card response and message
 */
export async function enrollCard(
  state: typeof GraphState.State,
  config: RunnableConfig
): Promise<Partial<typeof GraphState.State>> {
  const registry = config.configurable?.toolRegistry as ToolRegistry;

  if (!registry) {
    console.error("ToolRegistry not found in config.configurable");
    return {
      messages: [
        new AIMessage({
          content:
            "We encountered a configuration issue. Please try again later.",
          additional_kwargs: {
            ui_only: true,
          },
        }),
      ],
    };
  }

  // Idempotency guard: Skip if already have enroll card response
  if (state.private_enrollCardResponse) {
    console.log("Card enrollment already completed, skipping");
    return {}; // Return empty state to preserve existing data
  }

  try {
    if (!state.private_authenticateMessageResult?.assuranceData) {
      console.error("Missing assuranceData in authenticate message result");
      return {
        messages: [
          new AIMessage({
            content:
              "Unable to add card. The authentication data is incomplete.",
            additional_kwargs: {
              ui_only: true,
            },
          }),
        ],
      };
    }

    const action =
      state.private_deviceAttestationOptions?.data?.authenticationContext
        ?.action;
    const fidoBlob =
      state.private_authenticateMessageResult.assuranceData.fidoBlob;

    // Build conditional FIDO field based on action type
    const fidoField =
      action === "AUTHENTICATE"
        ? { fidoAssertionData: { code: fidoBlob } }
        : action === "REGISTER"
          ? { fidoAttestationData: { code: fidoBlob } }
          : {};

    const payload: Record<string, unknown> = {
      clientReferenceId: state.clientReferenceId,
      enrollmentReferenceData: {
        enrollmentReferenceId: state.private_tokenId,
        enrollmentReferenceType: "TOKEN_REFERENCE_ID",
        enrollmentReferenceProvider: "VTS",
      },
      consumer: {
        consumerId: process.env.VISA_CONSUMER_ID,
        countryCode: "US",
        languageCode: "en",
        consumerIdentity: {
          identityType: "EMAIL_ADDRESS",
          identityValue: state.email,
          identityProvider: "PARTNER",
          identityProviderUrl: "https://example.com",
        },
      },
      appInstance: {
        userAgent:
          state.private_vtsAuthenticationSessionData?.browserData?.userAgent,
        applicationName: "Agentic Commerce Application",
        countryCode: "US",
        deviceData: {
          type: "Mobile",
          manufacturer: "Apple",
          brand: "Apple",
          model: "iPhone 16 Pro Max",
        },
        ipAddress:
          state.private_vtsAuthenticationSessionData?.browserData?.ipAddress,
        clientDeviceId: state.private_vtsClientDeviceId,
      },
      assuranceData: [
        {
          verificationType: "DEVICE",
          verificationEntity: "10",
          verificationEvents: ["02"],
          verificationMethod: "23",
          verificationResults: "01",
          verificationTimestamp: Math.floor(Date.now() / 1000).toString(),
          methodResults: {
            dfpSessionId:
              state.private_vtsAuthenticationSessionData?.dfpSessionID,
            identifier:
              state.private_authenticateMessageResult.assuranceData.identifier,
            ...fidoField,
          },
        },
      ],
    };

    console.log("Calling enroll-card with payload");

    // Functionally equivalent REST endpoint:
    // POST /vacp/v1/cards
    const { result, messages: toolMessages } =
      await registry.callToolDirectWithMessages<any>(
        MCP_TOOLS.ENROLL_CARD,
        payload
      );

    console.log("Card enrollment completed successfully");

    return {
      private_enrollCardResponse: result,
      messages: [
        ...toolMessages, // Tool call messages appear first in UI
        new AIMessage({
          content: "Card enrolled successfully.",
          additional_kwargs: {
            ui_only: true,
          },
        }),
      ],
    };
  } catch (error) {
    console.error("Error in enrollCard:", error);

    return {
      messages: [
        new AIMessage({
          content:
            "We encountered an issue while enrolling your card. Please try again later.",
          additional_kwargs: {
            ui_only: true,
          },
        }),
      ],
    };
  }
}
