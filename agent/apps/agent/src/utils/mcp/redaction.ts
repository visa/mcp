/**
 * Sensitive data redaction utility for tool calls
 * Automatically redacts sensitive information in tool arguments and results
 */

/**
 * Redacts card number to show only last 4 digits
 */
function redactCardNumber(value: any): string {
  const str = String(value);
  if (str.length < 4) return "****";
  return `****${str.slice(-4)}`;
}

/**
 * Redacts CVV/security codes completely
 */
function redactCvv(): string {
  return "***";
}

/**
 * Redacts encrypted data
 */
function redactEncrypted(): string {
  return "[ENCRYPTED DATA]";
}

/**
 * Redacts tokens/keys to show prefix and suffix
 */
function redactToken(value: any): string {
  const str = String(value);
  if (str.length <= 16) return "***";
  return `${str.slice(0, 8)}...${str.slice(-4)}`;
}

/**
 * Redacts credentials completely
 */
function redactCredential(): string {
  return "***";
}

/**
 * Partially redacts email addresses
 */
function redactEmail(value: any): string {
  const str = String(value);
  const atIndex = str.indexOf("@");
  if (atIndex === -1) return "***@***.***";

  const local = str.slice(0, atIndex);
  const domain = str.slice(atIndex + 1);

  if (local.length <= 2) {
    return `${local}***@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Partially redacts expiry dates
 */
function redactExpiry(value: any): any {
  if (typeof value === "object" && value !== null) {
    if ("month" in value && "year" in value) {
      return { month: "**", year: value.year };
    }
  }
  return "**/**";
}

/**
 * Partially redacts step-up values (email, phone, etc.)
 * Shows first character and last character with masking in between
 */
function redactStepUpValue(value: any): string {
  const str = String(value);

  // Handle email addresses specially
  if (str.includes("@")) {
    return redactEmail(value);
  }

  // Handle phone numbers and other values
  if (str.length <= 4) {
    return "***";
  }

  // Show first char and last char with masking
  return `${str.charAt(0)}${"*".repeat(Math.min(str.length - 2, 6))}${str.charAt(str.length - 1)}`;
}

/**
 * Redacts values to show only first and last 2 characters
 * Example: abcdefghijklmnop -> ab...op
 */
function redactFirstLastTwo(value: any): string {
  const str = String(value);
  if (str.length <= 4) return "***";
  return `${str.slice(0, 2)}...${str.slice(-2)}`;
}

/**
 * Redacts IP addresses to show first and last octet only
 * Example: 192.168.1.100 -> 192.*.*.*100
 */
function redactIpAddress(value: any): string {
  const str = String(value);

  // Handle IPv4
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = str.match(ipv4Pattern);

  if (match) {
    return `${match[1]}.*.*.*${match[4]}`;
  }

  // For IPv6 or malformed, show prefix only
  if (str.length > 8) {
    return `${str.slice(0, 4)}...***`;
  }

  return "***";
}

/**
 * Redacts device/session IDs to show prefix and suffix
 * Example: abc123def456ghi789 -> abc123de...i789
 */
function redactDeviceId(value: any): string {
  const str = String(value);
  if (str.length <= 16) return "***";
  return `${str.slice(0, 8)}...${str.slice(-4)}`;
}

/**
 * Redacts consumer/user IDs completely
 */
function redactConsumerId(): string {
  return "***";
}

/**
 * Determines the appropriate redaction strategy for a given key
 */
function getRedactionStrategy(key: string): ((value: any) => any) | null {
  // Card numbers
  if (/^(cardnumber|accountnumber|pan|number)$/i.test(key)) {
    return redactCardNumber;
  }

  // Security codes
  if (/^(cvv|cvv2|cvc|securitycode)$/i.test(key)) {
    return redactCvv;
  }

  // Encrypted data (fields starting with enc or encrypted)
  if (/^(enc|encrypted)/i.test(key)) {
    return redactEncrypted;
  }

  // Expiry dates
  if (/^(expiry|expirydate|expirationdate)$/i.test(key)) {
    return redactExpiry;
  }

  // Client IDs and Wallet IDs (complete redaction)
  if (/^(clientappid|clientwalletaccountid)$/i.test(key)) {
    return redactCredential;
  }

  // Identifier fields (complete redaction for step-up identifiers)
  if (/^identifier$/i.test(key)) {
    return redactCredential;
  }

  // Value fields in step-up requests (partial redaction)
  if (/^value$/i.test(key)) {
    return redactStepUpValue;
  }

  // FIDO blobs (catches fidoAssertionData.code and fidoAttestationData.code)
  // Show first and last 2 characters only
  if (/^code$/i.test(key)) {
    return redactFirstLastTwo;
  }

  // Identity values (email addresses in enroll-card context)
  // Show first and last 2 characters only
  if (/^(identityvalue)$/i.test(key)) {
    return redactFirstLastTwo;
  }

  // Consumer IDs
  if (/^(consumerid)$/i.test(key)) {
    return redactConsumerId;
  }

  // IP addresses
  if (/^(ipaddress|ip)$/i.test(key)) {
    return redactIpAddress;
  }

  // Device and session IDs
  if (/^(clientdeviceid|deviceid|dfpsessionid|sessionid)$/i.test(key)) {
    return redactDeviceId;
  }

  // Enrollment reference IDs (reuse token redaction for prefix/suffix display)
  if (/^(enrollmentreferenceid)$/i.test(key)) {
    return redactToken;
  }

  // Tokens and keys (partial redaction)
  if (/(token|key)/i.test(key) && !/(tokenize|tokenization)/i.test(key)) {
    return redactToken;
  }

  // Credentials
  if (/(password|secret|apikey|privatekey|auth)/i.test(key)) {
    return redactCredential;
  }

  // Email addresses
  if (/email/i.test(key)) {
    return redactEmail;
  }

  return null;
}

/**
 * Redacts a single value based on its key
 */
export function redactValue(key: string, value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  const strategy = getRedactionStrategy(key);
  if (strategy) {
    return strategy(value);
  }

  // For complex values without a specific redaction strategy, recurse
  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(`${key}[${index}]`, item));
  }

  if (typeof value === "object") {
    return redactObject(value);
  }

  return value;
}

/**
 * Recursively redacts sensitive fields in an object
 */
export function redactObject(obj: Record<string, any>): Record<string, any> {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === "object" && item !== null) {
        return redactObject(item);
      }
      return item;
    });
  }

  const redacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    redacted[key] = redactValue(key, value);
  }

  return redacted;
}
