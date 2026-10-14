import type { MetadataRoute } from "next";
import { mainNavigation } from "@/lib/public-content";
import { absoluteSiteUrl, isIndexableSite } from "@/lib/site-config";

const indexedRoutes = [
  ...mainNavigation.map((item) => item.href),
  "/dao-tao-tap-huan/co-quan-nha-nuoc",
  "/du-an/tram-rung",
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexableSite) return [];

  return [...new Set(indexedRoutes)].flatMap((route) => {
    const url = absoluteSiteUrl(route);
    if (!url) return [];

    return [{
      url: url.toString(),
      changeFrequency: route === "/" || route === "/tin-tuc" ? "weekly" : "monthly",
      priority: route === "/" ? 1 : route === "/du-an/tram-rung" ? 0.8 : 0.7,
    }];
  });
}
