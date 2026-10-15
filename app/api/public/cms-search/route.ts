import { getDatabaseBinding } from "@/lib/cloudflare-db";
import type { SearchEntry } from "@/lib/public-search";

export const dynamic="force-dynamic";
type Row={title:string;summary:string|null;slug:string;extra:string|null};
async function rows(db:ReturnType<typeof getDatabaseBinding>,sql:string){return (await db.prepare(sql).all<Row>()).results;}
function toEntries(items:Row[],category:string,prefix:string):SearchEntry[]{return items.map(item=>({title:item.title,summary:item.summary??"",href:`${prefix}/${item.slug}`,category,keywords:item.extra??""}));}
export async function GET(){
  try{
    const db=getDatabaseBinding();
    const [pages,products,solutions,courses,projects,articles]=await Promise.all([
      rows(db,`SELECT title,summary,slug,COALESCE(page_type,'') AS extra FROM pages WHERE status='published' ORDER BY updated_at DESC LIMIT 100`),
      rows(db,`SELECT title,summary,slug,COALESCE(category,'') AS extra FROM products WHERE status='published' ORDER BY updated_at DESC LIMIT 100`),
      rows(db,`SELECT title,summary,slug,COALESCE(problem,'') AS extra FROM solutions WHERE status='published' ORDER BY updated_at DESC LIMIT 100`),
      rows(db,`SELECT title,summary,slug,COALESCE(code,'') || ' ' || COALESCE(duration,'') AS extra FROM courses WHERE status='published' ORDER BY updated_at DESC LIMIT 100`),
      rows(db,`SELECT title,summary,slug,COALESCE(context,'') AS extra FROM projects WHERE status='published' ORDER BY updated_at DESC LIMIT 100`),
      rows(db,`SELECT title,excerpt AS summary,slug,COALESCE(tags_json,'') AS extra FROM articles WHERE status='published' ORDER BY COALESCE(published_at,updated_at) DESC LIMIT 150`),
    ]);
    const items:SearchEntry[]=[...toEntries(pages,"Về Viện","/noi-dung"),...toEntries(products,"Công nghệ","/san-pham-nen-tang"),...toEntries(solutions,"Giải pháp","/giai-phap-dich-vu"),...toEntries(courses,"Đào tạo","/dao-tao-tap-huan"),...toEntries(projects,"Dự án","/du-an"),...toEntries(articles,"Tri thức","/tin-tuc")];
    return Response.json({ok:true,items},{headers:{"Cache-Control":"public,max-age=30,s-maxage=60,stale-while-revalidate=300"}});
  }catch{return Response.json({ok:false,items:[]},{status:200,headers:{"Cache-Control":"no-store"}});}
}
