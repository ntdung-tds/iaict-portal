import { beforeEach, describe, expect, it } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  clearAccessCertificateCache, isProtectedAdminPath,
  verifyCloudflareAccessRequest,
} from "./cloudflare-access-jwt";

const team = "https://lucky-sun-c4ca.cloudflareaccess.com";
const aud = "a".repeat(64);
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "qa-key-1", alg: "RS256", use: "sig" };
const now = () => Math.floor(Date.now() / 1000);
const encode = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const makeToken = (
  payload: Record<string, unknown> = {},
  header: Record<string, unknown> = {},
) => {
  const signedHeader = encode({ alg: "RS256", kid: "qa-key-1", typ: "JWT", ...header });
  const signedPayload = encode({
    iss: team, aud: [aud], email: "editor@iaict.vn",
    exp: now() + 600, iat: now() - 5, ...payload,
  });
  const message = `${signedHeader}.${signedPayload}`;
  return `${message}.${sign("RSA-SHA256", Buffer.from(message), privateKey).toString("base64url")}`;
};
const request = (token: string, email = "editor@iaict.vn") => new Request(
  "https://iaict-portal-staging.iaict-platform.workers.dev/api/admin/cms/session",
  { headers: {
    "Cf-Access-Jwt-Assertion": token,
    "Cf-Access-Authenticated-User-Email": email,
  } },
);
let certificateFetches = 0;
const fetchCertificates: typeof fetch = (async (input: RequestInfo | URL) => {
  certificateFetches += 1;
  expect(String(input)).toBe(`${team}/cdn-cgi/access/certs`);
  return Response.json({ keys: [jwk] });
}) as typeof fetch;
const verify = (token: string, email?: string) => verifyCloudflareAccessRequest(
  request(token, email), { teamDomain: team, audience: aud }, fetchCertificates,
);

beforeEach(() => { certificateFetches = 0; clearAccessCertificateCache(); });

describe("Cloudflare Access JWT boundary", () => {
  it("accepts a correctly signed RS256 assertion with matching issuer, AUD, email and expiry", async () => {
    await expect(verify(makeToken())).resolves.toBe("editor@iaict.vn");
    await expect(verify(makeToken())).resolves.toBe("editor@iaict.vn");
    expect(certificateFetches).toBe(1); // reuse keys until rotation/TTL
  });

  it.each([
    ["wrong AUD", { aud: ["b".repeat(64)] }],
    ["wrong issuer", { iss: "https://evil.cloudflareaccess.com" }],
    ["expired", { exp: now() - 10 }],
    ["future not-before", { nbf: now() + 30 }],
    ["future issue time", { iat: now() + 30 }],
    ["missing expiration", { exp: undefined }],
    ["non-email claim", { email: "non-email" }],
  ])("rejects %s even when token is signed", async (_name, claims) => {
    await expect(verify(makeToken(claims))).rejects.toThrow("ACCESS_JWT_INVALID");
  });

  it("rejects spoofed identity header despite a valid signed JWT", async () => {
    await expect(verify(makeToken(), "admin@iaict.vn")).rejects.toThrow("ACCESS_JWT_INVALID");
    await expect(verify(makeToken(), "EDITOR@IAICT.VN")).resolves.toBe("editor@iaict.vn");
  });

  it("rejects tampering, unsupported algorithm, unrecognized kid and invalid token", async () => {
    const token = makeToken();
    const segments = token.split(".");
    await expect(verify(`${segments[0]}.${encode({ email: "admin@iaict.vn" })}.${segments[2]}`))
      .rejects.toThrow("ACCESS_JWT_INVALID");
    await expect(verify(makeToken({}, { alg: "HS256" }))).rejects.toThrow("ACCESS_JWT_INVALID");
    await expect(verify(makeToken({}, { kid: "other" }))).rejects.toThrow("ACCESS_JWT_INVALID");
    await expect(verify("signed-access-token")).rejects.toThrow("ACCESS_JWT_INVALID");
  });

  it("fails closed with missing/misconfigured Access values", async () => {
    const token = makeToken();
    const withoutHeaders = new Request("https://example.org/api/admin");
    await expect(verifyCloudflareAccessRequest(withoutHeaders,
      { teamDomain: team, audience: aud }, fetchCertificates)).rejects.toThrow("ACCESS_JWT_INVALID");
    await expect(verifyCloudflareAccessRequest(request(token),
      { teamDomain: undefined, audience: aud }, fetchCertificates)).rejects.toThrow("ACCESS_JWT_INVALID");
    await expect(verifyCloudflareAccessRequest(request(token),
      { teamDomain: "https://evil.example.com", audience: aud }, fetchCertificates)).rejects.toThrow("ACCESS_JWT_INVALID");
    await expect(verifyCloudflareAccessRequest(request(token),
      { teamDomain: team, audience: undefined }, fetchCertificates)).rejects.toThrow("ACCESS_JWT_INVALID");
  });

  it("rejects a broken JWKS endpoint without using untrusted claims", async () => {
    const unavailable = (async () => new Response("failed", { status: 503 })) as typeof fetch;
    await expect(verifyCloudflareAccessRequest(request(makeToken()),
      { teamDomain: team, audience: aud }, unavailable)).rejects.toThrow("ACCESS_JWT_INVALID");
  });

  it("guards CMS and API roots, including percent-encoded routes, but not the public site", () => {
    for (const route of [
      "/admin", "/admin/news", "/api/admin", "/api/admin/cms/session",
      "/%61dmin/news", "/%2561dmin/news", "/%252561dmin/news",
      "/api/%2561dmin/news", "/api/admin%252fnews", "/%2561dmin",
    ]) {
      expect(isProtectedAdminPath(route), route).toBe(true);
    }
    for (const route of ["/", "/tin-tuc", "/api/news/public", "/administrator", "/api/administration"]) {
      expect(isProtectedAdminPath(route), route).toBe(false);
    }
  });
});
