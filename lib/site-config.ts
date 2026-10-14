export const SITE_TITLE = "IAICT — Viện Ứng dụng Công nghệ Thông tin và Truyền thông";
export const SITE_DESCRIPTION =
  "Cổng thông tin điện tử IAICT — công nghệ, giải pháp, chuyển giao, đào tạo và các hoạt động của Viện.";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const siteBaseUrl = configuredSiteUrl
  ? new URL(configuredSiteUrl.endsWith("/") ? configuredSiteUrl : `${configuredSiteUrl}/`)
  : null;

export const isIndexableSite =
  process.env.NEXT_PUBLIC_INDEXABLE_SITE === "true" && siteBaseUrl !== null;

export function absoluteSiteUrl(path = "/"): URL | null {
  if (!siteBaseUrl) return null;
  const relativePath = path === "/" ? "" : path.replace(/^\/+/, "");
  return new URL(relativePath, siteBaseUrl);
}
