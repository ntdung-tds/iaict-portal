import { expect, test, type Page } from '@playwright/test';
const registration={id:'r1',contact_name:'Học viên A',organization:'Đơn vị A',email:'a@example.com',phone:'0900000000',course_id:'c1',session_id:'s1',status:'submitted',notes:'Muốn học trực tuyến'};
const references={courses:[{value:'c1',label:'AI cơ bản'}],sessions:[{value:'s1',label:'AI cơ bản · 09:00 16/10/26 (giờ Việt Nam)'}]};
async function mock(page:Page,roles=['admin'],empty=false){
  await page.route('**/api/admin/cms/session',route=>route.fulfill({json:{actor:{roles}}}));
  await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles},items:empty?[]:[registration],total:empty?0:1,references}}));
  await page.goto('/admin/content/registrations');
}
for(const width of [320,390,1280])test(`Registration guidance fits ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await mock(page);
  await expect(page.getByLabel('Người đăng ký',{exact:true})).toHaveValue('Học viên A');
  for(const field of await page.locator('[id^="cms-registrations-"]:is(input,select,textarea)').all()){
    const help=await field.getAttribute('aria-describedby');expect(help).toBeTruthy();await expect(page.locator(`#${help}`)).toHaveText(/.+/);
  }
  await expect(page.getByLabel('Khóa học',{exact:true})).toBeDisabled();
  await expect(page.getByLabel('Lịch lớp',{exact:true}).locator('option:checked')).toHaveText(/09:00/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Filters without losing unsaved status or reference labels, then saves selected record',async({page})=>{
  await mock(page);const status=page.getByLabel('Trạng thái xử lý',{exact:true});
  await expect(status).toHaveValue('submitted');await status.selectOption('confirmed');
  await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles:['admin']},items:[],total:0,references:{courses:[],sessions:[]}}}));
  await page.getByRole('combobox',{name:'Lọc theo trạng thái',exact:true}).selectOption('cancelled');
  await expect(page.getByText('Không có dữ liệu phù hợp.',{exact:true})).toBeVisible();
  await expect(status).toHaveValue('confirmed');
  await expect(page.getByLabel('Khóa học',{exact:true}).locator('option:checked')).toHaveText('AI cơ bản');
  let saved:Record<string,unknown>={};
  await page.route('**/api/admin/cms/collection',async route=>{
    saved=route.request().postDataJSON();await route.fulfill({json:{ok:true,id:'r1',record:{...registration,status:'confirmed'}}});
  });
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Đã lưu đăng ký.');expect(saved.id).toBe('r1');
});
test('Warns before discarding a changed status',async({page})=>{
  await mock(page);const status=page.getByLabel('Trạng thái xử lý',{exact:true});
  await expect(status).toHaveValue('submitted');await status.selectOption('contacted');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Hoàn tác form',exact:true}).click();
  await expect(status).toHaveValue('contacted');
});
test('Empty list has no create or save action',async({page})=>{
  await mock(page,['admin'],true);
  await expect(page.getByText('Module này không tạo bản ghi thủ công.',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:/Tạo đăng ký|Tạo mới|Lưu thay đổi|Xóa/})).toHaveCount(0);
  await expect(page.getByLabel('Trạng thái xử lý',{exact:true})).toBeDisabled();
});
test('Viewer can only read registration data',async({page})=>{
  await mock(page,['viewer']);await expect(page.getByLabel('Trạng thái xử lý',{exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);
});
test('Failed save preserves changed status',async({page})=>{
  await mock(page);const status=page.getByLabel('Trạng thái xử lý',{exact:true});
  await expect(status).toHaveValue('submitted');await status.selectOption('confirmed');
  await page.route('**/api/admin/cms/collection',route=>route.fulfill({status:500,json:{error:'Chưa lưu được'}}));
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Chưa lưu được');await expect(status).toHaveValue('confirmed');
});
