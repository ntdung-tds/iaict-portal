import { redirect } from "next/navigation";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer";
import { CmsCollectionManager } from "@/components/admin/cms-collection-manager";

export default async function CmsModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (module === "users") redirect("/admin/users");
  if (module === "audit") return <AuditLogViewer />;
  return <CmsCollectionManager moduleKey={module} />;
}
