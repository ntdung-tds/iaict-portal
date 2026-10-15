import type { Metadata } from "next";
import { PublicCmsDirectory } from "@/components/public-cms-directory";
import { listPublishedPartners } from "@/lib/cms-public";
export const dynamic="force-dynamic";export const metadata:Metadata={title:"Đối tác | IAICT",description:"Hệ sinh thái đối tác và đơn vị hợp tác cùng IAICT."};
export default async function PartnersPage(){const items=(await listPublishedPartners()).map(item=>({id:item.id,title:item.name,summary:item.summary||item.publicNote,meta:"Đối tác IAICT",imageUrl:item.logoUrl,imageAlt:item.logoAlt||item.name,externalUrl:item.website}));return<PublicCmsDirectory eyebrow="IAICT / Partners" title="Đối tác" description="Các đơn vị trong hệ sinh thái hợp tác được IAICT công bố từ hệ thống quản trị nội dung." items={items} emptyText="Chưa có đối tác công khai."/>;}
