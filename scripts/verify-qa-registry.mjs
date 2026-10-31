/** IAICT QA catalog and PR traceability gate. No secret/API/network access. */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REGISTRY="docs/qa/IAICT_TEST_CASES.csv";
export const HEADER=[
  "id","module","priority","layer","automation","requirement",
  "precondition","test_data","steps","expected","automation_ref",
  "evidence_folder","case_state",
];
const APPROVED_ROOT="https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp";
const levels=new Set(["P0","P1","P2"]);
const layers=new Set(["Unit","Integration","Security","Browser","Release","Manual"]);
const states=new Set(["READY","PLANNED"]);
const engines=new Set(["AUTO","MANUAL"]);

/** RFC4180-style quoted CSV parser, deliberately strict and dependency-free. */
export function parseCsv(csv) {
  const records=[];
  let row=[],field="",quoted=false,afterQuote=false;
  for(let i=0;i<csv.length;i++){
    const ch=csv[i];
    if(quoted){
      if(ch==='"'&&csv[i+1]==='"'){field+='"';i++;}
      else if(ch==='"'){quoted=false;afterQuote=true;}
      else field+=ch;
    }else if(afterQuote){
      if(ch===','){row.push(field);field="";afterQuote=false;}
      else if(ch==='\n'){row.push(field);records.push(row);row=[];field="";afterQuote=false;}
      else if(ch==='\r')continue;
      else throw Error("Unexpected character after quoted field");
    }else if(ch==='"'){
      if(field.length)throw Error("Unexpected quote in unquoted CSV field");
      quoted=true;
    }else if(ch===','){row.push(field);field="";}
    else if(ch==='\n'){row.push(field);records.push(row);row=[];field="";}
    else if(ch==='\r')continue;
    else field+=ch;
  }
  if(quoted)throw Error("Unclosed CSV quote");
  if(afterQuote||field||row.length){row.push(field);records.push(row);}
  return records;
}

export function validateCatalog(rows,{fileExists=existsSync}={}){
  const errors=[];
  if(!rows.length||rows[0].join("|")!==HEADER.join("|"))
    return {count:0,errors:["CSV header mismatch"]};
  const seen=new Set(), counters=new Map();
  const items=rows.slice(1);
  for(let n=0;n<items.length;n++){
    const cells=items[n],line=n+2;
    if(cells.length!==HEADER.length){errors.push(`line ${line}: expected ${HEADER.length} columns; got ${cells.length}`);continue;}
    const row=Object.fromEntries(HEADER.map((key,index)=>[key,cells[index].trim()]));
    for(const [key,value] of Object.entries(row)){
      if(!value)errors.push(`line ${line}: missing ${key}`);
    }
    if(!/^IAM-(AUTH|SESS|INV|USER|ACC|REL|UI|FUT)-\d{3}$/.test(row.id))
      errors.push(`line ${line}: invalid ID ${row.id}`);
    if(seen.has(row.id))errors.push(`line ${line}: duplicate ID ${row.id}`);
    seen.add(row.id);
    if(!levels.has(row.priority))errors.push(`line ${line}: invalid priority`);
    if(!layers.has(row.layer))errors.push(`line ${line}: invalid layer`);
    if(!engines.has(row.automation))errors.push(`line ${line}: invalid automation`);
    if(!states.has(row.case_state))errors.push(`line ${line}: invalid state`);
    if(!/^REQ-[A-Z0-9-]+$/.test(row.requirement))errors.push(`line ${line}: invalid requirement ID`);
    if(row.precondition.length<9||row.steps.length<14||row.expected.length<14)
      errors.push(`line ${line}: insufficient reproducible case detail`);
    if(row.evidence_folder!==APPROVED_ROOT)errors.push(`line ${line}: unapproved evidence folder`);
    if(row.automation==="AUTO"){
      if(!/^(lib|app|e2e|scripts|\.github)\//.test(row.automation_ref) ||
        !fileExists(row.automation_ref))
        errors.push(`line ${line}: unresolved automated test reference ${row.automation_ref}`);
      if(row.case_state!=="READY")errors.push(`line ${line}: automated case must be READY`);
    }else if(row.automation_ref!=="—"){
      errors.push(`line ${line}: manual test must not pretend an automation reference`);
    }
    counters.set(row.module,(counters.get(row.module)||0)+1);
  }
  if(items.length<60)errors.push("Too few baseline cases; unexpected catalog loss");
  for(const prefix of ["IAM-AUTH-","IAM-SESS-","IAM-INV-","IAM-USER-","IAM-ACC-","IAM-REL-"]){
    if(![...seen].some(id=>id.startsWith(prefix)))errors.push("Missing core suite "+prefix);
  }
  return {count:items.length,errors,modules:Object.fromEntries(counters)};
}

const guarded=/^(app\/api\/(auth|account|admin)\/|lib\/(native-|cms-users|cms-roles|cloudflare-access)|components\/admin\/user-management|worker\.ts$|cloudflare\/migrations\/|cloudflare\.config\.ts$|\.github\/workflows\/(ci|staging|deploy)|e2e\/.*\.spec\.ts$)/;
export function checkPrImpact(changed){
  const relevant=changed.filter(path=>guarded.test(path));
  if(!relevant.length)return {relevant,ok:true};
  const updated=changed.some(path=>[
    "docs/qa/IAICT_TEST_CASES.csv",
    "docs/qa/IAICT_TEST_MANAGEMENT.md",
    "docs/qa/IAICT_TEST_RUNS.md",
  ].includes(path));
  return {relevant,ok:updated};
}
function main(){
  const rows=parseCsv(readFileSync(REGISTRY,"utf8"));
  const result=validateCatalog(rows);
  if(result.errors.length){
    for(const problem of result.errors)console.error("[qa-registry] FAIL "+problem);
    process.exitCode=1;
    return;
  }
  console.log(`[qa-registry] PASS: ${result.count} structured cases; ${Object.keys(result.modules).length} suites; references and Drive links verified.`);
  // PR-only check. Full history is provided by the checkout used for this job.
  if(process.env.GITHUB_EVENT_NAME==="pull_request"&&process.env.GITHUB_BASE_REF){
    const base=process.env.GITHUB_BASE_REF;
    if(!/^[a-zA-Z0-9._/-]+$/.test(base)||base.startsWith("-"))throw Error("Invalid PR base");
    const paths=execFileSync("git",["diff","--name-only",`origin/${base}...HEAD`],{encoding:"utf8"}).trim().split("\n").filter(Boolean);
    const impact=checkPrImpact(paths);
    if(!impact.ok){
      console.error(`[qa-registry] FAIL: ${impact.relevant.length} QA-sensitive source files changed but no test catalog/plan/run entry was updated in this PR.`);
      process.exitCode=1;
    }else console.log(`[qa-registry] PR impact PASS (${impact.relevant.length} risk-sensitive paths).`);
  }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main();
