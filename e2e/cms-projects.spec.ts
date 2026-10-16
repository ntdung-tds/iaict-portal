import {expect,test,type Page} from '@playwright/test';
const project={id:'p1',title:'Dự án IoT',slug:'du-an-iot',summary:'Mô hình quan trắc',status:'published',context:'Bối cảnh',solution:'Giải pháp',scope_json:'["Thu nhận dữ liệu"]',technologies_json:'["IoT"]',results_json:'["Đã thử nghiệm"]',replication_potential:'Theo nhu cầu',seo_json:'{}',featured:0};
async function mock(page:Page,roles=['admin']){
 await page.route('**/api/admin/cms/session',route=>route.fulfill({json:{actor:{roles}}}));
 await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles},items:[project],total:1,references:{}}}));
 await page.goto('/admin/content/projects');await expect(page.getByLabel('Tên dự án',{exact:true})).toHaveValue(project.title);
}
for(const width of [320,390,1280]){
 test(`Project guidance fits ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await mock(page);
  for(const field of await page.locator('[id^="cms-projects-"]:is(input,select,textarea)').all()){
   const help=await field.getAttribute('aria-describedby');expect(help).toBeTruthy();await expect(page.locator(`#${help}`)).toHaveText(/.+/);
  }
  await expect(page.getByRole('link',{name:'Mở dự án đã xuất bản'})).toHaveAttribute('href','/du-an/du-an-iot');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 test(`Published projects catalog fits ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.route('**/api/public/projects',route=>route.fulfill({json:{items:[project]}}));await page.goto('/du-an');
  const catalog=page.locator('#published-projects');await expect(catalog.getByRole('heading',{name:project.title,exact:true})).toBeVisible();
  await expect(catalog.getByRole('link',{name:`Xem chi tiết: ${project.title}`})).toHaveAttribute('href','/du-an/du-an-iot');
  await expect(page.locator('a[href="/du-an/tram-rung"]')).toBeVisible();
  expect(await catalog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 });
}
test('Rejects wrong JSON shapes and protects unsaved work',async({page})=>{
 await mock(page);await page.getByLabel('Tên dự án',{exact:true}).fill('Đang sửa dự án');
 await page.getByLabel('Kết quả (JSON)',{exact:true}).fill('{"value":123}');await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeDisabled();
 page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await expect(page.getByLabel('Tên dự án',{exact:true})).toHaveValue('Đang sửa dự án');
});
test('Blocks reserved project slug',async({page})=>{
 await mock(page);await page.getByLabel('Đường dẫn (slug)',{exact:true}).fill('tram-rung');await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeDisabled();
 await expect(page.getByText('Đường dẫn tram-rung đã dành cho trang Trâm Rừng. Hãy chọn đường dẫn khác.',{exact:true})).toBeVisible();
});
test('Creates project and opens its saved URL',async({page})=>{
 await mock(page);await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await page.getByLabel('Tên dự án',{exact:true}).fill('Dự án mới');await page.getByLabel('Mô tả ngắn',{exact:true}).fill('Mô tả dự án');await page.locator('#cms-projects-status').selectOption('published');
 await page.route('**/api/admin/cms/collection',async route=>{const body=route.request().postDataJSON();await route.fulfill({json:{ok:true,id:'p2',record:{...body.data,id:'p2',slug:'du-an-moi'}}});});
 await page.getByRole('button',{name:'Tạo dự án',exact:true}).click();await expect(page.getByRole('link',{name:'Mở dự án đã xuất bản'})).toHaveAttribute('href','/du-an/du-an-moi');
});
test('Viewer cannot edit projects',async({page})=>{
 await mock(page,['viewer']);await expect(page.getByLabel('Tên dự án',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);
});
test('Public catalog can retry a failed request',async({page})=>{
 let calls=0;await page.route('**/api/public/projects',route=>route.fulfill(++calls===1?{status:503,json:{error:'Unavailable'}}:{json:{items:[project]}}));await page.goto('/du-an');await page.locator('#published-projects').getByRole('button',{name:'Thử lại'}).click();await expect(page.locator('#published-projects').getByRole('heading',{name:project.title,exact:true})).toBeVisible();
});
