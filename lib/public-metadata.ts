import type { Metadata } from "next";
import { absoluteSiteUrl, isIndexableSite } from "@/lib/site-config";

type PublicMetadataInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export function createPublicMetadata({
  title,
  description,
  path,
  index = true,
}: PublicMetadataInput): Metadata {
  const canonical = absoluteSiteUrl(path);
  const canIndex = isIndexableSite && index;

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical: canonical.toString() } } : {}),
    robots: {
      index: canIndex,
      follow: isIndexableSite,
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: "IAICT",
      title,
      description,
      ...(canonical ? { url: canonical.toString() } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/**
 * The public layout needs an absolute title, otherwise a parent root-layout
 * title template can turn the homepage into "IAICT | IAICT".
 * Descendant public pages still use the CMS-configured siteTitle suffix.
 */
export function createPublicLayoutTitle(siteTitle: string, defaultSeoTitle: string): NonNullable<Metadata["title"]> {
  const brand = siteTitle.trim();
  const homeTitle = defaultSeoTitle.trim() || brand;
  return {
    absolute: homeTitle,
    template: `%s · ${brand}`,
  };
}
