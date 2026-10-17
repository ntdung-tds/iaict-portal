import {expect,test,type Page} from '@playwright/test';
const partner={id:'p1',name:'Đối tác A',status:'published',summary:'Mô tả đơn vị',public_note:'Hợp tác đào tạo',website:'https://example.com',logo_media_id:'logo'};
async function mock(page:Page,roles=['admin']){
 await page.route('**/api/admin/cms/session',r=>r.fulfill({json:{actor:{roles}}}));
 await page.route('**/api/admin/cms/collection?*',r=>r.fulfill({json:{actor:{roles},items:[partner],total:1,references:{media:[{value:'logo',label:'Logo công khai'}]}}}));
 await page.goto('/admin/content/partners');await expect(page.getByLabel('Tên đơn vị',{exact:true})).toHaveValue(partner.name);
}
for(const width of [320,390,1280])test(`Partner guidance fits ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await mock(page);
 for(const field of await page.locator('[id^="cms-partners-"]:is(input,select,textarea)').all()){
 const help=await field.getAttribute('aria-describedby');expect(help).toBeTruthy();await expect(page.locator(`#${help}`)).toHaveText(/.+/);
 }
 await expect(page.getByRole('link',{name:'Mở danh sách đối tác'})).toHaveAttribute('href','/doi-tac');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Requires HTTPS for a supplied website',async({page})=>{
 await mock(page);await page.getByLabel('Website',{exact:true}).fill('http://example.com');await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeDisabled();
 await page.getByLabel('Website',{exact:true}).fill('');await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeEnabled();
});
test('Clears a logo and retains the saved record',async({page})=>{
 await mock(page);await page.getByLabel('Logo',{exact:true}).selectOption('');
 await page.route('**/api/admin/cms/collection',async route=>{expect(route.request().postDataJSON().data.logo_media_id).toBe('');await route.fulfill({json:{ok:true,id:'p1',record:{...partner,logo_media_id:null}}});});
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã lưu đối tác.');await expect(page.getByLabel('Logo',{exact:true})).toHaveValue('');
});
test('Creates a partner and links to the directory',async({page})=>{
 await mock(page);await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await page.getByLabel('Tên đơn vị',{exact:true}).fill('Đối tác mới');await page.locator('#cms-partners-status').selectOption('published');
 await page.route('**/api/admin/cms/collection',async route=>{const body=route.request().postDataJSON();await route.fulfill({json:{ok:true,id:'p2',record:{...body.data,id:'p2'}}});});
 await page.getByRole('button',{name:'Tạo đối tác',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã tạo đối tác.');await expect(page.getByRole('link',{name:'Mở danh sách đối tác'})).toBeVisible();
});
test('Protects unsaved changes and retains notes after failed save',async({page})=>{
 await mock(page);const note=page.getByLabel('Ghi chú công khai',{exact:true});await note.fill('Ghi chú mới');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await expect(note).toHaveValue('Ghi chú mới');
 await page.route('**/api/admin/cms/collection',r=>r.fulfill({status:500,json:{error:'Chưa lưu được'}}));await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('Chưa lưu được');await expect(note).toHaveValue('Ghi chú mới');
});
test('Viewer cannot edit partners',async({page})=>{
 await mock(page,['viewer']);await expect(page.getByLabel('Tên đơn vị',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);
});
