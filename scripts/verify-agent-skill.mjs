// IAICT agent package structural validation (offline, dependency-free).
// This checks local repository contract; it does NOT claim official skills-ref compliance.
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

export const SKILL_DIR=".agents/skills/iaict-project-management";
const docs=[
"AGENTS.md",
".github/copilot-instructions.md",
"CLAUDE.md",
"GEMINI.md",
"docs/project/DRIVE_REGISTRY.md",
"docs/project/OPERATING_MODEL.md",
"docs/project/START_HERE.md",
"docs/qa/IAICT_TEST_MANAGEMENT.md",
`${SKILL_DIR}/SKILL.md`,
`${SKILL_DIR}/references/drive-operations.md`,
`${SKILL_DIR}/references/delivery-workflow.md`,
`${SKILL_DIR}/references/templates.md`,
];

export function validateSkill(skill,filesExist=(p)=>existsSync(p)){
 const errors=[];
 if(!skill.startsWith("---\n"))errors.push("Missing YAML frontmatter opening");
 const end=skill.indexOf("\n---\n",4);
 if(end<0)errors.push("Missing YAML frontmatter closing");
 if(errors.length)return errors;
 const front=skill.slice(4,end);
 const name=front.match(/^name:\s*(\S+)\s*$/m)?.[1];
 const desc=front.match(/^description:\s*(.*)$/m)?.[1];
 if(name!=="iaict-project-management"||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name||"")))errors.push("Invalid skill name");
 if(!desc||desc.length>1024)errors.push("Invalid or missing description");
 if(skill.split("\n").length>500)errors.push("Skill exceeds progressive disclosure target");
 for(const match of skill.matchAll(/\]\((references\/[a-zA-Z0-9-]+\.md)\)/g)){
   if(!filesExist(`${SKILL_DIR}/${match[1]}`))errors.push("Missing referenced skill file: "+match[1]);
 }
 if(!skill.includes("production")||!skill.includes("QA")||!skill.includes("Drive"))errors.push("Missing critical scope");
 return errors;
}
export function validateRepository(){
 const errors=docs.filter(path=>!existsSync(path)).map(p=>"Missing "+p);
 if(errors.length)return errors;
 const skill=readFileSync(`${SKILL_DIR}/SKILL.md`,"utf8");
 errors.push(...validateSkill(skill));
 const rules=readFileSync("AGENTS.md","utf8");
 for(const needle of ["production","Cloudflare Access","Google Drive","AGENTS.md","not","test"]){
   if(!rules.toLowerCase().includes(needle.toLowerCase()))errors.push("AGENTS missing: "+needle);
 }
 const registry=readFileSync("docs/project/DRIVE_REGISTRY.md","utf8");
 for(const id of [
 "11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ",
 "1dVZjHE_0spjolHtWPvfKOydnbHZJwIT3",
 "1mE-w9P5JEKpr-EmCzQFrKcq4xXcryfIA",
 "1e8qxwlTawwJ7wZJcgWOjggKtxqhIGJmt",
 ]){
  if(!registry.includes(id))errors.push("Drive registry missing preserved folder ID: "+id);
 }
 return errors;
}
const invoked=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(invoked){
 const errors=validateRepository();
 for(const e of errors)console.error("[agent-skill] FAIL "+e);
 if(errors.length)process.exitCode=1;
 else console.log("[agent-skill] PASS: Skill metadata, references, multi-agent entrypoints and Drive registry.");
}
