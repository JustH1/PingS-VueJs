/**
 * Generate a random 130-character hex string to use as publicKey during registration.
 * The backend requires exactly 130 characters.
 */
export function generatePublicKey() {
  const bytes = new Uint8Array(65)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
