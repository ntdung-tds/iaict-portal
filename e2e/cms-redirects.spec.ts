import {expect,test,type Page} from '@playwright/test';
const record={id:'r1',source_path:'/trang-cu',destination_path:'/trang-moi',status_code:302,is_active:1};
async function mock(page:Page,roles=['admin']){
 await page.route('**/api/admin/cms/session',r=>r.fulfill({json:{actor:{roles}}}));
 await page.route('**/api/admin/cms/collection?*',r=>r.fulfill({json:{actor:{roles},items:[record],total:1,references:{}}}));
 await page.goto('/admin/content/redirects');await expect(page.getByLabel('URL nguồn',{exact:true})).toHaveValue(record.source_path);
}
for(const width of [320,390,1280])test(`Redirect guidance fits ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await mock(page);
 for(const field of await page.locator('[id^="cms-redirects-"]:is(input,select,textarea)').all()){const help=await field.getAttribute('aria-describedby');expect(help).toBeTruthy();await expect(page.locator(`#${help}`)).toHaveText(/.+/);}
 await expect(page.getByText('Chuyển hướng hoạt động trên website Cloudflare',{exact:false})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Rejects invalid sources, destinations and normalized loops',async({page})=>{
 await mock(page);const save=page.getByRole('button',{name:'Lưu thay đổi',exact:true});
 for(const value of ['/api/test','/admin','/trang-cu?x=1','/a/../b','//example.com']){await page.getByLabel('URL nguồn',{exact:true}).fill(value);await expect(save).toBeDisabled();}
 await page.getByLabel('URL nguồn',{exact:true}).fill('/trang-cu');
 for(const value of ['javascript:alert(1)','//example.com','http://example.com','/x/../trang-cu']){await page.getByLabel('URL đích',{exact:true}).fill(value);await expect(save).toBeDisabled();}
});
test('Creates a temporary redirect by default',async({page})=>{
 await mock(page);await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await expect(page.getByLabel('Mã HTTP',{exact:true})).toHaveValue('302');
 await page.getByLabel('URL nguồn',{exact:true}).fill('/cu.html');await page.getByLabel('URL đích',{exact:true}).fill('https://example.com/new');await page.getByLabel('Kích hoạt',{exact:true}).check();
 await page.route('**/api/admin/cms/collection',async r=>{const data=r.request().postDataJSON().data;expect(data.status_code).toBe('302');expect(data.is_active).toBe(true);await r.fulfill({json:{ok:true,id:'r2',record:{...data,id:'r2'}}});});
 await page.getByRole('button',{name:'Tạo chuyển hướng',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã tạo chuyển hướng.');
});
test('Preserves edits after canceled navigation and save failure',async({page})=>{
 await mock(page);const input=page.getByLabel('URL đích',{exact:true});await input.fill('/dang-sua');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await expect(input).toHaveValue('/dang-sua');
 await page.route('**/api/admin/cms/collection',r=>r.fulfill({status:400,json:{error:'Quy tắc tạo vòng lặp chuyển hướng. Hãy chọn URL đích khác.'}}));await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByRole('alert')).toContainText('vòng lặp');await expect(input).toHaveValue('/dang-sua');
});
test('Viewer cannot edit redirect rules',async({page})=>{await mock(page,['viewer']);await expect(page.getByLabel('URL nguồn',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);});
