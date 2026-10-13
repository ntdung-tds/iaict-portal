import type { MetadataRoute } from "next";
import { mainNavigation } from "@/lib/public-content";
import { publications } from "@/lib/publications";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://iaict-demo.vercel.app";
  const routes = Array.from(new Set([
    ...mainNavigation.map((item) => item.href),
    "/dao-tao-tap-huan/co-quan-nha-nuoc",
    "/tim-kiem",
  ]));
  const lastModified = new Date();

  const coreRoutes: MetadataRoute.Sitemap = routes.map((route) => ({
    url: new URL(route, base).toString(),
    lastModified,
    changeFrequency: route === "/" || route === "/tin-tuc" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/tim-kiem" ? 0.4 : 0.7,
  }));

  const publicationRoutes: MetadataRoute.Sitemap = publications.map((item) => ({
    url: new URL(`/tin-tuc/${item.slug}`, base).toString(),
    lastModified: new Date(`${item.publishedAt}T00:00:00+07:00`),
    changeFrequency: "monthly",
    priority: item.featured ? 0.8 : 0.65,
  }));

  return [...coreRoutes, ...publicationRoutes];
}
