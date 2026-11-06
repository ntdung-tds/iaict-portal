/** B3.10 scanner receipt verifier. This does NOT expose bytes or publish media. */
import { MEDIA_POLICY } from "./media-policy";

export type ScanClaim = Readonly<{
  version: "iaict.media.scan.v1";
  policyId: string;
  uploadId: string;
  scopeId: string;
  sourceRevision: number;
  sourceSha256: string;
  sourceMime: string;
  derivativeKey: string;
  derivativeSha256: string;
  derivativeSize: number;
  derivativeMime: "image/webp";
  width: number;
  height: number;
  engine: "clamav";
  verdict: "CLEAN";
  signedAtMs: number;
  nonce: string;
}>;
export type SignedScanClaim = Readonly<{ claim: ScanClaim; signature: string }>;
export type ScanExpectation = Readonly<{
  uploadId: string; scopeId: string; sourceRevision: number;
  sourceSha256: string; sourceMime: string;
}>;
type ScanVerification = Readonly<{ ok: true; claim: ScanClaim }> |
  Readonly<{ ok: false; code: "INVALID_RECEIPT" | "RECEIPT_MISMATCH" | "RECEIPT_EXPIRED" | "INVALID_SIGNATURE" | "SCANNER_UNCONFIGURED" }>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HASH = /^[0-9a-f]{64}$/;
const NONCE = /^[0-9a-f]{32}$/;
const CLAIM_KEYS = Object.freeze([
  "version","policyId","uploadId","scopeId","sourceRevision","sourceSha256",
  "sourceMime","derivativeKey","derivativeSha256","derivativeSize","derivativeMime",
  "width","height","engine","verdict","signedAtMs","nonce",
] as const);

function validClaim(c: ScanClaim): boolean {
  return c.version === "iaict.media.scan.v1" &&
    c.policyId === MEDIA_POLICY.id && UUID.test(c.uploadId) && c.scopeId === "cms-main" &&
    Number.isSafeInteger(c.sourceRevision) && c.sourceRevision >= 1 &&
    HASH.test(c.sourceSha256) &&
    MEDIA_POLICY.file.mimeTypes.some(m => m === c.sourceMime) &&
    HASH.test(c.derivativeSha256) && c.derivativeMime === "image/webp" &&
    c.derivativeKey === `derivative/staged/v1/cms-main/${c.uploadId}/${c.derivativeSha256}.webp` &&
    Number.isSafeInteger(c.derivativeSize) && c.derivativeSize > 0 &&
    c.derivativeSize <= MEDIA_POLICY.file.maxBytes &&
    Number.isSafeInteger(c.width) && c.width > 0 && c.width <= MEDIA_POLICY.file.maxDimension &&
    Number.isSafeInteger(c.height) && c.height > 0 && c.height <= MEDIA_POLICY.file.maxDimension &&
    c.width * c.height <= MEDIA_POLICY.file.maxPixels &&
    c.engine === "clamav" && c.verdict === "CLEAN" &&
    Number.isSafeInteger(c.signedAtMs) && c.signedAtMs > 0 &&
    NONCE.test(c.nonce);
}

/** Cross-runtime canonical JSON array; Python signer uses identical ordered fields. */
export function scanClaimBytes(value: unknown): Uint8Array | null {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (Object.getPrototypeOf(value) !== Object.prototype) return null;
    const keys = Object.keys(value);
    if (keys.length !== CLAIM_KEYS.length ||
        !CLAIM_KEYS.every(key => Object.prototype.hasOwnProperty.call(value,key))) return null;
    const claim = value as ScanClaim;
    if (!validClaim(claim)) return null;
    return new TextEncoder().encode(JSON.stringify(CLAIM_KEYS.map(key => claim[key])));
  } catch { return null; }
}

function signatureBytes(hex: unknown): Uint8Array | null {
  if (typeof hex !== "string" || !HASH.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for(let i=0;i<32;i++) bytes[i] = Number.parseInt(hex.slice(i*2,i*2+2),16);
  return bytes;
}

/**
 * secret must originate from approved runtime secret binding, never URL/client.
 * Caller must ALSO compare source + derivative private R2 bytes and commit a D1 CAS.
 */
export async function verifyMediaScanClaim(
  envelope: unknown, secret: Uint8Array | undefined,
  expected: ScanExpectation, nowMs: number = Date.now(),
): Promise<ScanVerification> {
  if (!secret || !(secret instanceof Uint8Array) || secret.byteLength < 32)
    return { ok:false, code:"SCANNER_UNCONFIGURED" };
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) return {ok:false,code:"INVALID_RECEIPT"};
  try {
    if (!envelope || typeof envelope !== "object" || Array.isArray(envelope))
      return {ok:false,code:"INVALID_RECEIPT"};
    const e = envelope as Partial<SignedScanClaim>;
    if (Object.keys(e).length !== 2 || !Object.hasOwn(e,"claim") || !Object.hasOwn(e,"signature"))
      return {ok:false,code:"INVALID_RECEIPT"};
    const bytes=scanClaimBytes(e.claim);
    const sig=signatureBytes(e.signature);
    if (!bytes || !sig) return {ok:false,code:"INVALID_RECEIPT"};
    const c=e.claim as ScanClaim;
    if (c.uploadId !== expected.uploadId || c.scopeId !== expected.scopeId ||
        c.sourceRevision !== expected.sourceRevision ||
        c.sourceSha256 !== expected.sourceSha256 || c.sourceMime !== expected.sourceMime)
      return {ok:false,code:"RECEIPT_MISMATCH"};
    if (c.signedAtMs > nowMs + 30_000 ||
        nowMs - c.signedAtMs > MEDIA_POLICY.scan.attestationMaxAgeMs)
      return {ok:false,code:"RECEIPT_EXPIRED"};
    const key=await crypto.subtle.importKey("raw",new Uint8Array(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
    if (!await crypto.subtle.verify("HMAC",key,new Uint8Array(sig),new Uint8Array(bytes)))
      return {ok:false,code:"INVALID_SIGNATURE"};
    return {ok:true,claim:c};
  } catch { return {ok:false,code:"INVALID_RECEIPT"}; }
}
