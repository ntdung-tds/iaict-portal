import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing";
import { transferSteps } from "@/lib/public-content";

export const metadata: Metadata = { title: "Chuyển giao công nghệ" };

export default function TransferPage() {
  return <CategoryLanding eyebrow="IAICT Transfer" title="Chuyển giao công nghệ" intro="Quy trình chuyển giao được nhìn như một chuỗi liên tục từ khảo sát, thử nghiệm đến hoàn thiện, bàn giao và đồng hành." items={transferSteps} />;
}
