import {readFileSync,existsSync,readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

// Offline structural check: does NOT certify product, security, live QA or approvals.
export const REQUIRED=[
 "docs/project/PROJECT_PLAN.md",
 "docs/project/PROJECT_PROGRESS.md",
 "docs/project/CHECKLIST_MOMENT.md",
 "docs/project/CHECKLIST_MOMENT_TEMPLATE.md",
];
export const STATES=new Set(["DONE","IN_PROGRESS","BLOCKED","NOT_STARTED","DEFERRED"]);

export function validateContent(live,progress,snapshotName,snapshot){
 const errors=[];
 const moment=live.match(/\*\*Moment ID:\*\* \x60([^\x60]+)\x60/)?.[1];
 const smoment=snapshot.match(/\*\*Moment ID:\*\* \x60([^\x60]+)\x60/)?.[1];
 if(!moment||!smoment||moment!==smoment)errors.push("MOMENT_MISMATCH");
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-ICT\.md$/.test(snapshotName))errors.push("INVALID_SNAPSHOT_NAME");
 if(moment){
  const m=moment.match(/^MOMENT-IAICT-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})-ICT$/);
  if(!m)errors.push("INVALID_MOMENT_ID");
  else if(m[1]+"-"+m[2]+"-"+m[3]+"T"+m[4]+"-"+m[5]+"-ICT.md"!==snapshotName)errors.push("MOMENT_TIMESTAMP_MISMATCH");
 }
 const area=live.split("## A. CMS/CRM-1 — 10 scoped checklist items")[1]?.split("## B. IAM v1.2")[0]||"";
 const cms=[];
 for(const line of area.split("\n")){
  const m=line.match(/^\| (CMS-\d{2}) \| \[([x ])\] \| ([A-Z_]+) \|/);
  if(m)cms.push({id:m[1],checked:m[2]==="x",state:m[3]});
 }
 if(cms.length!==10||new Set(cms.map(x=>x.id)).size!==10||Array.from({length:10},(_,i)=>"CMS-"+String(i+1).padStart(2,"0")).some(id=>!cms.some(x=>x.id===id)))errors.push("CMS_IDS_MISSING_OR_DUPLICATE");
 if(cms.some(x=>!STATES.has(x.state)||x.checked!==(x.state==="DONE")))errors.push("CMS_CHECKBOX_STATE_MISMATCH");
 const count=live.match(/\*\*Progress:\*\* \*\*(\d+)\/(\d+) DONE/);
 const done=cms.filter(x=>x.state==="DONE").length;
 if(!count||Number(count[1])!==done||Number(count[2])!==cms.length)errors.push("CMS_PROGRESS_COUNT_MISMATCH");
 const pcount=progress.match(/\*\*(\d+)\/(\d+)\*\*/);
 if(!pcount||Number(pcount[1])!==done||Number(pcount[2])!==cms.length)errors.push("PROJECT_PROGRESS_NOT_SYNCED");
 const iam=live.split("## B. IAM v1.2 backlog crosswalk — 20 items")[1]?.split("## C. QA and release boundary")[0]||"";
 const iamIds=[...iam.matchAll(/^\| IAM-(\d{2}) \| [^\n]+ \| (DONE|IN_PROGRESS|BLOCKED|NOT_STARTED|DEFERRED) \|/gm)].map(x=>Number(x[1]));
 if(iamIds.length!==20||new Set(iamIds).size!==20||Array.from({length:20},(_,i)=>i+1).some(id=>!iamIds.includes(id)))errors.push("IAM_BACKLOG_20_MAPPING_MISSING");
 for(const needle of ["NOT_RUN","BLOCKED","bàn giao","SRS","PROJECT_PLAN.md","PROJECT_PROGRESS.md"]){
  if(!live.includes(needle))errors.push("MISSING_SAFETY_OR_REFERENCE: "+needle);
 }
 if(!snapshot.includes("IMMUTABLE SNAPSHOT"))errors.push("SNAPSHOT_NOT_MARKED_IMMUTABLE");
 return errors;
}
export function validateRepository(root="."){
 const errors=[];
 for(const p of REQUIRED)if(!existsSync(resolve(root,p)))errors.push("MISSING_FILE: "+p);
 const dir=resolve(root,"docs/project/checklist-moments");
 if(!existsSync(dir))errors.push("MISSING_MOMENT_DIRECTORY");
 if(errors.length)return errors;
 const names=readdirSync(dir).filter(x=>/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-ICT\.md$/.test(x)).sort();
 if(!names.length)return ["NO_IMMUTABLE_MOMENT"];
 const read=p=>readFileSync(resolve(root,p),"utf8");
 const live=read("docs/project/CHECKLIST_MOMENT.md");
 const progress=read("docs/project/PROJECT_PROGRESS.md");
 const latest=names[names.length-1];
 return validateContent(live,progress,latest,read("docs/project/checklist-moments/"+latest));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const errors=validateRepository();
 for(const e of errors)console.error("[checklist-moment] FAIL "+e);
 if(errors.length)process.exitCode=1;
 else console.log("[checklist-moment] PASS: plan/progress, 10 CMS, 20 IAM and latest immutable moment.");
}
