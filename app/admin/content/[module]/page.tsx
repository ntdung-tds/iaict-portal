import { CmsCollectionManager } from "@/components/admin/cms-collection-manager";

export default async function CmsModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <CmsCollectionManager moduleKey={module} />;
}
