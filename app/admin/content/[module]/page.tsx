import { redirect } from "next/navigation";
import { CmsCollectionManager } from "@/components/admin/cms-collection-manager";

export default async function CmsModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (module === "users") redirect("/admin/users");
  return <CmsCollectionManager moduleKey={module} />;
}
