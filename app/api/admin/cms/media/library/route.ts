import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { CMS_ADMIN_ROLES, CMS_READ_ROLES } from "@/lib/cms-roles";
import { getPrivateMediaR2Runtime } from "@/lib/media-r2-runtime";
import { listPrivateMedia, revokePrivateMedia } from "@/lib/media-r2-library";
import { readBoundedMediaRequest } from "@/lib/media-r2-quarantine";
import { sameOriginPost } from "@/lib/native-auth";
import { NewsroomAuthError, requireNewsroomActor } from "@/lib/newsroom-auth";

export const dynamic = "force-dynamic";
const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};
function safeError(error:unknown) {
  if (error instanceof NewsroomAuthError) return Response.json({
    ok:false,code:error.status===401?"AUTH_REQUIRED":"ROLE_DENIED",
  },{status:error.status,headers:privateHeaders});
  return Response.json({ok:false,code:"MEDIA_LIBRARY_UNAVAILABLE"},{
    status:503,headers:privateHeaders,
  });
}

/** Returns metadata only. Original/quarantine R2 bytes are never served. */
export async function GET(request:Request):Promise<Response>{
  try {
    const db=getDatabaseBinding();
    const actor=await requireNewsroomActor(request,db,CMS_READ_ROLES);
    if(!getPrivateMediaR2Runtime())
      return Response.json({ok:false,code:"MEDIA_QUARANTINE_NOT_ENABLED"},{
        status:503,headers:privateHeaders,
      });
    const url=new URL(request.url);
    const rawPage=url.searchParams.get("page")??"1";
    const result=await listPrivateMedia(db,actor,rawPage);
    return Response.json(result,{
      status:result.ok?200:result.status,headers:privateHeaders,
    });
  }catch(error){return safeError(error)}
}

/**
 * Explicit revocation by CMS Admin only. No immediate R2 byte deletion or
 * automatic content publication; private janitor applies retention policy.
 * Requires same-origin browser POST and an expected D1 revision.
 */
export async function POST(request:Request):Promise<Response>{
  try {
    const db=getDatabaseBinding();
    const actor=await requireNewsroomActor(request,db,CMS_ADMIN_ROLES);
    if(!sameOriginPost(request))
      return Response.json({ok:false,code:"ORIGIN_DENIED"},{
        status:403,headers:privateHeaders,
      });
    if(!getPrivateMediaR2Runtime())
      return Response.json({ok:false,code:"MEDIA_QUARANTINE_NOT_ENABLED"},{
        status:503,headers:privateHeaders,
      });
    if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")
      return Response.json({ok:false,code:"INVALID_CONTENT_TYPE"},{
        status:415,headers:privateHeaders,
      });
    const bounded=await readBoundedMediaRequest(request,1024,8,4000);
    if(!bounded.ok)
      return Response.json({ok:false,code:"INVALID_BODY"},{
        status:400,headers:privateHeaders,
      });
    let value:unknown;
    try {value=JSON.parse(new TextDecoder().decode(bounded.bytes));}
    catch{return Response.json({ok:false,code:"INVALID_BODY"},{status:400,headers:privateHeaders})}
    const body=value && typeof value==="object" && !Array.isArray(value)
      ? value as Record<string,unknown> : {};
    if(body.action!=="revoke")
      return Response.json({ok:false,code:"INVALID_ACTION"},{
        status:400,headers:privateHeaders,
      });
    const result=await revokePrivateMedia(db,actor,body.id,body.revision);
    return Response.json(result,{
      status:result.ok?200:result.status,headers:privateHeaders,
    });
  }catch(error){return safeError(error)}
}
