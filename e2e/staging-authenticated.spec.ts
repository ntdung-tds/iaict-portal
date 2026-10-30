import { test, expect } from "@playwright/test";

type Role = "admin" | "editor" | "reviewer" | "viewer" |
  "news_admin" | "news_editor" | "news_reviewer";
const expected = (process.env.IAICT_EXPECTED_CMS_ROLES ?? "").split(",")
  .map(role => role.trim()).filter(Boolean) as Role[];

const cmsRoles = new Set<Role>(["admin", "editor", "reviewer", "viewer"]);
const isGlobalCmsUser = expected.some(role => cmsRoles.has(role));
const isGlobalAdmin = expected.includes("admin");

// Defend against accidental use with Playwright's default config. The private
// auth config alone is not enough: default Playwright discovery can find specs.
test.beforeAll(() => {
  const use = test.info().project.use;
  if (
    process.env.CI ||
    process.env.IAICT_AUTH_ACCEPTANCE_APPROVED !== "staging-only" ||
    use.baseURL !== "https://iaict-portal-staging.iaict-platform.workers.dev" ||
    typeof use.storageState !== "string" ||
    use.storageState !== process.env.IAICT_ACCESS_STORAGE_STATE
  ) {
    throw new Error("AUTH_ACCEPTANCE_REQUIRES_PRIVATE_STAGING_CONFIG");
  }
});


type Session = { ok?: boolean; actor?: { id?: string; roles?: string[]; email?: string } };

test("real Access session reaches Worker and maps to expected active CMS roles", async ({ request }) => {
  const response = await request.get("/api/admin/cms/session", { maxRedirects: 0 });
  expect(response.status(), "Cloudflare Access cookie must be valid and recognized by new Worker").toBe(200);
  const { ok, actor } = await response.json() as Session;
  expect(ok).toBe(true);
  expect(typeof actor?.id).toBe("string");
  expect((actor?.id ?? "").length).toBeGreaterThan(0);
  expect((actor?.roles ?? []).slice().sort(), "D1 roles must exactly match approved role expectation")
    .toEqual([...expected].sort());
  // Never print email, cookies, JWTs, session JSON or identity headers.
});

test("CMS overview read enforces global CMS roles", async ({ request }) => {
  const res = await request.get("/api/admin/cms/overview", { maxRedirects: 0 });
  expect(res.status()).toBe(isGlobalCmsUser ? 200 : 403);
});

test("CMS user administration remains global-admin only", async ({ request }) => {
  const res = await request.get("/api/admin/cms/users", { maxRedirects: 0 });
  expect(res.status()).toBe(isGlobalAdmin ? 200 : 403);
  // Do not retain user-list payloads in reports.
});

test("confidential CRM leads remain global-admin only", async ({ request }) => {
  const res = await request.get("/api/admin/cms/collection?module=leads&limit=1", { maxRedirects: 0 });
  expect(res.status()).toBe(isGlobalAdmin ? 200 : 403);
});

test("CMS content reads require global CMS roles", async ({ request }) => {
  const res = await request.get("/api/admin/cms/articles", { maxRedirects: 0 });
  expect(res.status()).toBe(isGlobalCmsUser ? 200 : 403);
});

test("Newsroom review queue is readable to all seven roles", async ({ request }) => {
  const res = await request.get("/api/admin/news/review?status=pending&limit=1", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
});

test("Newsroom settings are readable without granting configuration changes", async ({ request }) => {
  const res = await request.get("/api/admin/news/settings", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
});

test("public health remains accessible with an authenticated browser", async ({ request }) => {
  const res = await request.get("/api/health", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
});

// Do NOT issue POST/PUT/PATCH/DELETE or capture screenshots/trace/video.
// A separate anonymous staging suite checks that exact roots redirect to Access.
// This suite must only run on a specifically approved deployed staging Worker.
