import { expect, test } from "@playwright/test";

// UI-only synthetic API + actor tests. Never represent them as authenticated
// hosted CMS or real Media mutations.
for (const width of [390, 1440] as const) {
  test("private Media list and confirmed admin revoke at "+width+"px [MOCK]",async ({page})=>{
    await page.setViewportSize({width,height:844});
    await page.route("**/api/admin/cms/session",route=>route.fulfill({
      json:{ok:true,actor:{id:"qa-admin",roles:["admin"]}},
    }));
    let revoked=false,posts=0;
    await page.route(/\/api\/admin\/cms\/media\/library(?:\?.*)?$/,async route=>{
      const request=route.request();
      if(request.method()==="POST"){
        posts++;const body=request.postDataJSON();
        expect(body).toEqual({action:"revoke",id:"00000000-0000-4000-8000-000000000123",revision:1});
        expect(request.headers().origin).toBe(new URL(request.url()).origin);
        revoked=true;
        await route.fulfill({json:{ok:true,status:200,id:body.id,state:"REVOKED",publicUrl:null}});
        return;
      }
      await route.fulfill({json:{ok:true,page:1,pageSize:20,hasNext:false,publicAccess:false,items:[{
        id:"00000000-0000-4000-8000-000000000123",
        filename:"qa-synthetic-private-file.png",mimeType:"image/png",bytes:463656,
        state:revoked?"REVOKED":"QUARANTINED",revision:revoked?2:1,
        createdAt:"2026-11-06 07:00:00",updatedAt:"2026-11-06 07:00:00",
        scanPrivate:false,canRevoke:!revoked,publicUrl:null,
      }]}});
    });
    await page.goto("/admin/media/library",{waitUntil:"domcontentloaded"});
    const article=page.getByRole("article");
    await expect(page.getByRole("heading",{name:"Thư viện Media cách ly"})).toBeVisible();
    await expect(article.getByText("qa-synthetic-private-file.png")).toBeVisible();
    await expect(article.getByText("Đang cách ly · Chưa được xuất bản")).toBeVisible();
    await expect(article.getByText("Chưa có kết quả quét")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>{if(document.querySelector("img"))throw Error("Private library must not render unscanned image tags");});
    page.once("dialog",dialog=>void dialog.accept());
    await article.getByRole("button",{name:"Thu hồi"}).click();
    await expect(article.getByText("Đã thu hồi · Chờ dọn dữ liệu theo hạn lưu")).toBeVisible();
    await expect(article.getByRole("button",{name:"Thu hồi"})).toHaveCount(0);
    expect(posts).toBe(1);
    await expect(page.getByText("Tệp gốc đang cách ly")).toBeVisible();
  });
}

test("private Media menu is hidden for Viewer and Newsroom-only roles [MOCK]",async ({page})=>{
  for(const role of ["viewer","news_admin"]){
    await page.route("**/api/admin/cms/session",route=>route.fulfill({
      json:{ok:true,actor:{id:"qa-"+role,roles:[role]}},
    }));
    await page.goto("/admin",{waitUntil:"domcontentloaded"});
    const nav=page.locator('aside[aria-label="Điều hướng CMS"] nav');
    await expect(nav.locator('a[href="/admin/media/library"]')).toHaveCount(0);
    await page.unroute("**/api/admin/cms/session");
  }
});
