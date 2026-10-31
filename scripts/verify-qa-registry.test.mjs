import { describe,it } from "node:test";
import assert from "node:assert/strict";
import { HEADER,parseCsv,validateCatalog,checkPrImpact } from "./verify-qa-registry.mjs";

describe("QA catalog contract",()=>{
  it("parses quoted commas, newlines and escaped quotes",()=>{
    const rows=parseCsv('a,b\n"x,y","quoted ""text"" and\nnew line"\n');
    assert.deepEqual(rows,[["a","b"],["x,y",'quoted "text" and\nnew line']]);
  });
  it("rejects duplicated IDs and unapproved evidence folders",()=>{
    const item=[
      "IAM-AUTH-001","Authentication","P0","Unit","AUTO","REQ-AUTH-COOKIE",
      "Native session fixture","synthetic cookie",
      "Create and verify a native secure cookie",
      "Cookie contains HttpOnly and Secure properties",
      "lib/native-auth.test.ts",
      "https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp",
      "READY",
    ];
    const result=validateCatalog([HEADER,...Array.from({length:60},()=>item)],{fileExists:()=>true});
    assert.ok(result.errors.some(x=>x.includes("duplicate ID")));
    const changed=[...item];changed[11]="https://example.invalid/evidence";
    const evidence=validateCatalog([HEADER,...Array.from({length:60},(_,i)=>[...changed[0].replace("001",String(i+1).padStart(3,"0")), ...changed.slice(1)])],{fileExists:()=>true});
    assert.ok(evidence.errors.some(x=>x.includes("unapproved evidence folder")));
  });
  it("rejects missing automated code references",()=>{
    const item=[
      "IAM-AUTH-001","Authentication","P0","Unit","AUTO","REQ-AUTH-COOKIE",
      "Native session fixture","synthetic cookie",
      "Create and verify a native secure cookie",
      "Cookie contains HttpOnly and Secure properties",
      "lib/unknown.test.ts",
      "https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp","READY",
    ];
    const result=validateCatalog([HEADER,item],{fileExists:()=>false});
    assert.ok(result.errors.some(x=>x.includes("unresolved automated test reference")));
  });
  it("requires catalog/run updates in PRs changing protected auth files",()=>{
    assert.equal(checkPrImpact(["lib/native-auth.ts"]).ok,false);
    assert.equal(checkPrImpact(["lib/native-auth.ts","docs/qa/IAICT_TEST_CASES.csv"]).ok,true);
    assert.equal(checkPrImpact(["components/public/footer.tsx"]).ok,true);
  });
});
