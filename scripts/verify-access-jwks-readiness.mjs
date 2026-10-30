/**
 * Read-only Cloudflare Access certificate readiness probe.
 * Uses the pinned Access team hostname only; fetches no user data or JWTs,
 * prints no certificate/key material, and never touches Worker/D1 deployments.
 */
import { webcrypto } from "node:crypto";

const issuer = "https://lucky-sun-c4ca.cloudflareaccess.com";
const endpoint = `${issuer}/cdn-cgi/access/certs`;

const response = await fetch(endpoint, {
  headers: { accept: "application/json" },
  signal: AbortSignal.timeout(10_000),
});
if (!response.ok) {
  throw new Error(`[access-jwks] HTTP ${response.status}; readiness not confirmed`);
}
const body = await response.json();
if (!Array.isArray(body?.keys) || body.keys.length === 0 || body.keys.length > 10) {
  throw new Error("[access-jwks] No valid bounded JWKS key set");
}
let valid = 0;
for (const key of body.keys) {
  if (
    key?.kty !== "RSA" || typeof key.n !== "string" ||
    typeof key.e !== "string" || typeof key.kid !== "string" ||
    (key.alg !== undefined && key.alg !== "RS256") ||
    (key.use !== undefined && key.use !== "sig")
  ) continue;
  await webcrypto.subtle.importKey("jwk", key, {
    name: "RSASSA-PKCS1-v1_5", hash: "SHA-256",
  }, false, ["verify"]);
  valid += 1;
}
if (valid === 0) throw new Error("[access-jwks] No importable RS256 Access keys");
console.log(`[access-jwks] PASS: pinned HTTPS team JWKS, ${valid} importable verification keys; no JWT or private data used`);
