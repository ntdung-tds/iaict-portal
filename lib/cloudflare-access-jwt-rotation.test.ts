import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  clearAccessCertificateCache,
  verifyCloudflareAccessRequest,
} from "./cloudflare-access-jwt";

const issuer = "https://lucky-sun-c4ca.cloudflareaccess.com";
const aud = "f".repeat(64);
const oldKey = generateKeyPairSync("rsa", { modulusLength: 2048 });
const newKey = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = (pair: typeof oldKey, kid: string) => ({
  ...pair.publicKey.export({ format: "jwk" }), kid, alg: "RS256", use: "sig",
});
const oldJwk = jwk(oldKey, "old-access-key");
const newJwk = jwk(newKey, "rotated-access-key");
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

function signedToken(pair: typeof oldKey, kid: string) {
  const header = encode({ alg: "RS256", kid });
  const payload = encode({
    iss: issuer, aud: [aud], email: "operator@example.test",
    exp: Math.floor(Date.now() / 1000) + 900,
  });
  const signedInput = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(signedInput), pair.privateKey).toString("base64url");
  return `${signedInput}.${signature}`;
}
const makeRequest = (token: string) => new Request("https://staging.example.test/api/admin/cms/session", {
  headers: {
    "Cf-Access-Jwt-Assertion": token,
    "Cf-Access-Authenticated-User-Email": "operator@example.test",
  },
});
const verify = (token: string, get: typeof fetch) => verifyCloudflareAccessRequest(
  makeRequest(token), { teamDomain: issuer, audience: aud }, get,
);
beforeEach(() => clearAccessCertificateCache());
afterEach(() => clearAccessCertificateCache());

describe("Cloudflare Access JWKS rotation and fetch resilience", () => {
  it("accepts freshly signed tokens after a kid rotation without waiting 5 minutes", async () => {
    let fetchCount = 0;
    const fetchCertificates = (async () => {
      fetchCount += 1;
      return Response.json({ keys: fetchCount === 1 ? [oldJwk] : [newJwk] });
    }) as typeof fetch;

    await expect(verify(signedToken(oldKey, oldJwk.kid), fetchCertificates))
      .resolves.toBe("operator@example.test");
    await expect(verify(signedToken(newKey, newJwk.kid), fetchCertificates))
      .resolves.toBe("operator@example.test");
    await expect(verify(signedToken(newKey, newJwk.kid), fetchCertificates))
      .resolves.toBe("operator@example.test");
    expect(fetchCount).toBe(2);
  });

  it("coalesces concurrent normal JWKS fetches into a single pinned request", async () => {
    let fetchCount = 0;
    const fetchCertificates = (async (input: RequestInfo | URL) => {
      fetchCount++;
      expect(String(input)).toBe(`${issuer}/cdn-cgi/access/certs`);
      await Promise.resolve();
      return Response.json({ keys: [oldJwk] });
    }) as typeof fetch;

    const token = signedToken(oldKey, oldJwk.kid);
    const verified = await Promise.all(Array.from({ length: 12 }, () => verify(token, fetchCertificates)));
    expect(verified).toEqual(Array(12).fill("operator@example.test"));
    expect(fetchCount).toBe(1);
  });

  it("throttles repeated forged unknown-kid tokens without accepting them", async () => {
    let fetchCount = 0;
    const fetchCertificates = (async () => {
      fetchCount += 1;
      return Response.json({ keys: [oldJwk] });
    }) as typeof fetch;

    await verify(signedToken(oldKey, oldJwk.kid), fetchCertificates);
    const invalid = Array.from({ length: 16 }, (_, i) =>
      verify(signedToken(oldKey, `forged-${i}`), fetchCertificates),
    );
    const settled = await Promise.allSettled(invalid);
    expect(settled.every(result => result.status === "rejected")).toBe(true);
    expect(fetchCount).toBe(2); // one initial JWKS read, one bounded forced refresh
  });

  it("retains previously valid cached keys if the rotation fetch fails", async () => {
    let fetchCount = 0;
    const fetchCertificates = (async () => {
      fetchCount += 1;
      return fetchCount === 1
        ? Response.json({ keys: [oldJwk] })
        : new Response("JWKS unavailable", { status: 503 });
    }) as typeof fetch;

    await expect(verify(signedToken(oldKey, oldJwk.kid), fetchCertificates)).resolves.toBe("operator@example.test");
    await expect(verify(signedToken(newKey, newJwk.kid), fetchCertificates)).rejects.toThrow("ACCESS_JWT_INVALID");
    await expect(verify(signedToken(oldKey, oldJwk.kid), fetchCertificates)).resolves.toBe("operator@example.test");
    expect(fetchCount).toBe(2);
  });
});
