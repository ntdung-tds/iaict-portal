/**
 * Cloudflare Access authenticates at the edge, but application Workers must
 * still verify the signed assertion before trusting identity headers.
 * Uses the team's pinned JWKS; NEVER derive the key URL from JWT claims.
 */
export type AccessJwtConfiguration = {
  teamDomain: string | undefined;
  audience: string | undefined;
};

export class AccessJwtValidationError extends Error {
  constructor(message = "ACCESS_JWT_INVALID") {
    super(message);
    this.name = "AccessJwtValidationError";
  }
}

type AccessJwk = JsonWebKey & { kid?: string; alg?: string; use?: string };
type Certificates = { keys?: AccessJwk[] };
type JwtHeader = { alg?: string; kid?: string };
type JwtClaims = {
  iss?: string;
  aud?: string | string[];
  email?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
};

const CERT_CACHE_DURATION_MS = 5 * 60 * 1000;
// Unknown-kid refreshes need throttling; otherwise forged JWTs can repeatedly
// trigger outbound JWKS fetches. Real rotations can be delayed by at most 10s.
const UNKNOWN_KID_REFRESH_COOLDOWN_MS = 10_000;
const certCache = new Map<string, { until: number; keys: AccessJwk[] }>();
const pendingCertFetches = new Map<string, Promise<AccessJwk[]>>();
const lastUnknownKidRefresh = new Map<string, number>();

/** Explicitly reset only for isolated unit tests. */
export function clearAccessCertificateCache() {
  certCache.clear();
  pendingCertFetches.clear();
  lastUnknownKidRefresh.clear();
}

function fail(): never {
  throw new AccessJwtValidationError();
}

function issuerOrigin(value: string | undefined): string {
  if (!value) return fail();
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(url.hostname) ||
      url.port || url.username || url.password || url.search || url.hash ||
      url.pathname !== "/"
    ) return fail();
    return url.origin;
  } catch {
    return fail();
  }
}

function decodeBase64Url(value: string): Uint8Array {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value) || value.length > 16_384) return fail();
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="));
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch {
    return fail();
  }
}

function decodeJson<T>(part: string): T {
  try {
    const json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decodeBase64Url(part)));
    if (!json || typeof json !== "object" || Array.isArray(json)) return fail();
    return json as T;
  } catch {
    return fail();
  }
}

