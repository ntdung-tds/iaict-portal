import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import type { ReactNode } from "react";
import { SiteMotion } from "@/components/wow/site-motion";
import "./globals.css";
import "./typography.css";
import "./project-v4.css";
import "./home-density.css";
import "./home-editorial.css";
import "./wow-v9.css";
import "./wow-v10.css";
import "./public-active.css";
import "./wow-motion.css";
import "./public-search.css";
import "./wow-final.css";
import "./home-active.css";
import "./public-landing.css";
import "./final-polish.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://iaict.example"),
  title: {
    default: "IAICT — Viện Ứng dụng Công nghệ Thông tin và Truyền thông",
    template: "%s | IAICT",
  },
  description:
    "Cổng thông tin điện tử IAICT — công nghệ, giải pháp, chuyển giao, đào tạo và các hoạt động của Viện.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="iaict-v11 iaict-final">
        <a className="skip-link" href="#main-content">
          Bỏ qua điều hướng
        </a>
        <SiteMotion />
        {children}
      </body>
    </html>
  );
}
