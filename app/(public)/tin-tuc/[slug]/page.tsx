import type { Metadata } from "next";
import { PublicNewsDetail } from "@/components/public-news-detail";

export const metadata: Metadata = {
  title: "Tin tức | IAICT",
  description: "Bài viết đã được duyệt và xuất bản từ IAICT Newsroom, kèm thông tin nguồn gốc và truy vết.",
};

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  return <PublicNewsDetail slug={slug} />;
}
