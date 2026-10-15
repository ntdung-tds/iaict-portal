import { expect, test } from '@playwright/test';

const article = {id:'a1',title:'Ứng dụng IoT trong nông nghiệp',slug:'ung-dung-iot',category_id:'c1',category_name:'Hoạt động Viện',status:'draft',body:'Nội dung mẫu.',excerpt:'',tags_json:'[]',hero_media_id:null,seo_json:'{}',featured:0,updated_at:'2026-10-15',published_at:null};

test.beforeEach(async ({page}) => {
  await page.route('**/api/admin/cms/session', route => route.fulfill({json:{actor:{roles:['admin']}}}));
  await page.route('**/api/admin/cms/articles?*', route => route.fulfill({json:{actor:{roles:['admin']},articles:[article],categories:[{id:'c1',name:'Hoạt động Viện',slug:'hoat-dong',sort_order:0}],media:[]}}));
});

for (const width of [320,390,1280]) {
  test(`Article fields have guidance and fit ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/admin/articles');
    await expect(page.getByLabel('Tiêu đề *', {exact:true})).toHaveValue(article.title);
    for (const field of await page.locator('section[aria-label="Biên tập bài viết"] input, section[aria-label="Biên tập bài viết"] select, section[aria-label="Biên tập bài viết"] textarea').all()) {
      await expect(field).toHaveAttribute('aria-describedby', /.+/);
      const id=await field.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${id}"]`)).toBeVisible();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Chuyên mục',exact:true}).click();
    await expect(page.getByLabel('Đường dẫn chuyên mục (slug)')).toHaveAccessibleDescription(/Để trống/);
  });
}

test('Searching does not overwrite an unsaved article draft', async ({page}) => {
  await page.goto('/admin/articles');
  const title=page.getByLabel('Tiêu đề *',{exact:true});
  await expect(title).toHaveValue(article.title);
  await title.fill('Nội dung đang sửa, chưa lưu');
  const response=page.waitForResponse(r=>r.url().includes('/api/admin/cms/articles?q='));
  await page.getByRole('textbox',{name:'Tìm bài viết'}).fill('IoT');
  await response;
  await expect(title).toHaveValue('Nội dung đang sửa, chưa lưu');
});
