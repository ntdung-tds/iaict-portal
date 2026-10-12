import type { MetadataRoute } from "next";
import { mainNavigation } from "@/lib/public-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://iaict.example";
  const routes = [...mainNavigation.map((item) => item.href), "/dao-tao-tap-huan/co-quan-nha-nuoc", "/tim-kiem"];
  return routes.map((route) => ({ url: new URL(route, base).toString(), changeFrequency: route === "/" ? "weekly" : "monthly", priority: route === "/" ? 1 : 0.7 }));
}
