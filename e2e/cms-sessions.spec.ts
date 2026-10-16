import { expect, test, type Page } from '@playwright/test';
const course = { id:'c1',title:'AI cơ bản',code:'AI-01',status:'published' };
const session = {id:'s1',course_id:'c1',course_title:course.title,course_code:course.code,status:'draft',start_at:'2026-10-16T02:00:00Z',end_at:'2026-10-16T10:00:00Z',capacity:25,location:'Hà Nội'};
async function setup(page: Page, roles=['admin']) {
  await page.route('**/api/admin/cms/session', route => route.fulfill({json:{actor:{roles}}}));
  await page.route('**/api/admin/cms/course-sessions', route => route.fulfill({json:{sessions:[session],courses:[course],actor:{roles}}}));
  await page.goto('/admin/course-sessions');
  await expect(page.getByLabel('Địa điểm',{exact:true})).toHaveValue('Hà Nội');
}
for (const width of [320,390,1280]) test(`Session guidance and layout at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:900}); await setup(page);
  for (const field of await page.locator('[id^="session-"]').all()) {
    const help = await field.getAttribute('aria-describedby');
    expect(help).toBeTruthy(); await expect(page.locator(`#${help}`)).toHaveText(/.+/);
  }
  await expect(page.getByLabel('Bắt đầu',{exact:true})).toHaveValue('2026-10-16T09:00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('Protects unsaved edits when switching and retains form after failed save', async ({page}) => {
  await setup(page); await page.getByLabel('Địa điểm',{exact:true}).fill('Đang sửa');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button',{name:'+ Lịch mới',exact:true}).click();
  await expect(page.getByLabel('Địa điểm',{exact:true})).toHaveValue('Đang sửa');
  await page.route('**/api/admin/cms/course-sessions', route => route.fulfill({status:500,json:{error:'Lưu thất bại'}}));
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Lưu thất bại');
  await expect(page.getByLabel('Địa điểm',{exact:true})).toHaveValue('Đang sửa');
});
test('Creates and reselects saved session with explicit UTC dates', async ({page}) => {
  await setup(page); await page.getByRole('button',{name:'+ Lịch mới',exact:true}).click();
  await page.getByLabel('Bắt đầu',{exact:true}).fill('2026-11-01T08:30');
  await page.getByLabel('Địa điểm',{exact:true}).fill('Lớp mới');
  let saved: Record<string,unknown> = {};
  await page.route('**/api/admin/cms/course-sessions', async route => {
    const body=route.request().postDataJSON(); saved=body.data;
    await route.fulfill({json:{ok:true,id:'s2',record:{...session,...body.data,id:'s2'}}});
  });
  await page.getByRole('button',{name:'Tạo lịch lớp',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Đã tạo lịch lớp.');
  expect(saved.start_at).toBe('2026-11-01T01:30:00.000Z');
  await expect(page.getByLabel('Bắt đầu',{exact:true})).toHaveValue('2026-11-01T08:30');
  await expect(page.getByLabel('Địa điểm',{exact:true})).toHaveValue('Lớp mới');
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeVisible();
});
test('Rejects reversed dates, fractional capacity and unsafe meeting URLs', async ({page}) => {
  await setup(page); const save=page.getByRole('button',{name:'Lưu thay đổi',exact:true});
  await page.getByLabel('Kết thúc',{exact:true}).fill('2026-10-15T08:00');await expect(save).toBeDisabled();
  await page.getByLabel('Kết thúc',{exact:true}).fill('');
  await page.getByLabel('Sức chứa',{exact:true}).fill('1.5');await expect(save).toBeDisabled();
  await page.getByLabel('Sức chứa',{exact:true}).fill('');
  await page.getByLabel('URL học trực tuyến (riêng tư)',{exact:true}).fill('http://example.com');await expect(save).toBeDisabled();
});
test('Viewer has no mutation controls', async ({page}) => {
  await setup(page,['viewer']);
  await expect(page.getByLabel('Địa điểm',{exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'+ Lịch mới',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Xóa',exact:true})).toHaveCount(0);
});
test('Recovers from initial load failure', async ({page}) => {
  await page.route('**/api/admin/cms/session', route => route.fulfill({json:{actor:{roles:['admin']}}}));
  let calls=0;
  await page.route('**/api/admin/cms/course-sessions', route => route.fulfill(++calls === 1 ? {status:503,json:{error:'Tạm thời không tải được'}} : {json:{sessions:[session],courses:[course],actor:{roles:['admin']}}}));
  await page.goto('/admin/course-sessions');
  await page.getByRole('button',{name:'Thử lại',exact:true}).click();
  await expect(page.getByLabel('Địa điểm',{exact:true})).toHaveValue('Hà Nội');
});
