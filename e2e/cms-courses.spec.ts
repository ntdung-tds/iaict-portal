import { expect, test } from '@playwright/test';
import { getCmsModule } from '../lib/cms-schema';
const course={id:'course1',title:'Khóa học AI IAICT',slug:'ung-dung-ai',summary:'Thực hành AI theo vị trí việc làm.',status:'published',audiences_json:'["Cán bộ cấp xã"]',topics_json:'["Soạn yêu cầu cho AI"]',materials_json:'["Giáo trình học viên"]',certificate_note:'Thông tin chứng nhận theo kế hoạch lớp.',modules_json:'["Buổi 1: Tổng quan","Buổi 2: Thực hành"]',code:'',duration:'02 ngày',level:'Cơ bản',class_size:'25 học viên',objectives_json:'[]',delivery_modes_json:'[]',seo_json:'{}',featured:0,updated_at:'2026-10-15T12:00:00Z'};
async function mockAdmin(page:import('@playwright/test').Page,roles=['admin']){
  await page.route('**/api/admin/cms/session',route=>route.fulfill({json:{actor:{roles}}}));
  await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles},module:getCmsModule('courses'),items:[course],total:1,references:{}}}));
}
for(const width of [320,390,1280]){
  test(`Course editing guidance fits ${width}px`,async({page})=>{
    await mockAdmin(page);await page.setViewportSize({width,height:900});
    await page.goto('/admin/content/courses');
    await expect(page.getByRole('textbox',{name:'Tên khóa học',exact:true})).toHaveValue(course.title);
    for(const field of await page.locator('input[id^="cms-courses-"],select[id^="cms-courses-"],textarea[id^="cms-courses-"]').all()){
      await expect(field).toHaveAttribute('aria-describedby',/.+/);
      const help=await field.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${help}"]`)).toHaveText(/.+/);
    }
    await expect(page.getByRole('link',{name:'Mở khóa học đã xuất bản'})).toHaveAttribute('href','/dao-tao-tap-huan/ung-dung-ai');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test(`Published course catalog fits ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.route('**/api/public/courses',route=>route.fulfill({json:{items:[course]}}));
    await page.goto('/dao-tao-tap-huan');
    const catalog=page.locator('#published-courses');
    await expect(catalog.getByRole('heading',{name:course.title})).toBeVisible();
    await expect(catalog.getByRole('link',{name:`Xem chi tiết: ${course.title}`})).toHaveAttribute('href','/dao-tao-tap-huan/ung-dung-ai');
    expect(await catalog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  });
}
test('Blocks invalid feature lists and preserves unsaved course content',async({page})=>{
  await mockAdmin(page);await page.goto('/admin/content/courses');
  const title=page.getByRole('textbox',{name:'Tên khóa học',exact:true});
  await expect(title).toHaveValue(course.title);await title.fill('Đang biên tập khóa học');
  await page.getByRole('textbox',{name:'Đối tượng (JSON)',exact:true}).fill('{"feature":"Không phải danh sách"}');
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeDisabled();
  await expect(page.getByText('Các danh sách trong khóa học phải là danh sách chuỗi văn bản trong dấu [ ].',{exact:true})).toBeVisible();
  const response=page.waitForResponse(r=>r.url().includes('/collection?')&&r.url().includes('q='));
  await page.getByRole('textbox',{name:'Tìm kiếm',exact:true}).fill('IoT');await response;
  await expect(title).toHaveValue('Đang biên tập khóa học');
});
test('Creates a published course and opens its saved slug',async({page})=>{
  await mockAdmin(page);
  let saved:Record<string,unknown>|undefined;
  await page.route('**/api/admin/cms/collection',async route=>{
    const payload=route.request().postDataJSON();saved=payload.data;
    await route.fulfill({json:{ok:true,id:'p2',record:{...payload.data,id:'p2',slug:'khoa-hoc-moi'}}});
  });
  await page.goto('/admin/content/courses');
  await expect(page.getByRole('textbox',{name:'Tên khóa học',exact:true})).toHaveValue(course.title);
  await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();
  await page.getByRole('textbox',{name:'Tên khóa học',exact:true}).fill('Khóa học mới');
  await page.getByRole('textbox',{name:'Mô tả ngắn',exact:true}).fill('Giới thiệu khóa học mới.');
  await page.locator('#cms-courses-status').selectOption('published');
  await page.getByRole('button',{name:'Tạo khóa học',exact:true}).click();
  await expect(page.getByRole('link',{name:'Mở khóa học đã xuất bản'})).toHaveAttribute('href','/dao-tao-tap-huan/khoa-hoc-moi');
  expect(saved?.status).toBe('published');expect(saved?.audiences_json).toBe('[]');
});
test('Catalog recovers after a temporary error',async({page})=>{
  let calls=0;
  await page.route('**/api/public/courses',route=>route.fulfill(++calls===1?{status:503,json:{error:'Unavailable'}}:{json:{items:[course]}}));
  await page.goto('/dao-tao-tap-huan');
  await page.locator('#published-courses').getByRole('button',{name:'Thử lại'}).click();
  await expect(page.locator('#published-courses').getByRole('heading',{name:course.title})).toBeVisible();
});
test('Viewer can read but cannot edit courses',async({page})=>{
  await mockAdmin(page,['viewer']);await page.goto('/admin/content/courses');
  await expect(page.getByRole('textbox',{name:'Tên khóa học',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'+ Tạo mới',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);
});

test('Prevents a course from occupying the government program URL',async({page})=>{
  await mockAdmin(page);await page.goto('/admin/content/courses');
  const slug=page.getByRole('textbox',{name:'Đường dẫn (slug)',exact:true});
  await expect(slug).toBeEnabled();await slug.fill('co-quan-nha-nuoc');
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeDisabled();
  await expect(page.getByText('Đường dẫn co-quan-nha-nuoc đã dành cho trang chương trình cơ quan nhà nước. Hãy chọn đường dẫn khác.',{exact:true})).toBeVisible();
});
