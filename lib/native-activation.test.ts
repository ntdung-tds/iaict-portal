import { describe,expect,it,vi } from "vitest";
import type { D1DatabaseLike,D1PreparedStatementLike,D1RunResult } from "./cloudflare-db";
import { ACTIVATION_TTL_MS,issueNativeActivation,redeemNativeActivation } from "./native-activation";

function simulatedDb(changes: number[]) {
  const queries: Array<{sql:string;values:unknown[]}> = [];
  const db: D1DatabaseLike = {
    prepare(sql) {
      const row={sql,values:[] as unknown[]};
      queries.push(row);
      const stmt: D1PreparedStatementLike = {
        bind(...values){row.values=values;return stmt;},
        async first<T>(){throw Error("No read of user identities is permitted in this test");},
        async all<T>(){return {results:[] as T[]};},
        async run(){throw Error("All activation mutations must be atomic D1 batches");},
      };
      return stmt;
    },
    async batch(statements) {
      expect(statements).toHaveLength(changes.length);
      return changes.map(value=>({meta:{changes:value}} as D1RunResult));
    },
  };
  return {db,queries};
}

describe("one-use activation security boundaries",()=>{
  it("creates a 256-bit random token, stores only its SHA-256 digest and expires after 30min",async()=>{
    const {db,queries}=simulatedDb([1,1]);
    const before=Date.now();
    const link=await issueNativeActivation(db,"admin-id","target-id");
    expect(link.token).toMatch(/^[a-f0-9]{64}$/);
    expect(link.expiresAt).toBeGreaterThanOrEqual(before+ACTIVATION_TTL_MS);
    expect(link.expiresAt).toBeLessThanOrEqual(Date.now()+ACTIVATION_TTL_MS);
    expect(queries[0].sql).toContain("NOT EXISTS(SELECT 1 FROM iaict_password_credentials_v2");
    expect(queries[0].sql).toContain("ON CONFLICT(user_id) DO UPDATE");
    expect(queries[0].sql).toContain("u.is_active=1");
    expect(queries[0].values[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(queries[0].values[0]).not.toBe(link.token);
    expect(JSON.stringify(queries)).not.toContain(link.token);
  });
  it("does not yield invitation when user is inactive, already credentialed or self",async()=>{
    const {db}=simulatedDb([0,0]);
    await expect(issueNativeActivation(db,"admin-id","target-id")).rejects.toThrow("ACTIVATION_NOT_ELIGIBLE");
    await expect(issueNativeActivation(db,"same","same")).rejects.toThrow("ACTIVATION_NOT_ELIGIBLE");
  });
  it("requires a valid token and strong-enough password before any DB write",async()=>{
    const {db,queries}=simulatedDb([1,1,1]);
    expect(await redeemNativeActivation(db,"invalid","Password-123")).toBe(false);
    expect(await redeemNativeActivation(db,"a".repeat(64),"short")).toBe(false);
    expect(queries).toHaveLength(0);
  });
  it("atomically consumes only the invitation matching the newly inserted credential",async()=>{
    const {db,queries}=simulatedDb([1,1,1]);
    const ok=await redeemNativeActivation(db,"a".repeat(64),"Password-123");
    expect(ok).toBe(true);
    expect(queries).toHaveLength(3);
    expect(queries[0].sql).toContain("i.consumed_at IS NULL AND i.expires_at>?");
    expect(queries[0].sql).toContain("NOT EXISTS(SELECT 1 FROM iaict_password_credentials_v2");
    expect(queries[0].sql).toContain("ON CONFLICT(user_id) DO NOTHING");
    expect(queries[1].sql).toContain("UPDATE iaict_activation_invites AS i");
    expect(queries[1].sql).toContain("c.password_hash=?");
    expect(queries[2].sql).toContain("auth.activation.redeem");
    expect(JSON.stringify(queries)).not.toContain("a".repeat(64));
  });
  it("rejects stale, expired, reused and racing invitations (no credential insert)",async()=>{
    const {db}=simulatedDb([0,0,0]);
    expect(await redeemNativeActivation(db,"a".repeat(64),"Password-123")).toBe(false);
  });
  it("rejects partial consumption; never reports success for missing consume",async()=>{
    const {db}=simulatedDb([1,0,0]);
    expect(await redeemNativeActivation(db,"b".repeat(64),"Password-123")).toBe(false);
  });
});
