/**
 * Pure RFC 6238 HOTP/TOTP primitives for a future IAICT MFA enrollment flow.
 *
 * SECURITY BOUNDARY: THIS MODULE DOES NOT ENROLL, ENABLE OR VERIFY AN ACCOUNT.
 * Callers must encrypt enrollment secrets at rest, validate fresh primary
 * authentication and CSRF, enforce attempts, and atomically update the user's
 * last accepted step in D1 before granting any MFA-authenticated session.
 * A matching code by itself is never permission to sign in.
 */
export type TotpHash = "SHA-1" | "SHA-256" | "SHA-512";
export type TotpDigits = 6 | 8;
export type TotpOptions = { hash?: TotpHash; digits?: TotpDigits };
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD_MS = 30_000;

function validateSettings(secret: Uint8Array, timeMs: number, opts: TotpOptions) {
  if (!(secret instanceof Uint8Array) || secret.byteLength < 20 || secret.byteLength > 128)
    throw new Error("INVALID_TOTP_KEY");
  if (!Number.isSafeInteger(timeMs) || timeMs < 0)
    throw new Error("INVALID_TOTP_TIMESTAMP");
  const hash = opts.hash ?? "SHA-1";
  const digits = opts.digits ?? 6;
  if (!["SHA-1", "SHA-256", "SHA-512"].includes(hash) ||
      (digits !== 6 && digits !== 8)) throw new Error("INVALID_TOTP_OPTIONS");
  return { hash, digits };
}

export function generateTotpSecretBase32() {
  const secret = crypto.getRandomValues(new Uint8Array(20));
  return toTotpBase32(secret);
}

export function toTotpBase32(secret: Uint8Array): string {
  if (!(secret instanceof Uint8Array) || secret.length < 20 || secret.length > 128)
    throw new Error("INVALID_TOTP_KEY");
  let bits = 0, buffer = 0, result = "";
  for (const byte of secret) {
    buffer = ((buffer << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += ALPHABET[(buffer >>> bits) & 31];
    }
  }
  if (bits) result += ALPHABET[(buffer << (5 - bits)) & 31];
  return result;
}

export function fromTotpBase32(value: string): Uint8Array {
  if (typeof value !== "string" || !/^[A-Z2-7]{32,205}$/.test(value))
    throw new Error("INVALID_TOTP_BASE32");
  const bytes: number[] = [];
  let buffer = 0, bits = 0;
  for (const char of value) {
    buffer = ((buffer << 5) | ALPHABET.indexOf(char)) & 0xffff;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
    }
  }
  if (bits && (buffer & ((1 << bits) - 1)) !== 0)
    throw new Error("INVALID_TOTP_PADDING");
  const result = new Uint8Array(bytes);
  if (result.length < 20 || result.length > 128 ||
      toTotpBase32(result) !== value) throw new Error("INVALID_TOTP_BASE32");
  return result;
}

async function totpForStep(secret: Uint8Array, step: number, hash: TotpHash, digits: TotpDigits) {
  if (!Number.isSafeInteger(step) || step < 0) throw new Error("INVALID_TOTP_COUNTER");
  const counter = BigInt(step);
  const counterBytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++)
    counterBytes[7 - i] = Number((counter >> BigInt(i * 8)) & 255n);
  const isolatedKey = Uint8Array.from(secret); // Worker WebCrypto needs an owned ArrayBuffer (not SharedArrayBuffer).
  const key = await crypto.subtle.importKey("raw", isolatedKey.buffer, { name:"HMAC", hash }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));
  const offset = mac[mac.length - 1] & 15;
  const binary = ((mac[offset] & 127) << 24) |
    ((mac[offset + 1] & 255) << 16) |
    ((mac[offset + 2] & 255) << 8) | (mac[offset + 3] & 255);
  return String((binary >>> 0) % (10 ** digits)).padStart(digits, "0");
}

export async function generateTotpCode(
  secret: Uint8Array, timeMs: number, options: TotpOptions = {},
): Promise<string> {
  const {hash,digits} = validateSettings(secret,timeMs,options);
  return totpForStep(secret,Math.floor(timeMs / PERIOD_MS),hash,digits);
}

function equalsCode(received: string, expected: string) {
  if (received.length !== expected.length) return false;
  let diff = 0;
  for (let i=0;i<received.length;i++) diff |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff===0;
}

/** Returns candidate time counter, NOT authentication success.
 * Caller MUST enforce per-account/IP throttling and a D1 CAS update:
 * UPDATE ... SET last_accepted_counter=? WHERE ... AND
 * (last_accepted_counter IS NULL OR last_accepted_counter < ?).
 * Never set session MFA flag unless that atomic write commits exactly once.
 */
export async function matchTotpCounter(
  secret: Uint8Array,
  code: string,
  timeMs: number,
  options: TotpOptions & { window?: 0 | 1; lastAcceptedCounter?: number } = {},
): Promise<number | null> {
  const {hash,digits} = validateSettings(secret,timeMs,options);
  const window = options.window ?? 1;
  if (window !== 0 && window !== 1) throw new Error("INVALID_TOTP_WINDOW");
  const last = options.lastAcceptedCounter ?? -1;
  if (!Number.isSafeInteger(last) || last < -1) throw new Error("INVALID_TOTP_LAST_COUNTER");
  if (typeof code !== "string" || !new RegExp(`^[0-9]{${digits}}$`).test(code))
    return null;
  const center = Math.floor(timeMs / PERIOD_MS);
  let match: number | null = null;
  for (let step = Math.max(0,center-window); step <= center+window; step++) {
    const candidate=await totpForStep(secret,step,hash,digits);
    if (equalsCode(code,candidate) && step > last) match=step;
  }
  return match;
}
