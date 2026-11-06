import type { Metadata } from "next";
import { MediaQuarantineUpload } from "@/components/admin/media-quarantine-upload";

export const metadata: Metadata = {
  title: "Tải Media vào vùng cách ly | IAICT CMS",
  robots: { index: false, follow: false },
};

export default function MediaUploadPage() {
  return <MediaQuarantineUpload />;
}
