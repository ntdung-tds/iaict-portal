/**
 * LOCAL_WORKERD ONLY — exercises exact lib/mfa-secret-crypto.ts implementation.
 * No production or staging endpoints, no secret bindings, no D1/R2/Access.
 * All fixed arrays are synthetic test vectors, never account credentials.
 */
import {
  importMfaKey, encryptTotpSeed, decryptTotpSeed
} from "../../lib/mfa-secret-crypto";

const context = { userId: "mfa-probe-user-a", factorId: "mfa-probe-factor-a", keyId: "local-probe-key-v1" };
const seed = Uint8Array.from({ length: 20 }, (_, i) => i + 10);
const keyBytes = () => Uint8Array.from({ length: 32 }, (_, i) => i + 1);
const checks: Record<string, "PASS"> = {};
const mark = (id: string, condition: boolean) => {
  if (!condition) throw Error("CHECK_FAILED_" + id);
  checks[id] = "PASS";
};
const rejected = async (fn: () => Promise<unknown>): Promise<boolean> => {
  try { await fn(); return false; }
  catch (e) { return e instanceof Error && e.message === "INVALID_MFA_ENCRYPTED_SEED"; }
};
export default {
  async fetch(request: Request) {
    if (request.method !== "GET" || new URL(request.url).pathname !== "/mfa-crypto-probe")
      return new Response("Not found", { status: 404 });
    try {
      const key = await importMfaKey(keyBytes());
      mark("NONEXTRACTABLE_KEY", key.extractable === false &&
        key.type === "secret" && key.algorithm.name === "AES-GCM" &&
        (key.algorithm as AesKeyAlgorithm).length === 256);
      const first = await encryptTotpSeed(key, seed, context);
      const second = await encryptTotpSeed(key, seed, context);
      mark("ENVELOPE_SHAPE", first.version === 1 &&
        first.algorithm === "AES-256-GCM" && first.keyId === context.keyId &&
        /^[A-Za-z0-9_-]{16}$/.test(first.iv) &&
        /^[A-Za-z0-9_-]+$/.test(first.ciphertext));
      const plain = await decryptTotpSeed(key, first, context);
      mark("ROUNDTRIP", plain.length === seed.length &&
        plain.every((byte, i) => byte === seed[i]));
      plain.fill(0);
      mark("UNIQUE_IV", first.iv !== second.iv && first.ciphertext !== second.ciphertext);
      mark("OWNER_BOUND", await rejected(() =>
        decryptTotpSeed(key, first, { ...context, userId: "mfa-probe-user-b" })));
      mark("FACTOR_BOUND", await rejected(() =>
        decryptTotpSeed(key, first, { ...context, factorId: "mfa-probe-factor-b" })));
      mark("KEY_VERSION_BOUND", await rejected(() =>
        decryptTotpSeed(key, first, { ...context, keyId: "local-probe-key-v2" })));
      mark("SWAPPED_IV_BLOCKED", await rejected(() =>
        decryptTotpSeed(key, { ...first, iv: second.iv }, context)));
      mark("SWAPPED_CIPHERTEXT_BLOCKED", await rejected(() =>
        decryptTotpSeed(key, { ...first, ciphertext: second.ciphertext }, context)));
      const alternate = keyBytes(); alternate[0] ^= 255;
      const wrongKey = await importMfaKey(alternate);
      mark("WRONG_KEY_BLOCKED", await rejected(() => decryptTotpSeed(wrongKey, first, context)));
      mark("MALFORMED_IV_BLOCKED", await rejected(() =>
        decryptTotpSeed(key, { ...first, iv: "not!base64" }, context)));
      // All probe results intentionally exclude raw keys, seeds, OTPs and ciphertexts.
      return Response.json({
        test_id: "IAM-FUT-009", runtime: "LOCAL_WORKERD", passed: Object.keys(checks).length,
        results: checks, compatibility_date: "2026-10-12", deployed: false
      }, { headers: { "cache-control": "no-store" } });
    } catch (e) {
      return Response.json({
        test_id: "IAM-FUT-009", runtime: "LOCAL_WORKERD", passed: Object.keys(checks).length,
        results: checks, outcome: "FAIL", sanitized_error: e instanceof Error ? e.message.slice(0,90) : "UNKNOWN"
      }, { status: 500, headers: { "cache-control": "no-store" } });
    }
  }
};
