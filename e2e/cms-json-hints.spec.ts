import { test, expect } from '@playwright/test';
import { getCmsModule } from '../lib/cms-schema';

test('JSON examples are readable on mobile and do not replace the draft',async({page})=>{
  await page.setViewportSize({width:390,height:900});
  await page.route('**/api/admin/cms/session',route=>route.fulfill({json:{actor:{roles:['admin']}}}));
  await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles:['admin']},module:getCmsModule('products'),items:[],total:0,references:{}}}));
  await page.goto('/admin/content/products');
  const field=page.getByRole('textbox',{name:'Tính năng (JSON)',exact:true});
  await expect(field).toBeEnabled();
  await field.fill('["Nội dung đang nhập"]');
  await expect(field).toHaveAccessibleDescription(/Nhập danh sách/);
  await page.getByText('Xem mẫu nhập · Tính năng (JSON)',{exact:true}).click();
  await expect(page.locator('details[open] code')).toContainText('Giám sát dữ liệu');
  expect(JSON.parse(await page.locator('details[open] code').innerText())).toBeInstanceOf(Array);
  await expect(field).toHaveValue('["Nội dung đang nhập"]');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
