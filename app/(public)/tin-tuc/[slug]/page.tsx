import type { Metadata } from "next";
import { PublicNewsDetail } from "@/components/public-news-detail";
import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { getPublishedNewsBySlug } from "@/lib/public-news";

export const dynamic="force-dynamic";
type NewsDetailPageProps={params:Promise<{slug:string}>};
export async function generateMetadata({params}:NewsDetailPageProps):Promise<Metadata>{try{const{slug}=await params;const item=await getPublishedNewsBySlug(getDatabaseBinding(),slug);if(!item)return{title:"Không tìm thấy bài viết | IAICT"};return{title:item.title,description:item.excerpt||undefined,openGraph:item.heroUrl?{images:[{url:item.heroUrl,alt:item.heroAlt||item.title}]}:undefined};}catch{return{title:"Tin tức | IAICT",description:"Bài viết và tri thức ứng dụng từ IAICT."};}}
export default async function NewsDetailPage({params}:NewsDetailPageProps){const{slug}=await params;return<PublicNewsDetail slug={slug}/>;}
