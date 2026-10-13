import type { MetadataRoute } from "next";
import { mainNavigation } from "@/lib/public-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://iaict-demo.vercel.app";
  const routes = Array.from(new Set([
    ...mainNavigation.map((item) => item.href),
    "/dao-tao-tap-huan/co-quan-nha-nuoc",
    "/tim-kiem",
  ]));
  const lastModified = new Date();

  return routes.map((route) => ({
    url: new URL(route, base).toString(),
    lastModified,
    changeFrequency: route === "/" || route === "/tin-tuc" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/tim-kiem" ? 0.4 : 0.7,
  }));
}
