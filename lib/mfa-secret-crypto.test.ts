import { describe, it, expect } from "vitest";
import {
  importMfaKey, encryptTotpSeed, decryptTotpSeed,
  type MfaSeedContext, type EncryptedTotpSeed,
} from "./mfa-secret-crypto";

const seed = new TextEncoder().encode("01234567890123456789"); // 20 synthetic bytes
const context: MfaSeedContext = {
  userId: "synthetic-user-a", factorId: "synthetic-factor-a", keyId: "k-test-1",
};
const rawKey = () => Uint8Array.from({ length: 32 }, (_, i) => i + 1);

describe("MFA-F2 AES-256-GCM secret envelope — foundation only; MFA disabled", () => {
  it("imports a nonextractable 256-bit AES-GCM key, never exposes raw bytes", async () => {
    const key = await importMfaKey(rawKey());
    expect(key.extractable).toBe(false);
    expect(key.algorithm.name).toBe("AES-GCM");
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
    await expect(importMfaKey(new Uint8Array(16))).rejects.toThrow("INVALID_MFA_KEY");
  });

  it("roundtrips synthetic 160-bit TOTP seed with version and key id", async () => {
    const key = await importMfaKey(rawKey());
    const envelope = await encryptTotpSeed(key, seed, context);
    expect(envelope).toMatchObject({ version: 1, algorithm: "AES-256-GCM", keyId: "k-test-1" });
    expect(envelope.iv).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(envelope.ciphertext).not.toContain("01234567890123456789");
    expect(await decryptTotpSeed(key, envelope, context)).toEqual(seed);
  });

  it("never reuses IV for separately encrypted records", async () => {
    const key = await importMfaKey(rawKey());
    const a = await encryptTotpSeed(key, seed, context);
    const b = await encryptTotpSeed(key, seed, context);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(await decryptTotpSeed(key, b, context)).toEqual(seed);
  });

  it("cryptographically binds seed to user, factor and key id (AAD)", async () => {
    const key = await importMfaKey(rawKey());
    const item = await encryptTotpSeed(key, seed, context);
    for (const changed of [
      { ...context, userId: "synthetic-user-b" },
      { ...context, factorId: "synthetic-factor-b" },
      { ...context, keyId: "k-test-2" },
    ]) {
      await expect(decryptTotpSeed(key, item, changed))
        .rejects.toThrow("INVALID_MFA_ENCRYPTED_SEED");
    }
  });

  it("rejects swapped ciphertext, modified IV, altered tag and wrong key", async () => {
    const key = await importMfaKey(rawKey());
    const a = await encryptTotpSeed(key, seed, context);
    const b = await encryptTotpSeed(key, seed, context);
    const records: EncryptedTotpSeed[] = [
      { ...a, iv: b.iv },
      { ...a, ciphertext: b.ciphertext },
      { ...a, ciphertext: a.ciphertext.slice(0, -1) + (a.ciphertext.endsWith("A") ? "B" : "A") },
      { ...a, version: 2 as 1 },
      { ...a, algorithm: "AES-128-GCM" as "AES-256-GCM" },
      { ...a, iv: "not-base64url!" },
      { ...a, ciphertext: "" },
    ];
    for (const record of records) {
      await expect(decryptTotpSeed(key, record, context))
        .rejects.toThrow("INVALID_MFA_ENCRYPTED_SEED");
    }
    const wrong = rawKey(); wrong[0] = 200;
    await expect(decryptTotpSeed(await importMfaKey(wrong), a, context))
      .rejects.toThrow("INVALID_MFA_ENCRYPTED_SEED");
  });

  it("refuses invalid context and invalid seed before any encryption", async () => {
    const key = await importMfaKey(rawKey());
    await expect(encryptTotpSeed(key, new Uint8Array(19), context))
      .rejects.toThrow("INVALID_TOTP_KEY");
    await expect(encryptTotpSeed(key, seed, { ...context, userId: "" }))
      .rejects.toThrow("INVALID_MFA_CONTEXT");
    await expect(encryptTotpSeed(key, seed, { ...context, factorId: "test\nvalue" }))
      .rejects.toThrow("INVALID_MFA_CONTEXT");
  });
});
