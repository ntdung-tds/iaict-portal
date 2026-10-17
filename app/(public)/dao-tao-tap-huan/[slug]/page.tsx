import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicCmsDetail } from "@/components/public-cms-detail";
import { getPublishedEntity } from "@/lib/cms-public";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entity = await getPublishedEntity("course", slug);
  if (!entity) return {};
  return { title: entity.seo.title || entity.title, description: entity.seo.description || entity.summary || undefined };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await getPublishedEntity("course", slug);
  if (!entity) notFound();
  return <PublicCmsDetail entity={entity} backHref="/dao-tao-tap-huan" backLabel="Đào tạo & Tập huấn" />;
}
