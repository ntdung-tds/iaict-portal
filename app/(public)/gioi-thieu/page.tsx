import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing";
import { pillars } from "@/lib/public-content";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function AboutPage() {
  return <CategoryLanding eyebrow="Giới thiệu IAICT" title="Kết nối nghiên cứu, ứng dụng và chuyển giao" intro="IAICT định hướng cổng thông tin theo bốn trụ cột công nghệ, giải pháp, chuyển giao và đào tạo; giúp người dùng đi từ bài toán đến năng lực phù hợp." items={pillars} />;
}
