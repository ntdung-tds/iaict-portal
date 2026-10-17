import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicCmsDetail } from "@/components/public-cms-detail";
import { getPublishedPage } from "@/lib/cms-public";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return {};
  return {
    title: page.seo.title || page.title,
    description: page.seo.description || page.summary || undefined,
  };
}

export default async function CmsPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) notFound();
  return <PublicCmsDetail entity={page} backHref="/" backLabel="Trang chủ" />;
}
