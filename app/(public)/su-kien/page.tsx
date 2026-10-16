import { sessionDateLabel } from "@/lib/cms-session-dates";
import type { Metadata } from "next";
import { PublicCmsDirectory } from "@/components/public-cms-directory";
import { listPublishedEvents } from "@/lib/cms-public";
export const dynamic="force-dynamic";export const metadata:Metadata={title:"Sự kiện | IAICT",description:"Hội thảo, tọa đàm và sự kiện được IAICT công bố."};
export default async function EventsPage(){const items=(await listPublishedEvents()).map(item=>({id:item.id,title:item.title,summary:item.summary,meta:[item.start_at?sessionDateLabel(item.start_at)+" (giờ Việt Nam)":null,item.location].filter(Boolean).join(" · "),href:`/su-kien/${item.slug}`}));return<PublicCmsDirectory eyebrow="IAICT / Events" title="Sự kiện" description="Hội thảo, tọa đàm và các hoạt động chuyên môn được công bố từ hệ thống nội dung IAICT." items={items} emptyText="Chưa có sự kiện công khai."/>;}
