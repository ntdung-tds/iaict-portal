/**
 * CMS/CRM/Newsroom HTTP route authorization regression tests.
 * Synthetic email and inert assertion only. These tests exercise route handlers
 * in-process after the real Worker RS256 ingress boundary, NOT an actual Access
 * session or a deploy. All D1 writes are deliberately forbidden.
 */
import { describe, expect, it } from "vitest";
import type { D1DatabaseLike, D1PreparedStatementLike, D1RunResult } from "@/lib/cloudflare-db";
import { setDatabaseBinding } from "@/lib/cloudflare-db";
import type { CmsRoleCode } from "@/lib/cms-roles";

import * as session from "@/app/api/admin/cms/session/route";
import * as overview from "@/app/api/admin/cms/overview/route";
import * as users from "@/app/api/admin/cms/users/route";
import * as collection from "@/app/api/admin/cms/collection/route";
import * as articles from "@/app/api/admin/cms/articles/route";
import * as settings from "@/app/api/admin/cms/settings/route";
import * as revisions from "@/app/api/admin/cms/revisions/route";
import * as courseSessions from "@/app/api/admin/cms/course-sessions/route";
import * as newsReview from "@/app/api/admin/news/review/route";
import * as newsActions from "@/app/api/admin/news/review/action/route";
import * as newsSettings from "@/app/api/admin/news/settings/route";
import * as newsIngest from "@/app/api/admin/news/ingest/route";

const allRoles: readonly CmsRoleCode[] = [
  "admin", "editor", "reviewer", "viewer",
  "news_admin", "news_editor", "news_reviewer",
];

class ActorStatement implements D1PreparedStatementLike {
  constructor(
    private readonly row: Record<string, unknown> | null,
    private readonly onBind: (v: unknown[]) => void,
  ) {}
  bind(...values: (string | number | null | ArrayBuffer | ArrayBufferView)[]): D1PreparedStatementLike {
    this.onBind(values);
    return this;
  }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return this.row as T | null;
  }
  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    throw new Error("UNAUTHORIZED_BUSINESS_READ");
  }
  async run(): Promise<D1RunResult> { throw new Error("UNAUTHORIZED_D1_WRITE"); }
}

class GuardedDb implements D1DatabaseLike {
  readonly actorQueries: string[] = [];
  readonly binds: unknown[][] = [];
  readonly businessQueries: string[] = [];
  constructor(private readonly role: CmsRoleCode | null) {}
  prepare(query: string): D1PreparedStatementLike {
    if (!query.includes("FROM admin_users u") || !query.includes("u.is_active = 1")) {
      this.businessQueries.push(query);
      throw new Error("UNAUTHORIZED_BUSINESS_READ");
    }
    this.actorQueries.push(query);
    const actor = this.role === null ? null : {
      id: "fixture-qa-id", email: "fixture@example.invalid",
      display_name: "Synthetic QA", role_codes: this.role,
    };
    return new ActorStatement(actor, values => this.binds.push(values));
  }
  async batch(): Promise<D1RunResult[]> { throw new Error("UNAUTHORIZED_D1_BATCH"); }
}

type Method = "GET" | "POST" | "DELETE";
type ApiCase = {
  label: string;
  method: Method;
  path: string;
  handler: (request: Request) => Promise<Response>;
  allowed: readonly CmsRoleCode[];
  body?: Record<string, unknown>;
};

const cmsRead: readonly CmsRoleCode[] = ["admin", "editor", "reviewer", "viewer"];
const cmsEdit: readonly CmsRoleCode[] = ["admin", "editor"];
const cmsAdmin: readonly CmsRoleCode[] = ["admin"];
const newsRead: readonly CmsRoleCode[] = allRoles;
const newsEdit: readonly CmsRoleCode[] = ["admin", "editor", "news_admin", "news_editor"];
const newsReviewRoles: readonly CmsRoleCode[] = ["admin", "reviewer", "news_admin", "news_reviewer"];
const newsAdmin: readonly CmsRoleCode[] = ["admin", "news_admin"];

