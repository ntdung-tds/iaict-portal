import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import type { ReactNode } from "react";
import { SiteMotion } from "@/components/site-motion";
import { isIndexableSite, SITE_DESCRIPTION, SITE_TITLE, siteBaseUrl } from "@/lib/site-config";
import "./globals.css";
import "./typography.css";
import "./project-showcase.css";
import "./home-density.css";
import "./home-editorial.css";
import "./public-foundation.css";
import "./design-tokens.css";
import "./brand-theme.css";
import "./public-active.css";
import "./site-motion.css";
import "./public-search.css";
import "./site-experience.css";
import "./home-active.css";
import "./public-landing.css";
import "./site-polish.css";
import "./v16-premium.css";
import "./v16-guardrails.css";
import "./v16-impact.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  metadataBase: siteBaseUrl ?? undefined,
  applicationName: "IAICT",
  title: {
    default: SITE_TITLE,
    template: "%s | IAICT",
  },
  description: SITE_DESCRIPTION,
  creator: "Viện Ứng dụng Công nghệ Thông tin và Truyền thông",
  publisher: "IAICT",
  category: "Công nghệ thông tin và truyền thông",
  robots: isIndexableSite
    ? { index: true, follow: true }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "IAICT",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    ...(siteBaseUrl ? { url: siteBaseUrl } : {}),
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
      </head>
      <body className="iaict-public ia-v16">
        <a className="skip-link" href="#main-content">
          Bỏ qua điều hướng
        </a>
        <SiteMotion />
        {children}
      </body>
    </html>
  );
}