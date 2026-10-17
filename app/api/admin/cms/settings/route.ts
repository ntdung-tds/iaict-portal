import { isNavigationHref } from "@/lib/cms-navigation-link";
import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { cmsErrorCode, translateCmsError } from "@/lib/cms-errors";
import { getCmsSettings, saveCmsSettings } from "@/lib/cms-repository";
import { CMS_ADMIN_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";

function invalid(code: string): never { throw new Error(`INVALID_CMS_${code}`); }
function errorResponse(error: unknown) {
  if (error instanceof NewsroomAuthError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Unknown CMS error";
  const validation = message.startsWith("INVALID_CMS_");
  return Response.json({ error: translateCmsError(message), code: cmsErrorCode(message) }, { status: validation ? 400 : 500 });
}
function validEmail(value: string) { return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validateSocialLinks(value: unknown) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("SOCIAL_LINK_INVALID");
  const output: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== "string") invalid("SOCIAL_LINK_INVALID");
    const text = raw.trim();
    if (!text) continue;
    try {
      const url = new URL(text);
      if (url.protocol !== "https:" || !isNavigationHref(text)) invalid("SOCIAL_LINK_INVALID");
      output[key] = url.toString();
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("INVALID_CMS_")) throw error;
      invalid("SOCIAL_LINK_INVALID");
    }
  }
  return output;
}

export async function GET(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_READ_ROLES);
    return Response.json({ ok: true, actor, ...(await getCmsSettings(db)) }, {headers:{"Cache-Control":"no-store"}});
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    const body = await request.json() as { organizationName?: unknown; settings?: unknown };
    const organizationName = typeof body.organizationName === "string" ? body.organizationName.trim() : "";
    if (!body.settings || typeof body.settings !== "object" || Array.isArray(body.settings)) invalid("SETTINGS_INVALID");
    const settings = body.settings as Record<string,unknown>;
    const current = await getCmsSettings(db);
    const fields = {...current.settings,...settings};
    for(const key of ["siteTitle","siteDescription","contactEmail","contactPhone","address","defaultSeoTitle","defaultSeoDescription"]){if(key in fields && typeof fields[key]!=="string")invalid("SETTINGS_INVALID");}
    if (!organizationName) invalid("ORGANIZATION_NAME_REQUIRED");
    const contactEmail = typeof fields.contactEmail === "string" ? fields.contactEmail.trim() : "";
    if (!validEmail(contactEmail)) invalid("CONTACT_EMAIL_INVALID");
    const normalized = {
      ...current.settings,
      siteTitle: typeof fields.siteTitle === "string" ? fields.siteTitle.trim() : "",
      siteDescription: typeof fields.siteDescription === "string" ? fields.siteDescription.trim() : "",
      contactEmail,
      contactPhone: typeof fields.contactPhone === "string" ? fields.contactPhone.trim() : "",
      address: typeof fields.address === "string" ? fields.address.trim() : "",
      defaultSeoTitle: typeof fields.defaultSeoTitle === "string" ? fields.defaultSeoTitle.trim() : "",
      defaultSeoDescription: typeof fields.defaultSeoDescription === "string" ? fields.defaultSeoDescription.trim() : "",
      socialLinks: validateSocialLinks(fields.socialLinks),
    };
    return Response.json({ ok: true, ...(await saveCmsSettings(db, actor, organizationName, normalized)) });
  } catch (error) { return errorResponse(error); }
}
