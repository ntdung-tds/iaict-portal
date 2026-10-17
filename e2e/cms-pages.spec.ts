import { expect, test } from '@playwright/test';
import { getCmsModule } from '../lib/cms-schema';
const stored={id:'p1',title:'Hợp tác nghiên cứu',slug:'hop-tac-nghien-cuu',status:'published',page_type:'standard',summary:'Giới thiệu hợp tác',body:'Nội dung trang đã xuất bản.',layout_json:'{}',seo_json:'{}',hero_media_id:'',featured:0,updated_at:'2026-10-15T12:00:00Z'};

test.beforeEach(async({page})=>{
  await page.route('**/api/admin/cms/session',route=>route.fulfill({json:{actor:{roles:['admin']}}}));
  await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles:['admin']},module:getCmsModule('pages'),items:new URL(route.request().url()).searchParams.has('q')?[]:[stored],total:1,references:{media:[]}}}));
});
for(const width of [320,390,1280]){
  test(`Pages guidance and layout fit ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/admin/content/pages');
    await expect(page.getByRole('textbox',{name:'Tiêu đề',exact:true})).toHaveValue(stored.title);
    for(const field of await page.locator('input[id^="cms-pages-"],select[id^="cms-pages-"],textarea[id^="cms-pages-"]').all()){
      await expect(field).toHaveAttribute('aria-describedby',/.+/);
      const help=await field.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${help}"]`)).toHaveText(/.+/);
    }
    await expect(page.getByRole('link',{name:'Mở trang đã xuất bản'})).toHaveAttribute('href','/noi-dung/hop-tac-nghien-cuu');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
test('Filtering keeps the page being edited even if it leaves the list',async({page})=>{
  await page.goto('/admin/content/pages');
  const title=page.getByRole('textbox',{name:'Tiêu đề',exact:true});
  await expect(title).toHaveValue(stored.title);
  await title.fill('Đang sửa chưa lưu');
  const response=page.waitForResponse(r=>r.url().includes('/collection?')&&r.url().includes('q='));
  await page.getByRole('textbox',{name:'Tìm kiếm',exact:true}).fill('không có kết quả');
  await response;
  await expect(title).toHaveValue('Đang sửa chưa lưu');
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeEnabled();
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();
  await expect(title).toHaveValue('Đang sửa chưa lưu');
});
test('Creates and publishes a page with a stable public link',async({page})=>{
  let payload:any;
  await page.route('**/api/admin/cms/collection',async route=>{
    payload=route.request().postDataJSON();
    await route.fulfill({json:{ok:true,id:'p2',record:{...payload.data,id:'p2',slug:'trang-moi'}}});
  });
  await page.goto('/admin/content/pages');
  await expect(page.getByRole('textbox',{name:'Tiêu đề',exact:true})).toHaveValue(stored.title);
  await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();
  await page.getByRole('textbox',{name:'Tiêu đề',exact:true}).fill('Trang mới');
  await page.getByRole('textbox',{name:'Nội dung',exact:true}).fill('Nội dung giới thiệu mới.');
  await page.locator('#cms-pages-status').selectOption('published');
  await page.getByRole('button',{name:'Tạo trang',exact:true}).click();
  await expect(page.getByRole('link',{name:'Mở trang đã xuất bản'})).toHaveAttribute('href','/noi-dung/trang-moi');
  expect(payload.module).toBe('pages');expect(payload.id).toBeNull();expect(payload.data.status).toBe('published');
});
