import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { absoluteSiteUrl, isIndexableSite } from "@/lib/site-config";
import { createPublicLayoutTitle } from "@/lib/public-metadata";
import { getPublicSiteSettings } from "@/lib/public-site-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    title: createPublicLayoutTitle(settings.siteTitle, settings.defaultSeoTitle),
    description: settings.defaultSeoDescription || settings.siteDescription,
  };
}

export default async function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  const settings = await getPublicSiteSettings();
  const siteUrl = absoluteSiteUrl("/");
  const searchUrl = absoluteSiteUrl("/tim-kiem");
  const structuredData = isIndexableSite && siteUrl
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: settings.organizationName,
          alternateName: "IAICT",
          url: siteUrl.toString(),
          description: settings.siteDescription,
          ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
          ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
          ...(settings.address ? { address: settings.address } : {}),
          ...(Object.values(settings.socialLinks).length ? { sameAs: Object.values(settings.socialLinks) } : {}),
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: settings.siteTitle,
          alternateName: "IAICT",
          url: siteUrl.toString(),
          inLanguage: "vi-VN",
          ...(searchUrl
            ? {
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${searchUrl.toString()}?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              }
            : {}),
        },
      ]
    : null;

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
