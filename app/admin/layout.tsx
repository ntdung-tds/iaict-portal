import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CmsShell } from "@/components/admin/cms-shell";

export const metadata: Metadata = {
  title: {
    default: "IAICT CMS",
    template: "%s · IAICT CMS",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <CmsShell>{children}</CmsShell>;
}
