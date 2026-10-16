import type { D1DatabaseLike } from './cloudflare-db';
import { isNavigationHref } from './cms-navigation-link';
import { isRedirectSource } from './cms-redirect-rules';

type RedirectRow = {source_path:string;destination_path:string;status_code:number};
type CacheEntry = {expiresAt:number;row:RedirectRow|null};
let caches = new WeakMap<D1DatabaseLike,Map<string,CacheEntry>>();
async function lookup(db:D1DatabaseLike,path:string) {
  let cache=caches.get(db);
  if(!cache){cache=new Map();caches.set(db,cache);}
  const cached=cache.get(path);
  if(cached&&cached.expiresAt>Date.now())return cached.row;
  const row=await db.prepare('SELECT source_path,destination_path,status_code FROM redirects WHERE source_path=? AND is_active=1 LIMIT 1').bind(path).first<RedirectRow>();
  if(cache.size>=1000)cache.clear();
  cache.set(path,{expiresAt:Date.now()+60_000,row});
  return row;
}

export async function resolvePublicRedirect(request:Request,db:D1DatabaseLike):Promise<Response|null>{
  if(!['GET','HEAD'].includes(request.method))return null;
  const original=new URL(request.url);
  if(!isRedirectSource(original.pathname))return null;
  try {
    const visited=new Set<string>();
    let current=original;
    let response:Response|null=null;
    for(let hop=0;hop<=10;hop++){
      if(visited.has(current.pathname))return null;
      visited.add(current.pathname);
      const row=await lookup(db,current.pathname);
      if(!row)return response;
      if(hop===10||![301,302,307,308].includes(Number(row.status_code))||!isNavigationHref(row.destination_path))return null;
      const target=new URL(row.destination_path,current);
      if(!target.search&&current.search)target.search=current.search;
      if(!response)response=new Response(null,{status:Number(row.status_code),headers:{Location:target.toString(),'Cache-Control':'no-store'}});
      if(target.origin!==original.origin||!isRedirectSource(target.pathname))return response;
      current=target;
    }
    return null;
  } catch {
    // A bad legacy rule or temporary D1 failure must not take the public site down.
    return null;
  }
}

export function clearPublicRedirectCache(){caches=new WeakMap();}
