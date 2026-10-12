import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IAICT — Viện Ứng dụng Công nghệ Thông tin và Truyền thông",
    template: "%s | IAICT",
  },
  description:
    "Cổng thông tin điện tử IAICT — sản phẩm, nền tảng, giải pháp, chuyển giao công nghệ, đào tạo và các hoạt động của Viện.",
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
