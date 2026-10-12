import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing";
import { solutionGroups } from "@/lib/public-content";

export const metadata: Metadata = { title: "Giải pháp & Dịch vụ" };

export default function SolutionsPage() {
  return <CategoryLanding eyebrow="IAICT Solutions" title="Giải pháp & Dịch vụ" intro="Phạm vi dịch vụ bao quát từ tư vấn, thiết kế đến phát triển, tích hợp và hỗ trợ vận hành." items={solutionGroups} />;
}
