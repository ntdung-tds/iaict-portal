import type { D1DatabaseLike } from "./cloudflare-db";

type RedirectRow={source_path:string;destination_path:string;status_code:number};
type CacheEntry={expiresAt:number;row:RedirectRow|null};
const CACHE_TTL_MS=60_000;
const cache=new Map<string,CacheEntry>();

function isPublicCandidate(request:Request){
  if(!["GET","HEAD"].includes(request.method))return false;
  const path=new URL(request.url).pathname;
  return !path.startsWith("/admin")&&!path.startsWith("/api")&&!path.startsWith("/_next")&&!path.startsWith("/cdn-cgi")&&!path.includes(".");
}

export async function resolvePublicRedirect(request:Request,db:D1DatabaseLike):Promise<Response|null>{
  if(!isPublicCandidate(request))return null;
  const url=new URL(request.url);const path=url.pathname;const now=Date.now();
  let row:RedirectRow|null;
  const cached=cache.get(path);
  if(cached&&cached.expiresAt>now)row=cached.row;
  else{
    row=await db.prepare(`SELECT source_path,destination_path,status_code FROM redirects WHERE source_path=? AND is_active=1 LIMIT 1`).bind(path).first<RedirectRow>();
    cache.set(path,{expiresAt:now+CACHE_TTL_MS,row});
  }
  if(!row)return null;
  const status=Number(row.status_code);
  if(![301,302,307,308].includes(status))return null;
  const target=new URL(row.destination_path,request.url);
  if(target.pathname===path&&target.origin===url.origin)return null;
  if(!target.search&&url.search)target.search=url.search;
  return Response.redirect(target.toString(),status as 301|302|307|308);
}

export function clearPublicRedirectCache(){cache.clear();}
