import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
const {getDb,issue,auth}=vi.hoisted(()=>({getDb:vi.fn(),issue:vi.fn(),auth:vi.fn()}));
vi.mock("@/lib/cloudflare-db",()=>({getDatabaseBinding:getDb}));
vi.mock("@/lib/native-activation",()=>({issueNativeActivation:issue}));
vi.mock("@/lib/newsroom-auth",async importOriginal=>{
  const actual=await importOriginal<typeof import("@/lib/newsroom-auth")>();
  return {...actual,requireNewsroomActor:auth};
});
import {GET,POST} from "./route";
const base="https://iaict-portal-staging.iaict-platform.workers.dev";
function req(id:string,origin=base) {return new Request(base+"/api/admin/cms/activation",{
  method:"POST",headers:{"Content-Type":"application/json",Origin:origin},
  body:JSON.stringify({id}),
});}
beforeEach(()=>{(globalThis as typeof globalThis & {__IAICT_NATIVE_AUTH_ENABLED__?:boolean}).__IAICT_NATIVE_AUTH_ENABLED__=true;
  getDb.mockReturnValue({});
  auth.mockResolvedValue({id:"admin-id",email:"admin@example.test",roles:["admin"]});
  issue.mockResolvedValue({token:"a".repeat(64),expiresAt:1790000000000});});
afterEach(()=>{delete (globalThis as typeof globalThis & {__IAICT_NATIVE_AUTH_ENABLED__?:boolean}).__IAICT_NATIVE_AUTH_ENABLED__;
  vi.clearAllMocks();});
describe("admin-mediated one-time activation issuance",()=>{
  it("denies cross-origin action before authentication",async()=>{
    expect((await POST(req("target","https://attacker.invalid"))).status).toBe(403);
    expect(auth).not.toHaveBeenCalled();
  });
  it("requires authenticated CMS admin, not user supplied role or email",async()=>{
    const {NewsroomAuthError}=await import("@/lib/newsroom-auth");
    auth.mockRejectedValueOnce(new NewsroomAuthError(403,"Insufficient CMS role"));
    expect((await POST(req("target"))).status).toBe(403);
    expect(issue).not.toHaveBeenCalled();
  });
  it("returns a one-time fragment URL only after verified admin issue",async()=>{
    const res=await POST(req("target"));
    const data=await res.json();
    expect(res.status).toBe(200);expect(data.ok).toBe(true);
    expect(data.activationUrl).toBe(base+"/activate#token="+"a".repeat(64));
    expect(issue).toHaveBeenCalledWith(expect.anything(),"admin-id","target");
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("does not use GET for issuance",async()=>{expect((await GET()).status).toBe(405);});
});