const routes: readonly ApiCase[] = [
  { label: "CMS session", method: "GET", path: "/api/admin/cms/session", handler: session.GET, allowed: newsRead },
  { label: "CMS overview", method: "GET", path: "/api/admin/cms/overview", handler: overview.GET, allowed: cmsRead },
  { label: "CMS user list", method: "GET", path: "/api/admin/cms/users", handler: users.GET, allowed: cmsAdmin },
  { label: "CMS user update", method: "POST", path: "/api/admin/cms/users", handler: users.POST, allowed: cmsAdmin, body: { email: "qa@example.invalid", roles: ["viewer"] } },
  { label: "CMS user deactivation", method: "DELETE", path: "/api/admin/cms/users", handler: users.DELETE, allowed: cmsAdmin, body: { id: "fake" } },
  { label: "confidential CRM leads read", method: "GET", path: "/api/admin/cms/collection?module=leads&limit=1", handler: collection.GET, allowed: cmsAdmin },
  { label: "confidential CRM leads edit", method: "POST", path: "/api/admin/cms/collection", handler: collection.POST, allowed: cmsAdmin, body: { module: "leads", data: {} } },
  { label: "confidential CRM leads delete", method: "DELETE", path: "/api/admin/cms/collection", handler: collection.DELETE, allowed: cmsAdmin, body: { module: "leads", id: "fake" } },
  { label: "CMS public page read", method: "GET", path: "/api/admin/cms/collection?module=pages", handler: collection.GET, allowed: cmsRead },
  { label: "CMS public page edit", method: "POST", path: "/api/admin/cms/collection", handler: collection.POST, allowed: cmsEdit, body: { module: "pages", data: {} } },
  { label: "CMS page delete", method: "DELETE", path: "/api/admin/cms/collection", handler: collection.DELETE, allowed: cmsAdmin, body: { module: "pages", id: "fake" } },
  { label: "CMS articles read", method: "GET", path: "/api/admin/cms/articles", handler: articles.GET, allowed: cmsRead },
  { label: "CMS articles edit", method: "POST", path: "/api/admin/cms/articles", handler: articles.POST, allowed: cmsEdit, body: { action: "save-article", data: {} } },
  { label: "CMS articles delete", method: "DELETE", path: "/api/admin/cms/articles", handler: articles.DELETE, allowed: cmsAdmin, body: { id: "fake" } },
  { label: "CMS settings read", method: "GET", path: "/api/admin/cms/settings", handler: settings.GET, allowed: cmsRead },
  { label: "CMS settings edit", method: "POST", path: "/api/admin/cms/settings", handler: settings.POST, allowed: cmsAdmin, body: { organizationName: "QA", settings: {} } },
  { label: "CMS revisions read", method: "GET", path: "/api/admin/cms/revisions", handler: revisions.GET, allowed: cmsRead },
  { label: "CMS revisions restore", method: "POST", path: "/api/admin/cms/revisions", handler: revisions.POST, allowed: cmsAdmin, body: { revisionId: "fake" } },
  { label: "course sessions read", method: "GET", path: "/api/admin/cms/course-sessions", handler: courseSessions.GET, allowed: cmsRead },
  { label: "course sessions edit", method: "POST", path: "/api/admin/cms/course-sessions", handler: courseSessions.POST, allowed: cmsEdit, body: { data: {} } },
  { label: "course sessions delete", method: "DELETE", path: "/api/admin/cms/course-sessions", handler: courseSessions.DELETE, allowed: cmsAdmin, body: { id: "fake" } },
  { label: "Newsroom review queue", method: "GET", path: "/api/admin/news/review", handler: newsReview.GET, allowed: newsRead },
  { label: "Newsroom draft edit", method: "POST", path: "/api/admin/news/review/action", handler: newsActions.POST, allowed: newsEdit, body: { action: "edit", queueId: "fake", expectedUpdatedAt: "2026-01-01" } },
  { label: "Newsroom review decision", method: "POST", path: "/api/admin/news/review/action", handler: newsActions.POST, allowed: newsReviewRoles, body: { action: "approve", queueId: "fake", expectedUpdatedAt: "2026-01-01" } },
  { label: "Newsroom settings read", method: "GET", path: "/api/admin/news/settings", handler: newsSettings.GET, allowed: newsRead },
  { label: "Newsroom settings update", method: "POST", path: "/api/admin/news/settings", handler: newsSettings.POST, allowed: newsAdmin, body: { action: "update-settings", settings: {} } },
  { label: "Newsroom source ingest", method: "POST", path: "/api/admin/news/ingest", handler: newsIngest.POST, allowed: newsAdmin, body: { sourceId: "fake" } },
];

function requestFor(route: ApiCase, headers?: HeadersInit): Request {
  return new Request("https://iaict-portal-staging.iaict-platform.workers.dev" + route.path, {
    method: route.method,
    headers: route.method === "GET" ? headers : { "Content-Type": "application/json", ...Object.fromEntries(new Headers(headers)) },
    body: route.method === "GET" ? undefined : JSON.stringify(route.body ?? {}),
  });
}

const fixtureHeaders = {
  "Cf-Access-Authenticated-User-Email": "fixture@example.invalid",
  // Inert test marker: the real Worker verifies RS256/JWKS before calling these handlers.
  "Cf-Access-Jwt-Assertion": "fixture-not-a-real-jwt",
};

describe("HTTP route-level staging CMS/CRM least privilege (synthetic, no external I/O)", () => {
  it("every catalogued API boundary refuses a completely anonymous request before querying D1", async () => {
    for (const route of routes) {
      const db = new GuardedDb("admin");
      setDatabaseBinding(db);
      const response = await route.handler(requestFor(route));
      expect(response.status, route.label).toBe(401);
      expect(db.actorQueries, route.label).toHaveLength(0);
      expect(db.businessQueries, route.label).toHaveLength(0);
    }
  });

  for (const role of allRoles) {
    it("rejects every route outside the permissions of " + role + " before business SQL", async () => {
      let denied = 0;
      for (const route of routes) {
        if (route.allowed.includes(role)) continue;
        const db = new GuardedDb(role);
        setDatabaseBinding(db);
        const response = await route.handler(requestFor(route, fixtureHeaders));
        expect(response.status, route.label + " / " + role).toBe(403);
        expect(db.actorQueries, route.label + " / " + role).toHaveLength(1);
        expect(db.businessQueries, route.label + " / " + role).toHaveLength(0);
        expect(db.binds, route.label + " / " + role).toEqual([["fixture@example.invalid"]]);
        denied++;
      }
      expect(denied, "Each role should have at least one restricted API").toBeGreaterThan(0);
    });
  }

  it("treats an Access identity absent from active D1 as forbidden for all routes", async () => {
    for (const route of routes) {
      const db = new GuardedDb(null);
      setDatabaseBinding(db);
      const response = await route.handler(requestFor(route, fixtureHeaders));
      expect(response.status, route.label).toBe(403);
      expect(db.actorQueries, route.label).toHaveLength(1);
      expect(db.businessQueries, route.label).toHaveLength(0);
    }
  });
});
