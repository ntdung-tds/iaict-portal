import {expect,test,type Page} from '@playwright/test';
const record={id:'n1',label:'Dự án',href:'/du-an',group_name:'main',sort_order:0,is_active:1,opens_new_tab:0};
async function mock(page:Page,roles=['admin']){
 await page.route('**/api/admin/cms/session',r=>r.fulfill({json:{actor:{roles}}}));
 await page.route('**/api/admin/cms/collection?*',r=>r.fulfill({json:{actor:{roles},items:[record],total:1,references:{}}}));
 await page.goto('/admin/content/navigation');await expect(page.getByLabel('Tên mục',{exact:true})).toHaveValue(record.label);
}
for(const width of [320,390,1280])test(`Navigation guidance fits ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await mock(page);
 for(const field of await page.locator('[id^="cms-navigation-"]:is(input,select,textarea)').all()){const help=await field.getAttribute('aria-describedby');expect(help).toBeTruthy();await expect(page.locator(`#${help}`)).toHaveText(/.+/);}
 await expect(page.getByLabel('Mục cha',{exact:true})).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Validates links and order, saves tab preference',async({page})=>{
 await mock(page);const save=page.getByRole('button',{name:'Lưu thay đổi',exact:true});
 for(const href of ['//evil.example','javascript:alert(1)','/bad path']){await page.getByLabel('Đường dẫn',{exact:true}).fill(href);await expect(save).toBeDisabled();}
 await page.getByLabel('Đường dẫn',{exact:true}).fill('https://example.com');await page.getByLabel('Thứ tự',{exact:true}).fill('-1');await expect(save).toBeDisabled();await page.getByLabel('Thứ tự',{exact:true}).fill('3');await page.getByLabel('Mở tab mới',{exact:true}).check();
 await page.route('**/api/admin/cms/collection',async r=>{const data=r.request().postDataJSON().data;expect(data.opens_new_tab).toBe(true);await r.fulfill({json:{ok:true,id:'n1',record:{...record,...data}}});});
 await save.click();await expect(page.getByRole('status')).toHaveText('Đã lưu mục menu.');
});
test('Defaults new menu group and preserves unsaved edits',async({page})=>{
 await mock(page);await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await expect(page.getByLabel('Nhóm menu',{exact:true})).toHaveValue('main');await expect(page.getByLabel('Thứ tự',{exact:true})).toHaveValue('0');
 await page.getByLabel('Tên mục',{exact:true}).fill('Menu mới');page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'+ Tạo mới',exact:true}).click();await expect(page.getByLabel('Tên mục',{exact:true})).toHaveValue('Menu mới');
});
test('Viewer cannot edit navigation',async({page})=>{await mock(page,['viewer']);await expect(page.getByLabel('Tên mục',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);});
const items=Array.from({length:6},(_,i)=>({label:`Menu ${i+1}`,href:`https://example.com/${i+1}`,opensNewTab:i===0}));
async function publicMenu(page:Page,payload:unknown){await page.route('**/api/public/navigation',r=>r.fulfill({json:payload}));await page.goto('/gioi-thieu');await expect(page.locator('header[data-interactive="true"]')).toBeVisible();}
test('Desktop preserves CMS order with no duplicated custom links',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await publicMenu(page,{ok:true,items});const nav=page.getByRole('navigation',{name:'Điều hướng chính',exact:true,includeHidden:true});await expect(nav.locator(':scope > a')).toHaveText(['Menu 1','Menu 2','Menu 3','Menu 4','Đăng nhập']);
 await nav.locator('summary').click();await expect(nav.locator('details a')).toHaveText(['Menu 5','Menu 6']);await expect(nav.getByRole('link',{name:'Menu 1',exact:true})).toHaveAttribute('target','_blank');await expect(nav.getByRole('link',{name:'Menu 1',exact:true})).toHaveAttribute('rel','noopener noreferrer');await expect(nav.locator('a[href="https://example.com/5"]')).toHaveCount(1);
});
test('Mobile preserves CMS order and new tab choice',async({page})=>{
 await page.setViewportSize({width:390,height:900});await publicMenu(page,{ok:true,items});await expect(page.getByRole('navigation',{name:'Điều hướng chính',exact:true,includeHidden:true}).locator('a').first()).toHaveText('Menu 1');await page.getByRole('button',{name:'Mở điều hướng',exact:true}).click();const nav=page.locator('#mobile-navigation');await expect(nav.locator('a')).toHaveCount(8);expect(await nav.locator('a').evaluateAll(links=>links.slice(0,6).map(a=>a.getAttribute('href')))).toEqual(items.map(i=>i.href));await expect(nav.locator('a').first()).toHaveAttribute('target','_blank');
});
test('Successful empty CMS menu does not restore fallback items',async({page})=>{
 await page.setViewportSize({width:390,height:900});await publicMenu(page,{ok:true,items:[]});await expect(page.getByRole('navigation',{name:'Điều hướng chính',exact:true,includeHidden:true}).locator('a')).toHaveCount(1);await page.getByRole('button',{name:'Mở điều hướng',exact:true}).click();await expect(page.locator('#mobile-navigation a')).toHaveCount(2);
});
test('Unavailable CMS retains static fallback navigation',async({page})=>{
 await page.setViewportSize({width:390,height:900});await publicMenu(page,{ok:false,items:[]});await page.getByRole('button',{name:'Mở điều hướng',exact:true}).click();expect(await page.locator('#mobile-navigation a').count()).toBeGreaterThan(2);
});
