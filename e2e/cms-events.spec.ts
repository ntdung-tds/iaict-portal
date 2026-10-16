import {expect,test,type Page} from '@playwright/test';
const event={id:'e1',title:'Hội thảo AI',slug:'hoi-thao-ai',status:'published',summary:'Tóm tắt',start_at:'2026-10-20T02:00:00Z',end_at:'2026-10-20T04:00:00Z',location:'Hà Nội',registration_url:'https://example.com/register',body:'Chương trình',seo_json:'{}'};
async function mock(page:Page,roles=['admin']){
 await page.route('**/api/admin/cms/session',r=>r.fulfill({json:{actor:{roles}}}));await page.route('**/api/admin/cms/collection?*',r=>r.fulfill({json:{actor:{roles},items:[event],total:1,references:{}}}));await page.goto('/admin/content/events');await expect(page.getByLabel('Tên sự kiện',{exact:true})).toHaveValue(event.title);
}
for(const width of [320,390,1280])test(`Event guidance fits ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await mock(page);
 for(const field of await page.locator('[id^="cms-events-"]:is(input,select,textarea)').all()){const help=await field.getAttribute('aria-describedby');expect(help).toBeTruthy();await expect(page.locator(`#${help}`)).toHaveText(/.+/);}
 await expect(page.getByLabel('Bắt đầu',{exact:true})).toHaveValue('2026-10-20T09:00');await expect(page.getByRole('link',{name:'Mở sự kiện đã xuất bản'})).toHaveAttribute('href','/su-kien/hoi-thao-ai');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Rejects reversed dates, HTTP registration URL and invalid SEO',async({page})=>{
 await mock(page);const save=page.getByRole('button',{name:'Lưu thay đổi',exact:true});await page.getByLabel('Kết thúc',{exact:true}).fill('2026-10-20T08:00');await expect(save).toBeDisabled();await page.getByLabel('Kết thúc',{exact:true}).fill('2026-10-20T11:00');
 await page.getByLabel('Liên kết đăng ký',{exact:true}).fill('http://example.com');await expect(save).toBeDisabled();await page.getByLabel('Liên kết đăng ký',{exact:true}).fill('');await page.getByLabel('SEO (JSON)',{exact:true}).fill('[]');await expect(save).toBeDisabled();
});
test('Saves explicit UTC time and reopens in Vietnam time',async({page})=>{
 await mock(page);await page.getByLabel('Bắt đầu',{exact:true}).fill('2026-10-20T10:00');
 await page.route('**/api/admin/cms/collection',async route=>{const data=route.request().postDataJSON().data;expect(data.start_at).toBe('2026-10-20T03:00:00.000Z');expect(data.end_at).toBe('2026-10-20T04:00:00.000Z');await route.fulfill({json:{ok:true,id:'e1',record:{...event,...data}}});});
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã lưu sự kiện.');await expect(page.getByLabel('Bắt đầu',{exact:true})).toHaveValue('2026-10-20T10:00');
});
test('Creates a published event with an automatic slug',async({page})=>{
 await mock(page);await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await page.getByLabel('Tên sự kiện',{exact:true}).fill('Sự kiện mới');await page.locator('#cms-events-status').selectOption('published');await page.route('**/api/admin/cms/collection',async route=>{const data=route.request().postDataJSON().data;await route.fulfill({json:{ok:true,id:'e2',record:{...data,id:'e2',slug:'su-kien-moi'}}});});await page.getByRole('button',{name:'Tạo sự kiện',exact:true}).click();await expect(page.getByRole('link',{name:'Mở sự kiện đã xuất bản'})).toHaveAttribute('href','/su-kien/su-kien-moi');
});
test('Preserves unsaved content after cancellation and save failure',async({page})=>{
 await mock(page);const body=page.getByLabel('Nội dung',{exact:true});await body.fill('Đang biên tập');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await expect(body).toHaveValue('Đang biên tập');await page.route('**/api/admin/cms/collection',r=>r.fulfill({status:500,json:{error:'Chưa lưu được'}}));await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('Chưa lưu được');await expect(body).toHaveValue('Đang biên tập');
});
test('Viewer cannot edit events',async({page})=>{await mock(page,['viewer']);await expect(page.getByLabel('Tên sự kiện',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);});
