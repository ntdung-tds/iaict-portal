import type { MetadataRoute } from "next";
import { absoluteSiteUrl, isIndexableSite } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableSite) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  const sitemap = absoluteSiteUrl("/sitemap.xml");

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ...(sitemap ? { sitemap: sitemap.toString() } : {}),
  };
}
