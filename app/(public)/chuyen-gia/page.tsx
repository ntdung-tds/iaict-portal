import type { Metadata } from "next";
import { PublicCmsDirectory } from "@/components/public-cms-directory";
import { listPublishedExperts } from "@/lib/cms-public";
export const dynamic="force-dynamic";export const metadata:Metadata={title:"Chuyên gia | IAICT",description:"Đội ngũ và mạng lưới chuyên gia IAICT."};
export default async function ExpertsPage(){const items=(await listPublishedExperts()).map(item=>({id:item.id,title:item.title,summary:item.summary,meta:item.professional_title,href:`/chuyen-gia/${item.slug}`,imageUrl:item.photo_url,imageAlt:item.title}));return<PublicCmsDirectory eyebrow="IAICT / Experts" title="Chuyên gia" description="Hồ sơ chuyên môn được IAICT công bố từ hệ thống quản trị nội dung." items={items} emptyText="Chưa có hồ sơ chuyên gia công khai."/>;}
