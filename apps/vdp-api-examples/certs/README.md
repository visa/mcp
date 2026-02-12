# Two-Way SSL Certificates

This directory should contain the certificate files required for Two-Way SSL (Mutual TLS) authentication with Visa Developer Platform APIs.

## Required Files

| File                       | Description                                         | Source                                                         |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| `cert.pem`                 | Client certificate                                  | Download from VDP Dashboard > Credentials > Two-Way SSL        |
| `privateKey.pem`           | Private key                                         | Generated during CSR creation or downloaded from VDP Dashboard |
| `DigiCertGlobalRootCA.pem` | DigiCert CA root certificate (optional for sandbox) | Download from VDP                                              |

## How to Obtain Certificates

1. Log in to the [Visa Developer Portal](https://developer.visa.com)
2. Navigate to your project dashboard
3. Go to the **Credentials** section
4. Under **Two-Way SSL**, either:
   - Select **"Generate a CSR for me (default)"** to get an auto-generated certificate, or
   - Select **"Submit my own CSR"** to upload your own Certificate Signing Request
5. Download the **client certificate** (`cert.pem`) and **private key** (`privateKey.pem`)

If you downloaded the DigiCert root CA in binary format, convert it to PEM:

```bash
openssl x509 -inform der -in DigiCertGlobalRootCA.crt -outform pem -out DigiCertGlobalRootCA.pem
```

## Important

- These files are excluded from version control via `.gitignore`
- Never commit certificate files or private keys to the repository
- For more details, see the [Visa Two-Way SSL documentation](https://developer.visa.com/pages/working-with-visa-apis/two-way-ssl)
