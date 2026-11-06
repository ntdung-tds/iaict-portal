import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateSkill,validateRepository,SKILL_DIR} from "./verify-agent-skill.mjs";
describe("IAICT portable Agent Skill contract",()=>{
 it("accepts the current repository skill with required reference files",()=>{
  const content=readFileSync(`${SKILL_DIR}/SKILL.md`,"utf8");
  assert.deepEqual(validateSkill(content),[]);
  assert.deepEqual(validateRepository(),[]);
 });
 it("rejects wrong frontmatter, missing description and broken reference",()=>{
  assert.ok(validateSkill("no yaml").length);
  const malformed="---\nname: Invalid Skill\ndescription: \n---\nRead [missing](references/not-found.md).\n";
  const errors=validateSkill(malformed,()=>false);
  assert.ok(errors.some(x=>x.includes("name")));
  assert.ok(errors.some(x=>x.includes("description")));
  assert.ok(errors.some(x=>x.includes("Missing referenced")));
 });
});
