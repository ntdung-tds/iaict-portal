import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./premium.css";
import "./category-premium.css";
import "./public-pages-premium.css";
import "./search-training-premium.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://iaict-demo.vercel.app";
const siteTitle = "IAICT — Viện Ứng dụng Công nghệ Thông tin và Truyền thông";
const siteDescription = "Cổng thông tin điện tử IAICT — công nghệ, giải pháp, chuyển giao, đào tạo và các hoạt động của Viện.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "IAICT",
  title: {
    default: siteTitle,
    template: "%s | IAICT",
  },
  description: siteDescription,
  keywords: [
    "IAICT",
    "Viện Ứng dụng Công nghệ Thông tin và Truyền thông",
    "chuyển đổi số",
    "AI",
    "dữ liệu",
    "IoT",
    "chuyển giao công nghệ",
    "đào tạo tập huấn",
  ],
  authors: [{ name: "IAICT" }],
  creator: "IAICT",
  publisher: "IAICT",
  category: "Technology",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "IAICT",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "IAICT — Công nghệ, Giải pháp, Chuyển giao, Đào tạo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <a className="skip-link" href="#main-content">
          Bỏ qua điều hướng
        </a>
        {children}
      </body>
    </html>
  );
}
