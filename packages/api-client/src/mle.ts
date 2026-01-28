import nodejose from 'node-jose';
const { JWK, JWE } = nodejose;

/**
 * Encrypted payload structure for MLE
 */
export interface EncryptedPayload {
  encData: string;
}

/**
 * Encrypts a payload using MLE (Message Level Encryption)
 * Uses RSA-OAEP-256 for key encryption and A128GCM for content encryption
 *
 * @param payload - The payload to encrypt (string or object)
 * @param serverCert - The MLE server certificate in PEM format
 * @param keyId - The MLE key ID
 * @returns Promise containing the encrypted payload
 */
export async function encryptPayload(
  payload: unknown,
  serverCert: string,
  keyId: string
): Promise<EncryptedPayload> {
  // Convert payload to string if needed
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Create keystore and add the server certificate
  const keystore = JWK.createKeyStore();
  const encProps = {
    kid: keyId,
    alg: 'RSA-OAEP-256',
    enc: 'A128GCM',
  };
  const key = await keystore.add(serverCert, 'pem', encProps);

  // Encrypt the payload
  const result = await JWE.createEncrypt(
    {
      format: 'compact',
      fields: {
        enc: 'A128GCM',
        iat: Date.now(),
      },
    },
    key
  )
    .update(payloadString)
    .final();

  return { encData: result };
}

/**
 * Decrypts an encrypted payload using MLE (Message Level Encryption)
 * Uses RSA-OAEP-256 for key decryption and A128GCM for content decryption
 *
 * @param encryptedPayload - The encrypted payload (string or object)
 * @param privateKey - The MLE private key in PEM format
 * @param keyId - The MLE key ID
 * @returns Promise containing the decrypted payload as string
 */
export async function decryptPayload(
  encryptedPayload: unknown,
  privateKey: string,
  keyId: string
): Promise<string> {
  // Parse encrypted payload if it's a string
  const payload: EncryptedPayload | Record<string, unknown> =
    typeof encryptedPayload === 'string'
      ? (JSON.parse(encryptedPayload) as EncryptedPayload | Record<string, unknown>)
      : (encryptedPayload as EncryptedPayload | Record<string, unknown>);

  // Return as-is if no private key provided
  if (!privateKey) {
    return JSON.stringify(payload);
  }

  // Extract the encrypted data
  const encData = (payload as EncryptedPayload).encData;
  if (!encData) {
    throw new Error('Invalid encrypted payload: missing encData field');
  }

  // Create keystore and add the private key
  const keystore = JWK.createKeyStore();
  const decProps = {
    kid: keyId,
    alg: 'RSA-OAEP-256',
    enc: 'A128GCM',
  };
  const key = await keystore.add(privateKey, 'pem', decProps);

  // Decrypt the payload
  const result = await JWE.createDecrypt(key).decrypt(encData);

  // Return decrypted payload as string
  return result.payload.toString();
}
