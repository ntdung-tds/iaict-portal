import type { Metadata } from "next";
import { MediaCompressionWorkbench } from "@/components/admin/media-compression-workbench";

export const metadata: Metadata = {
  title: "Nén ảnh và tệp | IAICT CMS",
  robots: { index: false, follow: false },
};

export default function CompressionToolPage() {
  return <MediaCompressionWorkbench />;
}
