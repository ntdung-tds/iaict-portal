import { expect, test } from '@playwright/test';
import { getCmsModule } from '../lib/cms-schema';
const solution={id:'solution1',title:'Giải pháp IoT IAICT',slug:'giam-sat-rung-iot',category:'IoT',summary:'Giám sát dữ liệu hiện trường.',status:'published',scope_json:'["Thu thập dữ liệu"]',technologies_json:'["IoT"]',deliverables_json:'["Giảm thao tác tổng hợp"]',problem:'Kết nối API với hệ thống hiện có.',process_json:'["Khảo sát","Bàn giao"]',seo_json:'{}',featured:0,updated_at:'2026-10-15T12:00:00Z'};
async function mockAdmin(page:import('@playwright/test').Page,roles=['admin']){
  await page.route('**/api/admin/cms/session',route=>route.fulfill({json:{actor:{roles}}}));
  await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles},module:getCmsModule('solutions'),items:[solution],total:1,references:{}}}));
}
for(const width of [320,390,1280]){
  test(`Solution editing guidance fits ${width}px`,async({page})=>{
    await mockAdmin(page);await page.setViewportSize({width,height:900});
    await page.goto('/admin/content/solutions');
    await expect(page.getByRole('textbox',{name:'Tên giải pháp',exact:true})).toHaveValue(solution.title);
    for(const field of await page.locator('input[id^="cms-solutions-"],select[id^="cms-solutions-"],textarea[id^="cms-solutions-"]').all()){
      await expect(field).toHaveAttribute('aria-describedby',/.+/);
      const help=await field.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${help}"]`)).toHaveText(/.+/);
    }
    await expect(page.getByRole('link',{name:'Mở giải pháp đã xuất bản'})).toHaveAttribute('href','/giai-phap-dich-vu/giam-sat-rung-iot');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test(`Published solution catalog fits ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.route('**/api/public/solutions',route=>route.fulfill({json:{items:[solution]}}));
    await page.goto('/giai-phap-dich-vu');
    const catalog=page.locator('#published-solutions');
    await expect(catalog.getByRole('heading',{name:solution.title})).toBeVisible();
    await expect(catalog.getByRole('link',{name:`Xem chi tiết: ${solution.title}`})).toHaveAttribute('href','/giai-phap-dich-vu/giam-sat-rung-iot');
    expect(await catalog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  });
}
test('Blocks invalid feature lists and preserves unsaved solution content',async({page})=>{
  await mockAdmin(page);await page.goto('/admin/content/solutions');
  const title=page.getByRole('textbox',{name:'Tên giải pháp',exact:true});
  await expect(title).toHaveValue(solution.title);await title.fill('Đang biên tập giải pháp');
  await page.getByRole('textbox',{name:'Phạm vi (JSON)',exact:true}).fill('{"feature":"Không phải danh sách"}');
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeDisabled();
  await expect(page.getByText('Phạm vi, Quy trình, Sản phẩm bàn giao và Công nghệ phải là danh sách chuỗi văn bản trong dấu [ ].',{exact:true})).toBeVisible();
  const response=page.waitForResponse(r=>r.url().includes('/collection?')&&r.url().includes('q='));
  await page.getByRole('textbox',{name:'Tìm kiếm',exact:true}).fill('IoT');await response;
  await expect(title).toHaveValue('Đang biên tập giải pháp');
});
test('Creates a published solution and opens its saved slug',async({page})=>{
  await mockAdmin(page);
  let saved:Record<string,unknown>|undefined;
  await page.route('**/api/admin/cms/collection',async route=>{
    const payload=route.request().postDataJSON();saved=payload.data;
    await route.fulfill({json:{ok:true,id:'p2',record:{...payload.data,id:'p2',slug:'giai-phap-moi'}}});
  });
  await page.goto('/admin/content/solutions');
  await expect(page.getByRole('textbox',{name:'Tên giải pháp',exact:true})).toHaveValue(solution.title);
  await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();
  await page.getByRole('textbox',{name:'Tên giải pháp',exact:true}).fill('Giải pháp mới');
  await page.getByRole('textbox',{name:'Mô tả ngắn',exact:true}).fill('Giới thiệu giải pháp mới.');
  await page.locator('#cms-solutions-status').selectOption('published');
  await page.getByRole('button',{name:'Tạo giải pháp',exact:true}).click();
  await expect(page.getByRole('link',{name:'Mở giải pháp đã xuất bản'})).toHaveAttribute('href','/giai-phap-dich-vu/giai-phap-moi');
  expect(saved?.status).toBe('published');expect(saved?.scope_json).toBe('[]');
});
test('Catalog recovers after a temporary error',async({page})=>{
  let calls=0;
  await page.route('**/api/public/solutions',route=>route.fulfill(++calls===1?{status:503,json:{error:'Unavailable'}}:{json:{items:[solution]}}));
  await page.goto('/giai-phap-dich-vu');
  await page.locator('#published-solutions').getByRole('button',{name:'Thử lại'}).click();
  await expect(page.locator('#published-solutions').getByRole('heading',{name:solution.title})).toBeVisible();
});
test('Viewer can read but cannot edit solutions',async({page})=>{
  await mockAdmin(page,['viewer']);await page.goto('/admin/content/solutions');
  await expect(page.getByRole('textbox',{name:'Tên giải pháp',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'+ Tạo mới',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);
});
