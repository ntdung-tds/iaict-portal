import { afterEach,beforeEach,describe,expect,it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { D1DatabaseLike,D1PreparedStatementLike,D1BindValue,D1RunResult } from "./cloudflare-db";
import { issueNativeActivation,redeemNativeActivation } from "./native-activation";

let sqlite: DatabaseSync;

function adapter(database:DatabaseSync):D1DatabaseLike {
  return {
    prepare(sql) {
      let params:D1BindValue[]=[];
      const statement:D1PreparedStatementLike={
        bind(...values){params=values;return statement;},
        async first<T>() {return (database.prepare(sql).get(...params as never[])??null) as T|null;},
        async all<T>() {return {results:database.prepare(sql).all(...params as never[]) as T[]};},
        async run():Promise<D1RunResult>{
          const result=database.prepare(sql).run(...params as never[]);
          return {success:true,meta:{changes:result.changes}};
        },
      };
      return statement;
    },
    async batch(statements){
      database.exec("BEGIN");
      try{
        const results:D1RunResult[]=[];
        for(const stmt of statements)results.push(await stmt.run());
        database.exec("COMMIT");return results;
      }catch(error){database.exec("ROLLBACK");throw error;}
    },
  };
}

beforeEach(()=>{
  sqlite=new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("cloudflare/migrations/0001_core.sql","utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0023_iaict_auth_pbkdf2_workers.sql","utf8"));
  sqlite.exec(readFileSync("cloudflare/migrations/0024_iaict_activation_invites.sql","utf8"));
  sqlite.exec("INSERT INTO admin_users(id,email,is_active,created_at,updated_at) VALUES" +
    "('qa-admin','admin@example.test',1,'now','now')," +
    "('qa-user','user@example.test',1,'now','now')," +
    "('qa-inactive','inactive@example.test',0,'now','now')");
  sqlite.exec("INSERT INTO roles(id,code,name) VALUES('role-admin','admin','Admin'),('role-editor','editor','Editor')");
  sqlite.exec("INSERT INTO admin_user_roles(user_id,role_id) VALUES" +
    "('qa-admin','role-admin'),('qa-user','role-editor'),('qa-inactive','role-editor')");
});
afterEach(()=>sqlite.close());

describe("native activation using real SQLite D1 schema",()=>{
  it("sets first password exactly once and blocks reuse",async()=>{
    const db=adapter(sqlite);
    const issued=await issueNativeActivation(db,"qa-admin","qa-user");
    expect(await redeemNativeActivation(db,issued.token,"SamplePassword-2026")).toBe(true);
    expect(await redeemNativeActivation(db,issued.token,"AnotherPassword-2026")).toBe(false);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM iaict_password_credentials_v2").get()).toMatchObject({n:1});
    expect(sqlite.prepare("SELECT consumed_at IS NOT NULL AS used FROM iaict_activation_invites WHERE user_id=?").get("qa-user")).toMatchObject({used:1});
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE action='auth.activation.redeem'").get()).toMatchObject({n:1});
  });
  it("reissuing invitation invalidates earlier link",async()=>{
    const db=adapter(sqlite);
    const first=await issueNativeActivation(db,"qa-admin","qa-user");
    const second=await issueNativeActivation(db,"qa-admin","qa-user");
    expect(first.token).not.toBe(second.token);
    expect(await redeemNativeActivation(db,first.token,"FirstPassword-2026")).toBe(false);
    expect(await redeemNativeActivation(db,second.token,"SecondPassword-2026")).toBe(true);
  });
  it("refuses self-issue, disabled user, and already credentialed target",async()=>{
    const db=adapter(sqlite);
    await expect(issueNativeActivation(db,"qa-admin","qa-admin")).rejects.toThrow("ACTIVATION_NOT_ELIGIBLE");
    await expect(issueNativeActivation(db,"qa-admin","qa-inactive")).rejects.toThrow("ACTIVATION_NOT_ELIGIBLE");
    const issued=await issueNativeActivation(db,"qa-admin","qa-user");
    expect(await redeemNativeActivation(db,issued.token,"SamplePassword-2026")).toBe(true);
    await expect(issueNativeActivation(db,"qa-admin","qa-user")).rejects.toThrow("ACTIVATION_NOT_ELIGIBLE");
  });
  it("deactivation and role removal block activation even if link exists",async()=>{
    const db=adapter(sqlite);
    const issued=await issueNativeActivation(db,"qa-admin","qa-user");
    sqlite.exec("UPDATE admin_users SET is_active=0 WHERE id='qa-user'");
    expect(await redeemNativeActivation(db,issued.token,"SamplePassword-2026")).toBe(false);
    sqlite.exec("UPDATE admin_users SET is_active=1 WHERE id='qa-user'");
    sqlite.exec("DELETE FROM admin_user_roles WHERE user_id='qa-user'");
    expect(await redeemNativeActivation(db,issued.token,"SamplePassword-2026")).toBe(false);
  });
  it("expired invitation cannot be redeemed",async()=>{
    const db=adapter(sqlite);
    const issued=await issueNativeActivation(db,"qa-admin","qa-user");
    sqlite.exec("UPDATE iaict_activation_invites SET expires_at=issued_at+1 WHERE user_id='qa-user'");
    expect(await redeemNativeActivation(db,issued.token,"SamplePassword-2026")).toBe(false);
  });
});