async function certificateKeys(
  issuer: string,
  get: typeof fetch,
  forceUnknownKidRefresh = false,
): Promise<AccessJwk[]> {
  const cache = certCache.get(issuer);
  if (!forceUnknownKidRefresh && cache && cache.until > Date.now()) return cache.keys;

  // Coalesce parallel requests, especially during certificate rotation.
  const inFlight = pendingCertFetches.get(issuer);
  if (inFlight) return inFlight;

  if (forceUnknownKidRefresh) {
    const previous = lastUnknownKidRefresh.get(issuer) ?? 0;
    if (Date.now() - previous < UNKNOWN_KID_REFRESH_COOLDOWN_MS) {
      return cache?.keys ?? fail();
    }
    lastUnknownKidRefresh.set(issuer, Date.now());
  }

  const loading = (async () => {
    // The certificate endpoint is PINNED to the configured Cloudflare team.
    // Never read jku, x5u or other untrusted key-source hints from a JWT.
    const response = await get(`${issuer}/cdn-cgi/access/certs`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return fail();
    const body = await response.json() as Certificates;
    if (!Array.isArray(body?.keys) || body.keys.length === 0 || body.keys.length > 10) return fail();
    const keys = body.keys.filter(key => (
      key && key.kty === "RSA" && typeof key.n === "string" &&
      typeof key.e === "string" && typeof key.kid === "string" &&
      (key.alg === undefined || key.alg === "RS256") &&
      (key.use === undefined || key.use === "sig")
    ));
    if (keys.length === 0) return fail();
    certCache.set(issuer, { keys, until: Date.now() + CERT_CACHE_DURATION_MS });
    return keys;
  })();

  pendingCertFetches.set(issuer, loading);
  try {
    return await loading;
  } finally {
    if (pendingCertFetches.get(issuer) === loading) pendingCertFetches.delete(issuer);
  }
}

/**
 * Return the verified, signed email identity. Reject absent/invalid assertions,
 * wrong application audience, expired/future claims, and spoofed email headers.
 */
export async function verifyCloudflareAccessRequest(
  request: Request,
  config: AccessJwtConfiguration,
  fetchCertificates: typeof fetch = fetch,
): Promise<string> {
  const issuer = issuerOrigin(config.teamDomain);
  const audience = config.audience?.trim();
  if (!audience || !/^[a-f0-9]{64}$/i.test(audience)) return fail();

  const assertion = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();
  const statedEmail = request.headers.get("Cf-Access-Authenticated-User-Email")?.trim();
  if (!assertion || !statedEmail || assertion.length > 16_384) return fail();
  const chunks = assertion.split(".");
  if (chunks.length !== 3) return fail();

  const header = decodeJson<JwtHeader>(chunks[0]);
  const claims = decodeJson<JwtClaims>(chunks[1]);
  if (header.alg !== "RS256" || !header.kid || typeof header.kid !== "string" || header.kid.length > 256) return fail();
  const now = Math.floor(Date.now() / 1000);
  if (
    claims.iss !== issuer ||
    !(claims.aud === audience || (Array.isArray(claims.aud) && claims.aud.includes(audience))) ||
    typeof claims.exp !== "number" || !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
    (claims.nbf !== undefined && (typeof claims.nbf !== "number" || !Number.isSafeInteger(claims.nbf) || claims.nbf > now)) ||
    (claims.iat !== undefined && (typeof claims.iat !== "number" || !Number.isSafeInteger(claims.iat) || claims.iat > now)) ||
    typeof claims.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email) ||
    claims.email.toLowerCase() !== statedEmail.toLowerCase()
  ) return fail();

  try {
    // A token with a new kid can arrive before the five-minute cache expires.
    // Refresh ONCE only if this request started with a valid cached keyset.
    const existingCache = certCache.get(issuer);
    const hadValidCache = !!existingCache && existingCache.until > Date.now();
    const keys = await certificateKeys(issuer, fetchCertificates);
    let candidate = keys.find(key => key.kid === header.kid);
    if (!candidate && hadValidCache) {
      const refreshed = await certificateKeys(issuer, fetchCertificates, true);
      candidate = refreshed.find(key => key.kid === header.kid);
    }
    if (!candidate) return fail();
    const publicKey = await crypto.subtle.importKey(
      "jwk", candidate, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
    );
    const bytes = new TextEncoder().encode(`${chunks[0]}.${chunks[1]}`);
    // Copy into an ArrayBuffer-backed view (not SharedArrayBufferLike) for WebCrypto.
    const encodedSignature = decodeBase64Url(chunks[2]);
    const signature = new Uint8Array(new ArrayBuffer(encodedSignature.byteLength));
    signature.set(encodedSignature);
    const verified = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, bytes);
    if (!verified) return fail();
  } catch {
    return fail();
  }
  return claims.email;
}

export function isProtectedAdminPath(path: string): boolean {
  // URL parsers/frameworks may decode encoded path segments more than once.
  // Match the undecoded path and each of four decoded layers; fail closed for
  // malformed percent encoding. Public routes without an admin prefix remain public.
  let normalized = path;
  for (let i = 0; i < 4; i += 1) {
    const lower = normalized.toLowerCase();
    if (
      lower === "/admin" || lower.startsWith("/admin/") ||
      lower === "/api/admin" || lower.startsWith("/api/admin/")
    ) return true;
    let decoded: string;
    try { decoded = decodeURIComponent(normalized); }
    catch { return true; }
    if (decoded === normalized) return false;
    normalized = decoded;
  }
  const lower = normalized.toLowerCase();
  return lower === "/admin" || lower.startsWith("/admin/") ||
    lower === "/api/admin" || lower.startsWith("/api/admin/");
}
