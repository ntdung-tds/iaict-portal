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
