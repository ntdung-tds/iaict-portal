import { getDatabaseBinding } from "./cloudflare-db";
import { SITE_DESCRIPTION, SITE_TITLE } from "./site-config";

export type PublicSiteSettings = {
  organizationName: string;
  siteTitle: string;
  siteDescription: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: Record<string, string>;
};

const fallback: PublicSiteSettings = {
  organizationName: "Viện Ứng dụng Công nghệ Thông tin và Truyền thông",
  siteTitle: SITE_TITLE,
  siteDescription: SITE_DESCRIPTION,
  defaultSeoTitle: SITE_TITLE,
  defaultSeoDescription: SITE_DESCRIPTION,
  contactEmail: "",
  contactPhone: "",
  address: "",
  socialLinks: {},
};

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const db = getDatabaseBinding();
    const row = await db.prepare(`
      SELECT organization_name, settings_json
      FROM site_settings
      WHERE id = 'default'
      LIMIT 1
    `).first<{ organization_name: string; settings_json: string }>();
    if (!row) return fallback;
    let settings: Record<string, unknown> = {};
    try { settings = JSON.parse(row.settings_json || "{}"); } catch { settings = {}; }
    const stringValue = (key: string, fallbackValue = "") => typeof settings[key] === "string" && String(settings[key]).trim() ? String(settings[key]).trim() : fallbackValue;
    const links = settings.socialLinks && typeof settings.socialLinks === "object" && !Array.isArray(settings.socialLinks)
      ? Object.fromEntries(Object.entries(settings.socialLinks as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
    return {
      organizationName: row.organization_name?.trim() || fallback.organizationName,
      siteTitle: stringValue("siteTitle", fallback.siteTitle),
      siteDescription: stringValue("siteDescription", fallback.siteDescription),
      defaultSeoTitle: stringValue("defaultSeoTitle", fallback.defaultSeoTitle),
      defaultSeoDescription: stringValue("defaultSeoDescription", fallback.defaultSeoDescription),
      contactEmail: stringValue("contactEmail"),
      contactPhone: stringValue("contactPhone"),
      address: stringValue("address"),
      socialLinks: links,
    };
  } catch {
    return fallback;
  }
}
