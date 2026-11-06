import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
const {getDb,redeem}=vi.hoisted(()=>({getDb:vi.fn(),redeem:vi.fn()}));
vi.mock("@/lib/cloudflare-db",()=>({getDatabaseBinding:getDb}));
vi.mock("@/lib/native-activation",()=>({redeemNativeActivation:redeem}));
import { GET,POST } from "./route";
const base="https://iaict-portal-staging.iaict-platform.workers.dev";
const token="a".repeat(64);
const body={token,password:"TestPassword-123"};
function req(data:unknown,origin=base,contentType="application/json") {
  return new Request(base+"/api/auth/activate",{method:"POST",
    headers:{Origin:origin,"Content-Type":contentType},body:JSON.stringify(data)});
}
beforeEach(()=>{(globalThis as typeof globalThis & {__IAICT_NATIVE_AUTH_ENABLED__?:boolean}).__IAICT_NATIVE_AUTH_ENABLED__=true;
  getDb.mockReturnValue({});redeem.mockResolvedValue(true);});
afterEach(()=>{delete (globalThis as typeof globalThis & {__IAICT_NATIVE_AUTH_ENABLED__?:boolean}).__IAICT_NATIVE_AUTH_ENABLED__;
  vi.clearAllMocks();});
describe("public account activation API",()=>{
  it("is disabled by default and never touches D1",async()=>{
    (globalThis as typeof globalThis & {__IAICT_NATIVE_AUTH_ENABLED__?:boolean}).__IAICT_NATIVE_AUTH_ENABLED__=false;
    expect((await POST(req(body))).status).toBe(404);expect(getDb).not.toHaveBeenCalled();
  });
  it("rejects cross-origin requests and non-JSON requests",async()=>{
    expect((await POST(req(body,"https://attacker.invalid"))).status).toBe(403);
    expect((await POST(req(body,base,"text/plain"))).status).toBe(415);
    expect(redeem).not.toHaveBeenCalled();
  });
  it("rejects invalid token, short password or huge body",async()=>{
    expect((await POST(req({...body,token:"invalid"}))).status).toBe(400);
    expect((await POST(req({...body,password:"short"}))).status).toBe(400);
    const huge={...body,extra:"x".repeat(5000)};
    expect((await POST(req(huge))).status).toBe(413);
    expect(redeem).not.toHaveBeenCalled();
  });
  it("redeems once without creating session or exposing token",async()=>{
    const res=await POST(req(body));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ok:true,loginUrl:"/login"});
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(redeem).toHaveBeenCalledWith(expect.anything(),token,body.password);
  });
  it("sends generic expiration error for already-used token",async()=>{
    redeem.mockResolvedValue(false);
    const res=await POST(req(body));expect(res.status).toBe(410);
    expect(await res.text()).not.toContain(token);
  });
  it("does not accept GET activation",async()=>{expect((await GET()).status).toBe(405);});
});
