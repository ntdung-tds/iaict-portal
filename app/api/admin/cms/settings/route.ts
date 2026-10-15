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
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) continue;
    try {
      const url = new URL(text);
      if (url.protocol !== "https:") invalid("SOCIAL_LINK_INVALID");
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
    return Response.json({ ok: true, actor, ...(await getCmsSettings(db)) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const db = getDatabaseBinding();
    const actor = await requireNewsroomActor(request, db, CMS_ADMIN_ROLES);
    const body = await request.json() as { organizationName?: unknown; settings?: unknown };
    const organizationName = typeof body.organizationName === "string" ? body.organizationName.trim() : "";
    const settings = body.settings && typeof body.settings === "object" && !Array.isArray(body.settings) ? body.settings as Record<string, unknown> : {};
    if (!organizationName) invalid("ORGANIZATION_NAME_REQUIRED");
    const contactEmail = typeof settings.contactEmail === "string" ? settings.contactEmail.trim() : "";
    if (!validEmail(contactEmail)) invalid("CONTACT_EMAIL_INVALID");
    const normalized = {
      ...settings,
      siteTitle: typeof settings.siteTitle === "string" ? settings.siteTitle.trim() : "",
      siteDescription: typeof settings.siteDescription === "string" ? settings.siteDescription.trim() : "",
      contactEmail,
      contactPhone: typeof settings.contactPhone === "string" ? settings.contactPhone.trim() : "",
      address: typeof settings.address === "string" ? settings.address.trim() : "",
      defaultSeoTitle: typeof settings.defaultSeoTitle === "string" ? settings.defaultSeoTitle.trim() : "",
      defaultSeoDescription: typeof settings.defaultSeoDescription === "string" ? settings.defaultSeoDescription.trim() : "",
      socialLinks: validateSocialLinks(settings.socialLinks),
    };
    return Response.json({ ok: true, ...(await saveCmsSettings(db, actor, organizationName, normalized)) });
  } catch (error) { return errorResponse(error); }
}
