import * as crypto from "crypto";
import * as jose from "jose";

/**
 * Hash function for generating secure hashes using HMAC-SHA256
 * @param secret - The secret key for HMAC
 * @param payload - The data to hash
 * @param base64Encoded - Whether to return base64url encoded result
 * @returns The hash as hex or base64url string
 */
export const hash = (
  secret: string,
  payload: string,
  base64Encoded: boolean = false
): string => {
  if (!crypto) {
    throw new Error(
      "Crypto module not available - this function requires Node.js environment"
    );
  }
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  return base64Encoded ? hmac.digest("base64url") : hmac.digest("hex");
};

/**
 * Generate email hash for security compliance
 * @param email - The email address to hash
 * @returns Base64url encoded hash
 */
export const generateEmailHash = (email: string): string => {
  const secret = process.env.TR_HASHSECRET;
  if (!secret) {
    throw new Error("TR_HASHSECRET environment variable is required");
  }
  return hash(secret, email, true);
};

/**
 * Encrypt data with secret using modern jose library
 * @param secret - The encryption secret
 * @param kid - The key identifier
 * @param payload - The data to encrypt (object or array)
 * @returns Encrypted JWE string
 */
export const encryptWithSecret = async (
  secret: string,
  kid: string,
  payload: Record<string, unknown> | Array<Record<string, unknown>> = {}
): Promise<string> => {
  try {
    // Ensure payload is a valid JWT claims object
    // JWT specification requires claims to be a JSON object, not an array
    const claimsPayload = Array.isArray(payload)
      ? { data: payload } // Wrap arrays in a container object
      : payload; // Use objects directly

    // Create SHA256 hash of secret and convert to base64url for JWK
    const secretHash = crypto.createHash("sha256").update(secret).digest();
    const base64urlSecret = secretHash.toString("base64url");

    // Use modern jose library for JWE encryption
    const secretKey = await jose.importJWK({
      kty: "oct",
      k: base64urlSecret,
      alg: "A256GCMKW",
      use: "enc",
    });

    const jwe = await new jose.EncryptJWT(claimsPayload)
      .setProtectedHeader({
        alg: "A256GCMKW",
        enc: "A256GCM",
        kid,
      })
      .encrypt(secretKey);

    return jwe;
  } catch (error) {
    console.error("JWE encryption failed:", error);
    console.error(
      "Payload type:",
      Array.isArray(payload) ? "array" : typeof payload
    );
    console.error("Payload content:", JSON.stringify(payload, null, 2));
    throw new Error(
      `JWE encryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
