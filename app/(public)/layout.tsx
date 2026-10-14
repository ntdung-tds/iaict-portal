import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { absoluteSiteUrl, isIndexableSite, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-config";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  const siteUrl = absoluteSiteUrl("/");
  const searchUrl = absoluteSiteUrl("/tim-kiem");
  const structuredData = isIndexableSite && siteUrl
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Viện Ứng dụng Công nghệ Thông tin và Truyền thông",
          alternateName: "IAICT",
          url: siteUrl.toString(),
          description: SITE_DESCRIPTION,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_TITLE,
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
