import { expect, test, type Page } from "@playwright/test";

// Browser UI only. CMS sessions and API responses below are MOCKED; never
// claim this suite authenticates or uploads to actual hosted staging R2.
const path = "/admin/media/upload";
const endpoint = "**/api/admin/cms/media/quarantine";
const png = Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0]);
const id = "4ec14136-a36e-45bf-94f0-4d61e3f79893";

async function mockCms(page:Page,role:"admin"|"editor"|"viewer"="editor") {
  await page.route("**/api/admin/cms/session",route=>route.fulfill({
    json:{ok:true,actor:{id:"local-qa",roles:[role]}},
  }));
}
function gate(open:boolean,roleAllowed=true) {
  return {
    ok:true,quarantineEnabled:open,
    scannerConfigured:false,publicationEnabled:false,
    roleAllowed,policyId:"IAICT-MEDIA-20261104-V1",maxBytes:10485760,
  };
}
test("staging gate OFF does not allow any R2 upload and displays clear protection", async({page})=>{
  await mockCms(page);
  let posts=0;
  await page.route(endpoint,route=>{
    if(route.request().method()==="POST") posts++;
    void route.fulfill({json:gate(false)});
  });
  const res=await page.goto(path,{waitUntil:"domcontentloaded"});
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Tải ảnh vào vùng cách ly"})).toBeVisible();
  await expect(page.getByText("Upload cách ly chưa sẵn sàng")).toBeVisible();
  await expect(page.getByRole("button",{name:"Tải lên vùng cách ly"})).toBeDisabled();
  expect(posts).toBe(0);
  await expect(page.getByText("chưa kết nối")).toBeVisible();
});

test("authorized editor uploads exactly one synthetic PNG to private QUARANTINED state",async({page})=>{
  await mockCms(page,"editor");
  const requests:{method:string;mime:string|null;filename:string|null;idem:string|null;size:number}[]=[];
  await page.route(endpoint,async route=>{
    const req=route.request();
    if(req.method()==="GET"){await route.fulfill({json:gate(true)});return;}
    const body=req.postDataBuffer();
    requests.push({method:req.method(),mime:req.headers()["content-type"]??null,
      filename:req.headers()["x-media-filename"]??null,
      idem:req.headers()["idempotency-key"]??null,size:body?.length??0});
    await route.fulfill({status:201,json:{
      ok:true,status:201,id,state:"QUARANTINED",requiresScan:true,publicUrl:null,
    }});
  });
  await page.goto(path,{waitUntil:"domcontentloaded"});
  await expect(page.locator('aside[aria-label="Điều hướng CMS"] a[href="/admin/media/upload"]')).toBeVisible();
  await expect(page.getByText("Upload cách ly đang mở")).toBeVisible();
  await page.locator("#iaict-upload-media").setInputFiles({
    name:"qa-private.png",mimeType:"image/png",buffer:png,
  });
  await expect(page.getByRole("button",{name:"Tải lên vùng cách ly"})).toBeEnabled();
  await page.getByRole("button",{name:"Tải lên vùng cách ly"}).click();
  await expect(page.getByText("Ảnh đã được lưu vào vùng cách ly riêng tư.")).toBeVisible();
  await expect(page.getByText("QUARANTINED · Chờ quét")).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    method:"POST",mime:"image/png",filename:"qa-private.png",size:png.byteLength,
  });
  expect(requests[0].idem).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page.getByText(/Chức năng này/)).toContainText("không xuất bản");
});

test("viewer has no upload link and no enabled upload even after direct navigation",async({page})=>{
  await mockCms(page,"viewer");
  await page.route(endpoint,route=>route.fulfill({status:403,json:{
    ok:false,code:"ROLE_DENIED",quarantineEnabled:false,publicationEnabled:false,
  }}));
  await page.goto(path,{waitUntil:"domcontentloaded"});
  await expect(page.locator('aside[aria-label="Điều hướng CMS"] a[href="/admin/media/upload"]')).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Tải lên vùng cách ly"})).toBeDisabled();
  await expect(page.getByText(/Tài khoản không có quyền tải Media/)).toBeVisible();
});

test("same idempotency key is reused on a failed request retry; no public serving",async({page})=>{
  await mockCms(page);
  let calls=0;const ids:string[]=[];
  await page.route(endpoint,async route=>{
    if(route.request().method()==="GET"){await route.fulfill({json:gate(true)});return;}
    calls++;ids.push(route.request().headers()["idempotency-key"]??"");
    if(calls===1){await route.fulfill({status:503,json:{ok:false,code:"MEDIA_UNAVAILABLE"}});return;}
    await route.fulfill({status:200,json:{ok:true,status:200,id,state:"QUARANTINED",requiresScan:true,publicUrl:null}});
  });
  await page.goto(path);
  await expect(page.getByText("Upload cách ly đang mở")).toBeVisible();
  await page.locator("#iaict-upload-media").setInputFiles({name:"retry.png",mimeType:"image/png",buffer:png});
  await page.getByRole("button",{name:"Tải lên vùng cách ly"}).click();
  await expect(page.getByRole("alert")).toContainText("Máy chủ Media tạm thời");
  await page.getByRole("button",{name:"Tải lên vùng cách ly"}).click();
  await expect(page.getByText("Ảnh đã được lưu vào vùng cách ly riêng tư.")).toBeVisible();
  expect(ids).toHaveLength(2);
  expect(ids[0]).toEqual(ids[1]);
});

test("320px mobile layout has no horizontal overflow, refuses oversize before network",async({page})=>{
  await page.setViewportSize({width:320,height:740});
  await mockCms(page);
  let posts=0;
  await page.route(endpoint,route=>{
    if(route.request().method()==="POST")posts++;
    void route.fulfill({json:gate(true)});
  });
  await page.goto(path);
  await expect(page.getByText("Upload cách ly đang mở")).toBeVisible();
  await page.locator("#iaict-upload-media").setInputFiles({
    name:"too-big.png",mimeType:"image/png",
    buffer:Buffer.alloc(10*1024*1024+1,0),
  });
  await page.getByRole("button",{name:"Tải lên vùng cách ly"}).click();
  await expect(page.getByRole("alert")).toContainText("tối đa 10 MiB");
  expect(posts).toBe(0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
