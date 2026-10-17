import {expect,test,type Page} from '@playwright/test';
const lead={id:'l1',contact_name:'Khách hàng A',organization:'Đơn vị A',phone:'0900000000',email:'a@example.com',message:'Tư vấn ứng dụng AI',status:'new',owner_id:'u1',internal_notes:'Ghi chú hiện tại'};
const users=[{value:'u1',label:'Người phụ trách A'},{value:'u2',label:'Người phụ trách B'},{value:'old',label:'Người cũ · Đã ngừng hoạt động',disabled:true}];
async function mock(page:Page,roles=['admin'],record:Record<string,unknown>|null=lead){
 await page.route('**/api/admin/cms/session',route=>route.fulfill({json:{actor:{roles}}}));
 await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles},items:record?[record]:[],total:record?1:0,references:{users}}}));
 await page.goto('/admin/content/leads');
}
for(const width of [320,390,1280])test(`Lead editor guidance fits ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await mock(page);
 await expect(page.getByLabel('Người liên hệ',{exact:true})).toHaveValue(lead.contact_name);
 for(const field of await page.locator('[id^="cms-leads-"]:is(input,select,textarea)').all()){
  const help=await field.getAttribute('aria-describedby');expect(help).toBeTruthy();await expect(page.locator(`#${help}`)).toHaveText(/.+/);
 }
 await expect(page.getByLabel('Người liên hệ',{exact:true})).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Clears assignee and saves notes while retaining selection',async({page})=>{
 await mock(page);const owner=page.getByLabel('Người phụ trách',{exact:true});await expect(owner).toHaveValue('u1');
 await owner.selectOption('');await page.getByLabel('Ghi chú nội bộ',{exact:true}).fill('Chờ phân công');
 let saved:Record<string,unknown>={};
 await page.route('**/api/admin/cms/collection',async route=>{saved=route.request().postDataJSON().data;await route.fulfill({json:{ok:true,id:'l1',record:{...lead,...saved,owner_id:null}}});});
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Đã lưu yêu cầu.');expect(saved.owner_id).toBe('');await expect(owner).toHaveValue('');
 await expect(page.getByLabel('Ghi chú nội bộ',{exact:true})).toHaveValue('Chờ phân công');
});
test('Warns about unsaved notes and retains edits after filtering',async({page})=>{
 await mock(page);const notes=page.getByLabel('Ghi chú nội bộ',{exact:true});await expect(notes).toHaveValue(lead.internal_notes);await notes.fill('Chưa lưu');
 page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Hoàn tác form',exact:true}).click();await expect(notes).toHaveValue('Chưa lưu');
 await page.route('**/api/admin/cms/collection?*',route=>route.fulfill({json:{actor:{roles:['admin']},items:[],total:0,references:{users}}}));
 await page.getByRole('combobox',{name:'Lọc theo trạng thái',exact:true}).selectOption('closed');
 await expect(page.getByText('Không có dữ liệu phù hợp.',{exact:true})).toBeVisible();await expect(notes).toHaveValue('Chưa lưu');
});
test('Shows inactive assignee without allowing reassignment to that account',async({page})=>{
 await mock(page,['admin'],{...lead,owner_id:'old'});const owner=page.getByLabel('Người phụ trách',{exact:true});await expect(owner).toHaveValue('old');
 await expect(owner.locator('option[value="old"]')).toHaveJSProperty('disabled',true);
 await page.getByLabel('Ghi chú nội bộ',{exact:true}).fill('Tiếp tục xử lý');await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toBeEnabled();
 await owner.selectOption('u2');await expect(owner).toHaveValue('u2');
});
test('Viewer cannot change assignment or notes',async({page})=>{
 await mock(page,['viewer']);await expect(page.getByLabel('Người phụ trách',{exact:true})).toBeDisabled();await expect(page.getByLabel('Ghi chú nội bộ',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Lưu thay đổi',exact:true})).toHaveCount(0);
});
test('No manual creation action for an empty intake list',async({page})=>{
 await mock(page,['admin'],null);await expect(page.getByText('Module này không tạo bản ghi thủ công.',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:/Tạo yêu cầu|Tạo mới|Lưu thay đổi|Xóa/})).toHaveCount(0);
});
test('Save failure preserves notes and owner selection',async({page})=>{
 await mock(page);const notes=page.getByLabel('Ghi chú nội bộ',{exact:true});await expect(notes).toHaveValue(lead.internal_notes);await notes.fill('Ghi chú mới');await page.getByLabel('Người phụ trách',{exact:true}).selectOption('u2');
 await page.route('**/api/admin/cms/collection',route=>route.fulfill({status:500,json:{error:'Chưa lưu được'}}));
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('Chưa lưu được');await expect(notes).toHaveValue('Ghi chú mới');await expect(page.getByLabel('Người phụ trách',{exact:true})).toHaveValue('u2');
});
