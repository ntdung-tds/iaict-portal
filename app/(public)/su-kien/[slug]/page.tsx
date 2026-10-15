import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicCmsDetail } from "@/components/public-cms-detail";
import { getPublishedEvent } from "@/lib/cms-public";
export const dynamic="force-dynamic";type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const{slug}=await params;const entity=await getPublishedEvent(slug);if(!entity)return{title:"Không tìm thấy sự kiện | IAICT"};return{title:entity.seo.title||entity.title,description:entity.seo.description||entity.summary||undefined};}
export default async function EventDetail({params}:Props){const{slug}=await params;const entity=await getPublishedEvent(slug);if(!entity)notFound();return<PublicCmsDetail entity={entity} backHref="/su-kien" backLabel="Sự kiện"/>;}
