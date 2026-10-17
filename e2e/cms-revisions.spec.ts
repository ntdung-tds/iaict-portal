import {expect,test,type Page} from '@playwright/test';
const revision={id:'r1',entity_type:'pages',entity_id:'p1',actor:'Người kiểm thử',created_at:'2026-10-17T02:00:00Z',snapshot_json:'{"title":"Tiêu đề cũ"}',canRestore:true,restoreReason:null};
async function mock(page:Page,roles=['admin'],row=revision){
 await page.route('**/api/admin/cms/session',r=>r.fulfill({json:{actor:{roles}}}));await page.route('**/api/admin/cms/revisions?*',r=>r.fulfill({json:{actor:{roles},total:1,revisions:[row]}}));await page.goto('/admin/revisions');await expect(page.getByRole('region',{name:'Chi tiết phiên bản'})).toContainText('p1');
}
for(const width of [320,390,1280])test(`Revision layout and guidance fit ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await mock(page);await expect(page.getByRole('region',{name:'Chi tiết phiên bản'})).toContainText('09:00:00');for(const name of ['Loại nội dung','ID bản ghi']){const field=page.getByLabel(name,{exact:true});const help=await field.getAttribute('aria-describedby');await expect(page.locator('#'+help)).toHaveText(/.+/);}await expect(page.getByLabel('Dữ liệu kỹ thuật của phiên bản')).toContainText('Tiêu đề cũ');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Canceled restore does not send mutation; confirmed restore identifies record',async({page})=>{
 await mock(page);let count=0;await page.route('**/api/admin/cms/revisions',async r=>{count++;expect(r.request().postDataJSON()).toEqual({revisionId:'r1'});await r.fulfill({json:{ok:true}});});
 page.once('dialog',async d=>{expect(d.message()).toContain('p1');expect(d.message()).toContain('09:00:00');await d.dismiss();});await page.getByRole('button',{name:'Khôi phục phiên bản',exact:true}).click();expect(count).toBe(0);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Khôi phục phiên bản',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã khôi phục Trang · p1.');expect(count).toBe(1);
});
test('Viewers cannot restore and unavailable revisions explain why',async({page})=>{
 await mock(page,['viewer']);await expect(page.getByRole('button',{name:'Khôi phục phiên bản',exact:true})).toHaveCount(0);
 await page.route('**/api/admin/cms/revisions?*',r=>r.fulfill({json:{actor:{roles:['admin']},total:1,revisions:[{...revision,canRestore:false,restoreReason:'Bản ghi gốc đã bị xóa.'}]}}));await page.getByRole('button',{name:'Làm mới',exact:true}).click();await expect(page.getByRole('button',{name:'Khôi phục phiên bản',exact:true})).toBeDisabled();await expect(page.getByRole('region',{name:'Chi tiết phiên bản'})).toContainText('Bản ghi gốc đã bị xóa.');
});
test('Pagination and exact record filter work together',async({page})=>{
 await mock(page);await page.route('**/api/admin/cms/revisions?*',r=>{const u=new URL(r.request().url());return r.fulfill({json:{actor:{roles:['admin']},total:41,revisions:[{...revision,entity_id:u.searchParams.get('offset')==='40'?'p-old':'p1'}]}});});await page.getByRole('button',{name:'Làm mới',exact:true}).click();await expect(page.getByRole('button',{name:'Trang sau',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(page.getByRole('region',{name:'Chi tiết phiên bản'})).toContainText('p-old');await page.getByLabel('Loại nội dung',{exact:true}).selectOption('pages');await page.getByLabel('ID bản ghi',{exact:true}).fill('p1');const req=page.waitForRequest(r=>r.url().includes('entityId=p1'));await page.getByRole('button',{name:'Lọc phiên bản',exact:true}).click();expect(new URL((await req).url()).searchParams.get('offset')).toBe('0');await expect(page.getByRole('region',{name:'Chi tiết phiên bản'})).toContainText('p1');
});
test('Refresh errors are visible and can be retried',async({page})=>{
 await mock(page);await page.route('**/api/admin/cms/revisions?*',r=>r.fulfill({status:500,json:{error:'Chưa tải được lịch sử'}}));await page.getByRole('button',{name:'Làm mới',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('Chưa tải được lịch sử');await page.route('**/api/admin/cms/revisions?*',r=>r.fulfill({json:{actor:{roles:['admin']},total:0,revisions:[]}}));await page.getByRole('button',{name:'Làm mới',exact:true}).click();await expect(page.getByText('Không có phiên bản phù hợp.',{exact:true})).toBeVisible();
});
test('Restore errors preserve selected snapshot',async({page})=>{
 await mock(page);await page.route('**/api/admin/cms/revisions',r=>r.fulfill({status:400,json:{error:'Dữ liệu phiên bản không hợp lệ.'}}));page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Khôi phục phiên bản',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('Dữ liệu phiên bản không hợp lệ.');await expect(page.getByLabel('Dữ liệu kỹ thuật của phiên bản')).toContainText('Tiêu đề cũ');
});
