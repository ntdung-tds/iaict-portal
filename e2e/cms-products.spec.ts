import { expect, test } from '@playwright/test';
import { getCmsModule } from '../lib/cms-schema';
const product={id:'product1',title:'Nền tảng IoT IAICT',slug:'nen-tang-iot',category:'IoT',summary:'Giám sát dữ liệu hiện trường.',status:'published',features_json:'["Thu thập dữ liệu"]',technologies_json:'["IoT"]',benefits_json:'["Giảm thao tác tổng hợp"]',integration_notes:'Kết nối API với hệ thống hiện có.',seo_json:'{}',featured:0,updated_at:'2026-10-15T12:00:00Z'};
async function mockAdmin(page:import('@playwright/test').Page,roles=['admin']){
  await page.route('**/api/admin/cms/session',route=>route.fulfill({json:{actor:{roles}}}));
  await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles},module:getCmsModule('products'),items:[product],total:1,references:{}}}));
}
for(const width of [320,390,1280]){
  test(`Product editing guidance fits ${width}px`,async({page})=>{
    await mockAdmin(page);await page.setViewportSize({width,height:900});
    await page.goto('/admin/content/products');
    await expect(page.getByRole('textbox',{name:'Tên sản phẩm',exact:true})).toHaveValue(product.title);
    for(const field of await page.locator('input[id^="cms-products-"],select[id^="cms-products-"],textarea[id^="cms-products-"]').all()){
      await expect(field).toHaveAttribute('aria-describedby',/.+/);
      const help=await field.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${help}"]`)).toHaveText(/.+/);
    }
    await expect(page.getByRole('link',{name:'Mở sản phẩm đã xuất bản'})).toHaveAttribute('href','/san-pham-nen-tang/nen-tang-iot');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test(`Published product catalog fits ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.route('**/api/public/products',route=>route.fulfill({json:{items:[product]}}));
    await page.goto('/san-pham-nen-tang');
    const catalog=page.locator('#published-products');
    await expect(catalog.getByRole('heading',{name:product.title})).toBeVisible();
    await expect(catalog.getByRole('link',{name:`Xem chi tiết: ${product.title}`})).toHaveAttribute('href','/san-pham-nen-tang/nen-tang-iot');
    expect(await catalog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  });
}
test('Blocks invalid feature lists and preserves unsaved product content',async({page})=>{
  await mockAdmin(page);await page.goto('/admin/content/products');
  const title=page.getByRole('textbox',{name:'Tên sản phẩm',exact:true});
  await expect(title).toHaveValue(product.title);await title.fill('Đang biên tập sản phẩm');
  await page.getByRole('textbox',{name:'Tính năng (JSON)',exact:true}).fill('{"feature":"Không phải danh sách"}');
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeDisabled();
  await expect(page.getByText('Tính năng, Công nghệ và Lợi ích phải là danh sách chuỗi văn bản trong dấu [ ].',{exact:true})).toBeVisible();
  const response=page.waitForResponse(r=>r.url().includes('/collection?')&&r.url().includes('q='));
  await page.getByRole('textbox',{name:'Tìm kiếm',exact:true}).fill('IoT');await response;
  await expect(title).toHaveValue('Đang biên tập sản phẩm');
});
test('Creates a published product and opens its saved slug',async({page})=>{
  await mockAdmin(page);
  let saved:Record<string,unknown>|undefined;
  await page.route('**/api/admin/cms/collection',async route=>{
    const payload=route.request().postDataJSON();saved=payload.data;
    await route.fulfill({json:{ok:true,id:'p2',record:{...payload.data,id:'p2',slug:'san-pham-moi'}}});
  });
  await page.goto('/admin/content/products');
  await expect(page.getByRole('textbox',{name:'Tên sản phẩm',exact:true})).toHaveValue(product.title);
  await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();
  await page.getByRole('textbox',{name:'Tên sản phẩm',exact:true}).fill('Sản phẩm mới');
  await page.getByRole('textbox',{name:'Mô tả ngắn',exact:true}).fill('Giới thiệu sản phẩm mới.');
  await page.locator('#cms-products-status').selectOption('published');
  await page.getByRole('button',{name:'Tạo sản phẩm',exact:true}).click();
  await expect(page.getByRole('link',{name:'Mở sản phẩm đã xuất bản'})).toHaveAttribute('href','/san-pham-nen-tang/san-pham-moi');
  expect(saved?.status).toBe('published');expect(saved?.features_json).toBe('[]');
});
test('Catalog recovers after a temporary error',async({page})=>{
  let calls=0;
  await page.route('**/api/public/products',route=>route.fulfill(++calls===1?{status:503,json:{error:'Unavailable'}}:{json:{items:[product]}}));
  await page.goto('/san-pham-nen-tang');
  await page.locator('#published-products').getByRole('button',{name:'Thử lại'}).click();
  await expect(page.locator('#published-products').getByRole('heading',{name:product.title})).toBeVisible();
});
test('Viewer can read but cannot edit products',async({page})=>{
  await mockAdmin(page,['viewer']);await page.goto('/admin/content/products');
  await expect(page.getByRole('textbox',{name:'Tên sản phẩm',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'+ Tạo mới',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);
});
