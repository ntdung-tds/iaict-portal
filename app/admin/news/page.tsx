import type { Metadata } from "next";
import { NewsroomAdmin } from "@/components/admin/newsroom-admin";
import styles from "./admin-mobile.module.css";

export const metadata: Metadata = {
  title: "Newsroom Control Center",
  robots: { index: false, follow: false },
};

export default function NewsroomAdminPage() {
  return (
    <div className={styles.mobileAdminShell}>
      <NewsroomAdmin />
    </div>
  );
}
