"use client";
import { useEffect, useState } from 'react';
import type { NewsWorkflowSettings } from '@/lib/news-workflow';
import styles from './newsroom-admin.module.css';
const trustLabels={official:'Chính thống',verified:'Đã xác minh',reference:'Tham khảo'};
export function NewsWorkflowSettingsForm({settings,canAdmin,locked,onBusy,onSaved}:{settings:NewsWorkflowSettings;canAdmin:boolean;locked:boolean;onBusy:(saving:boolean)=>void;onSaved:(value:NewsWorkflowSettings)=>void}){
 const[draft,setDraft]=useState<NewsWorkflowSettings|null>(null);const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[message,setMessage]=useState('');
 const value=draft??settings;const dirty=JSON.stringify(value)!==JSON.stringify(settings);
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 function change(patch:Partial<NewsWorkflowSettings>){setDraft({...value,...patch});setMessage('');setError('');}
 async function save(){
  if(!canAdmin||locked||busy||!dirty)return;
  if(!Number.isInteger(value.autoPublishMaxPerRun)||value.autoPublishMaxPerRun<1||value.autoPublishMaxPerRun>100){setError('Giới hạn phải là số nguyên từ 1 đến 100 bài.');return;}
  if(!settings.autoPublishEnabled&&value.autoPublishEnabled&&!window.confirm('Bật tự xuất bản? Từ lần lấy tin tiếp theo, các bài đạt đủ điều kiện có thể được đăng công khai mà không cần duyệt từng bài.'))return;
  setBusy(true);onBusy(true);setError('');setMessage('');
  try{const response=await fetch('/api/admin/news/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update-settings',settings:value})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Không thể lưu cài đặt chung.');onSaved(payload.settings);setDraft(null);setMessage('Đã lưu cài đặt tự động hóa chung.');}
  catch(cause){setError(cause instanceof Error?cause.message:'Không thể lưu cài đặt chung.');}finally{setBusy(false);onBusy(false);}
 }
 return <section className={styles.sourceForm} aria-label="Cài đặt tự động hóa chung">
  <h3>Chính sách xuất bản tự động</h3><p>Đang áp dụng: <strong>{settings.autoPublishEnabled?'Bật tự xuất bản':'Tắt tự xuất bản'}</strong>. Thay đổi bên dưới chỉ có hiệu lực sau khi lưu.</p>
  <fieldset disabled={!canAdmin||locked||busy}>
   <label className={styles.checkRow}><input type="checkbox" checked={value.autoPublishEnabled} onChange={e=>change({autoPublishEnabled:e.target.checked})} aria-describedby="workflow-enabled-help"/>Bật tự xuất bản</label>
   <small id="workflow-enabled-help">Công tắc chung cho mọi nguồn. Khi tắt, tin mới vẫn được thu thập vào hàng chờ để duyệt thủ công; bài đã xuất bản không bị gỡ.</small>
   <label htmlFor="workflow-trust">Mức tin cậy tối thiểu</label><select id="workflow-trust" aria-describedby="workflow-trust-help" value={value.autoPublishMinTrust} onChange={e=>change({autoPublishMinTrust:e.target.value as NewsWorkflowSettings['autoPublishMinTrust']})}>{Object.entries(trustLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
   <small id="workflow-trust-help">Chính thống: chỉ nguồn chính thống. Đã xác minh: nhận cả nguồn chính thống và đã xác minh. Tham khảo: nhận cả ba mức. Nguồn đặt “Luôn duyệt thủ công” vẫn không tự đăng.</small>
   <label htmlFor="workflow-cap">Số bài tối đa mỗi lượt lấy tin của một nguồn</label><input id="workflow-cap" type="number" min="1" max="100" step="1" value={Number.isNaN(value.autoPublishMaxPerRun)?'':value.autoPublishMaxPerRun} onChange={e=>change({autoPublishMaxPerRun:e.target.value===''?NaN:Number(e.target.value)})} aria-describedby="workflow-cap-help"/>
   <small id="workflow-cap-help">Số nguyên từ 1 đến 100. Ví dụ: 10 bài cho mỗi nguồn trong một lượt lấy tin; không phải giới hạn tổng theo ngày. Bài vượt giới hạn sẽ chờ duyệt.</small>
   <label className={styles.checkRow}><input type="checkbox" checked={value.requireAttribution} onChange={e=>change({requireAttribution:e.target.checked})} aria-describedby="workflow-attribution-help"/>Bắt buộc ghi nguồn</label>
   <small id="workflow-attribution-help">Chỉ cho tự đăng khi có thông tin ghi nguồn. Tắt điều kiện này không xóa thông tin truy vết nguồn đã lưu.</small>
   <label className={styles.checkRow}><input type="checkbox" checked={value.requireSourcePublishedAt} onChange={e=>change({requireSourcePublishedAt:e.target.checked})} aria-describedby="workflow-date-help"/>Bắt buộc có ngày xuất bản tại nguồn</label>
   <small id="workflow-date-help">Bài không xác định được ngày xuất bản gốc sẽ chuyển sang duyệt thủ công. Đây không phải thời điểm hệ thống thu thập bài.</small>
  </fieldset>
  <p>Ngoài các điều kiện trên, bài phải có tiêu đề, đường dẫn gốc hợp lệ, chuyên mục và không trùng lặp.</p>
  {dirty?<p>Thay đổi chưa lưu.</p>:null}{error?<p role="alert" className={styles.sourceError}>{error}</p>:null}{message?<p role="status">{message}</p>:null}
  {canAdmin?<div className={styles.sourceFormActions}><button type="button" className={styles.saveSettings} disabled={!dirty||locked||busy} onClick={()=>void save()}>{busy?'Đang lưu…':'Lưu cài đặt chung'}</button><button type="button" disabled={!dirty||locked||busy} onClick={()=>{if(window.confirm('Bỏ các thay đổi chưa lưu của cài đặt chung?')){setDraft(null);setError('');setMessage('');}}}>Hủy thay đổi</button></div>:<p>Chế độ chỉ đọc. Chỉ quản trị viên Newsroom được thay đổi chính sách.</p>}
 </section>;
}
