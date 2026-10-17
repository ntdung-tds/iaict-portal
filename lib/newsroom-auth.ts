import type { D1DatabaseLike } from "./cloudflare-db";
import { CMS_ROLE_CODES, isCmsRoleCode, type CmsRoleCode } from "./cms-roles";

export type NewsroomRole = CmsRoleCode;

export type NewsroomActor = {
  id: string;
  email: string;
  displayName: string | null;
  roles: NewsroomRole[];
};

export class NewsroomAuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "NewsroomAuthError";
  }
}

type ActorRow = {
  id: string;
  email: string;
  display_name: string | null;
  role_codes: string | null;
};

function normalizeRoleCodes(value: string | null): NewsroomRole[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(isCmsRoleCode);
}

export async function requireNewsroomActor(
  request: Request,
  db: D1DatabaseLike,
  allowedRoles: readonly NewsroomRole[],
): Promise<NewsroomActor> {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email")?.trim();
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion")?.trim();

  if (!email || !assertion) {
    throw new NewsroomAuthError(401, "Cloudflare Access authentication required");
  }

  const row = await db
    .prepare(`
      SELECT
        u.id,
        u.email,
        u.display_name,
        group_concat(r.code) AS role_codes
      FROM admin_users u
      LEFT JOIN admin_user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE lower(u.email) = lower(?) AND u.is_active = 1
      GROUP BY u.id, u.email, u.display_name
      LIMIT 1
    `)
    .bind(email)
    .first<ActorRow>();

  if (!row) throw new NewsroomAuthError(403, "User is not an active CMS user");

  const roles = normalizeRoleCodes(row.role_codes);
  const isAllowed = roles.some((role) => allowedRoles.includes(role));
  if (!isAllowed) throw new NewsroomAuthError(403, "Insufficient CMS role");

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    roles,
  };
}

export { CMS_ROLE_CODES };
