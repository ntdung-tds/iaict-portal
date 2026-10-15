import type { Metadata } from "next";
import { NewsroomAdmin } from "@/components/admin/newsroom-admin";

export const metadata: Metadata = {
  title: "Newsroom CMS",
  description: "Khu vực quản trị nguồn tin, duyệt nội dung và xuất bản của IAICT.",
  robots: { index: false, follow: false },
};

export default function NewsroomAdminPage() {
  return <NewsroomAdmin />;
}
