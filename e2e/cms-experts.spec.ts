import {expect,test,type Page} from '@playwright/test';
const expert={id:'e1',name:'Nguyễn Văn A',slug:'nguyen-van-a',title:'Chuyên gia AI',status:'published',bio:'Giới thiệu chuyên gia',expertise_json:'["AI"]',public_contacts_json:'{"email":"expert@example.com"}',photo_media_id:'photo',seo_json:'{}'};
async function mock(page:Page,roles=['admin']){
 await page.route('**/api/admin/cms/session',r=>r.fulfill({json:{actor:{roles}}}));
 await page.route('**/api/admin/cms/collection?*',r=>r.fulfill({json:{actor:{roles},items:[expert],total:1,references:{media:[{value:'photo',label:'Ảnh chuyên gia'}]}}}));
 await page.goto('/admin/content/experts');await expect(page.getByLabel('Họ tên',{exact:true})).toHaveValue(expert.name);
}
for(const width of [320,390,1280])test(`Expert guidance fits ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await mock(page);
 for(const field of await page.locator('[id^="cms-experts-"]:is(input,select,textarea)').all()){
  const help=await field.getAttribute('aria-describedby');expect(help).toBeTruthy();await expect(page.locator(`#${help}`)).toHaveText(/.+/);
 }
 await expect(page.getByRole('link',{name:'Mở hồ sơ đã xuất bản'})).toHaveAttribute('href','/chuyen-gia/nguyen-van-a');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Rejects malformed contacts and expertise',async({page})=>{
 await mock(page);const save=page.getByRole('button',{name:'Lưu thay đổi',exact:true});
 await page.getByLabel('Liên hệ công khai (JSON)',{exact:true}).fill('{"website":"http://example.com"}');await expect(save).toBeDisabled();
 await page.getByLabel('Liên hệ công khai (JSON)',{exact:true}).fill('{}');await page.getByLabel('Chuyên môn (JSON)',{exact:true}).fill('[123]');await expect(save).toBeDisabled();
});
test('Clears photo and retains saved profile',async({page})=>{
 await mock(page);await page.getByLabel('Ảnh đại diện',{exact:true}).selectOption('');
 await page.route('**/api/admin/cms/collection',async route=>{const body=route.request().postDataJSON();expect(body.data.photo_media_id).toBe('');await route.fulfill({json:{ok:true,id:'e1',record:{...expert,photo_media_id:null}}});});
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã lưu chuyên gia.');await expect(page.getByLabel('Ảnh đại diện',{exact:true})).toHaveValue('');
});
test('Creates an expert with a generated slug',async({page})=>{
 await mock(page);await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await page.getByLabel('Họ tên',{exact:true}).fill('Chuyên gia mới');await page.locator('#cms-experts-status').selectOption('published');
 await page.route('**/api/admin/cms/collection',async route=>{const body=route.request().postDataJSON();await route.fulfill({json:{ok:true,id:'e2',record:{...body.data,id:'e2',slug:'chuyen-gia-moi'}}});});
 await page.getByRole('button',{name:'Tạo chuyên gia',exact:true}).click();await expect(page.getByRole('link',{name:'Mở hồ sơ đã xuất bản'})).toHaveAttribute('href','/chuyen-gia/chuyen-gia-moi');
});
test('Protects unsaved bio and preserves it after a failed save',async({page})=>{
 await mock(page);const bio=page.getByLabel('Giới thiệu',{exact:true});await bio.fill('Đang biên tập');
 page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await expect(bio).toHaveValue('Đang biên tập');
 await page.route('**/api/admin/cms/collection',r=>r.fulfill({status:500,json:{error:'Chưa lưu được'}}));await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('Chưa lưu được');await expect(bio).toHaveValue('Đang biên tập');
});
test('Viewer cannot edit expert profiles',async({page})=>{
 await mock(page,['viewer']);await expect(page.getByLabel('Họ tên',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);
});
