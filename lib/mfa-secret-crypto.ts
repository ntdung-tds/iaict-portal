/**
 * Future MFA-F2 secret-at-rest primitive, UNUSED by any production route.
 *
 * This module does not enroll a factor, authenticate a user, or write D1.
 * A caller must obtain its AES-256 key securely from a dedicated Worker
 * secret/KMS binding, enforce recent primary authentication, and use atomic
 * D1 replay protection before authorizing any MFA session.
 *
 * Do not log seed bytes, ciphertext, encryption keys, recovery codes or
 * otpauth URLs. D1 stores only the returned encrypted envelope.
 */

export type MfaSeedContext = Readonly<{
  userId: string;
  factorId: string;
  keyId: string;
}>;

export type EncryptedTotpSeed = Readonly<{
  version: 1;
  algorithm: "AES-256-GCM";
  keyId: string;
  iv: string; // base64url-encoded random 96-bit IV
  ciphertext: string; // AES-GCM authenticated ciphertext + 128-bit tag
}>;

const encoder = new TextEncoder();
const AAD_DOMAIN = "iaict-mfa-totp-seed-v1";
const INVALID = "INVALID_MFA_ENCRYPTED_SEED";

function assertContext(context: MfaSeedContext): void {
  if (!context || typeof context !== "object" ||
    ![context.userId, context.factorId, context.keyId].every(
      value => typeof value === "string" && value.length >= 1 &&
        value.length <= 128 && !/[\u0000-\u001f\u007f]/.test(value)
    )) throw new Error("INVALID_MFA_CONTEXT");
}

function associatedData(context: MfaSeedContext): Uint8Array<ArrayBuffer> {
  return encoder.encode(JSON.stringify([
    AAD_DOMAIN, context.userId, context.factorId, context.keyId,
  ]));
}

function base64url(bytes: Uint8Array): string {
  let chars = "";
  for (const byte of bytes) chars += String.fromCharCode(byte);
  return btoa(chars).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value: string, minBytes: number, maxBytes: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value) ||
    value.length > Math.ceil(maxBytes * 4 / 3) + 3) throw new Error(INVALID);
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");
    const result = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    if (result.length < minBytes || result.length > maxBytes ||
      base64url(result) !== value) throw new Error(INVALID);
    return result;
  } catch {
    throw new Error(INVALID);
  }
}

function assertKey(key: CryptoKey): void {
  if (!key || key.type !== "secret" || key.algorithm.name !== "AES-GCM" ||
    (key.algorithm as AesKeyAlgorithm).length !== 256 || key.extractable ||
    !key.usages.includes("encrypt") || !key.usages.includes("decrypt"))
    throw new Error("INVALID_MFA_KEY");
}

/**
 * Accept only a 32-byte raw key from a trusted, private secrets provider.
 * Never hardcode or persist key bytes; the returned key is non-extractable.
 */
export async function importMfaKey(rawKey: Uint8Array): Promise<CryptoKey> {
  if (!(rawKey instanceof Uint8Array) || rawKey.byteLength !== 32)
    throw new Error("INVALID_MFA_KEY");
  const copied = Uint8Array.from(rawKey);
  try {
    return await crypto.subtle.importKey(
      "raw", copied.buffer, { name: "AES-GCM", length: 256 },
      false, ["encrypt", "decrypt"]
    );
  } finally {
    copied.fill(0);
  }
}

/**
 * Encrypts TOTP seed bytes. No enrollment status or session flag is touched.
 * IV is generated independently per encryption; re-encryption creates a new IV.
 */
export async function encryptTotpSeed(
  key: CryptoKey, seed: Uint8Array, context: MfaSeedContext
): Promise<EncryptedTotpSeed> {
  assertContext(context);
  assertKey(key);
  if (!(seed instanceof Uint8Array) || seed.byteLength < 20 || seed.byteLength > 128)
    throw new Error("INVALID_TOTP_KEY");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = Uint8Array.from(seed);
  try {
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: associatedData(context), tagLength: 128 },
      key, plain
    );
    return {
      version: 1, algorithm: "AES-256-GCM", keyId: context.keyId,
      iv: base64url(iv), ciphertext: base64url(new Uint8Array(encrypted)),
    };
  } finally {
    plain.fill(0);
  }
}

/**
 * Returns seed bytes ONLY to a privileged caller after authenticated GCM
 * verification; caller must never return these bytes over an API response.
 * All tamper/wrong-context/wrong-key failures are intentionally generic.
 */
export async function decryptTotpSeed(
  key: CryptoKey, record: EncryptedTotpSeed, context: MfaSeedContext
): Promise<Uint8Array<ArrayBuffer>> {
  assertContext(context);
  assertKey(key);
  if (!record || record.version !== 1 || record.algorithm !== "AES-256-GCM" ||
    record.keyId !== context.keyId) throw new Error(INVALID);
  const iv = fromBase64url(record.iv, 12, 12);
  const cipher = fromBase64url(record.ciphertext, 36, 144);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: associatedData(context), tagLength: 128 },
      key, cipher
    );
    const seed = new Uint8Array(plaintext);
    if (seed.byteLength < 20 || seed.byteLength > 128) throw new Error(INVALID);
    return seed;
  } catch {
    throw new Error(INVALID);
  }
}
