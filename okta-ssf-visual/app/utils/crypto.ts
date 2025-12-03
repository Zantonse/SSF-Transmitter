import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

export async function generateKeyPair() {
  // Generate a new key ID for the JWK
  const kid = uuidv4();
  
  // Generate the RSA Key Pair (RS256)
  // CRITICAL FIX: We must set extractable: true so the browser allows us 
  // to export the private key as a PEM string in the next step.
  const { privateKey, publicKey } = await jose.generateKeyPair('RS256', {
    extractable: true,
  });
  
  // Export Private Key to PEM format (PKCS8)
  // This is the format required by the 'jose' library to sign JWTs later.
  const privatePem = await jose.exportPKCS8(privateKey);
  
  // Export Public Key to JWK format
  // This JSON object is what you will host publicly for Okta to fetch.
  const publicJwk = await jose.exportJWK(publicKey);
  
  // Attach metadata to the public key so Okta knows how to use it
  publicJwk.kid = kid;   // Key ID (matches the header in the signed JWT)
  publicJwk.use = 'sig'; // Usage: Signature
  publicJwk.alg = 'RS256'; // Algorithm: RSA w/ SHA-256

  return {
    privatePem,
    publicJwk,
    kid
  };
}