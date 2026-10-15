import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicCmsDetail } from "@/components/public-cms-detail";
import { getPublishedExpert } from "@/lib/cms-public";
export const dynamic="force-dynamic";type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const{slug}=await params;const entity=await getPublishedExpert(slug);if(!entity)return{title:"Không tìm thấy chuyên gia | IAICT"};return{title:entity.seo.title||entity.title,description:entity.seo.description||entity.summary||undefined,openGraph:entity.heroUrl?{images:[{url:entity.heroUrl,alt:entity.heroAlt||entity.title}]}:undefined};}
export default async function ExpertDetail({params}:Props){const{slug}=await params;const entity=await getPublishedExpert(slug);if(!entity)notFound();return<PublicCmsDetail entity={entity} backHref="/chuyen-gia" backLabel="Chuyên gia"/>;}
