import type { Metadata } from "next";
import { NewsroomAdmin } from "@/components/admin/newsroom-admin";

export const metadata: Metadata = {
  title: "Newsroom Control Center",
  robots: { index: false, follow: false },
};

export default function NewsroomAdminPage() {
  return <NewsroomAdmin />;
}
