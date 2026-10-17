"use client";
import { useEffect, useId, useState } from 'react';
import type { NewsroomSourceSummary } from '@/lib/newsroom-settings';
import styles from './newsroom-admin.module.css';
type Values=Pick<NewsroomSourceSummary,'publicationMode'|'isActive'|'scheduleEnabled'|'scheduleIntervalMinutes'|'scheduleRetryMinutes'>;
export function NewsSourceSettings({source,canAdmin,locked,onBusy,onSaved}:{source:NewsroomSourceSummary;canAdmin:boolean;locked:boolean;onBusy:(busy:boolean)=>void;onSaved:(value:Values)=>void}){
 const id=useId();const[draft,setDraft]=useState<Values|null>(null);const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[message,setMessage]=useState('');
 const baseline:Values={publicationMode:source.publicationMode,isActive:source.isActive,scheduleEnabled:source.scheduleEnabled,scheduleIntervalMinutes:source.scheduleIntervalMinutes,scheduleRetryMinutes:source.scheduleRetryMinutes};
 const value=draft??baseline;const dirty=JSON.stringify(value)!==JSON.stringify(baseline);
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 function change(next:Partial<Values>){setDraft({...value,...next});setError('');setMessage('');}
 async function save(){
  if(busy||locked||!canAdmin||!dirty)return;
  if(!Number.isInteger(value.scheduleIntervalMinutes)||value.scheduleIntervalMinutes<15||value.scheduleIntervalMinutes>1440){setError('Chu kỳ lấy tin phải là số phút nguyên từ 15 đến 1.440.');return;}
  if(!Number.isInteger(value.scheduleRetryMinutes)||value.scheduleRetryMinutes<15||value.scheduleRetryMinutes>360){setError('Thời gian thử lại phải là số phút nguyên từ 15 đến 360.');return;}
  setBusy(true);onBusy(true);setError('');setMessage('');
  try{const response=await fetch('/api/admin/news/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update-source',sourceId:source.id,...value})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Không thể lưu cấu hình nguồn.');onSaved(value);setDraft(null);setMessage('Đã lưu cấu hình nguồn.');}
  catch(cause){setError(cause instanceof Error?cause.message:'Không thể lưu cấu hình nguồn.');}finally{setBusy(false);onBusy(false);}
 }
 return <section className={styles.sourceForm} aria-label={`Cấu hình nguồn ${source.name}`}>
  <h3>{source.name}</h3><p>Lưu từng nguồn sau khi kiểm tra các lựa chọn. Các thời điểm hiển thị theo giờ Việt Nam (UTC+7).</p>
  <fieldset disabled={!canAdmin||locked||busy}>
   <label className={styles.checkRow}><input type="checkbox" checked={value.isActive} onChange={e=>change({isActive:e.target.checked})} aria-describedby={`${id}-active`}/>Nguồn đang hoạt động</label>
   <small id={`${id}-active`}>Tắt nguồn sẽ ngừng cả lấy tin thủ công và theo lịch; bài đã thu thập vẫn được giữ lại.</small>
   <label htmlFor={`${id}-mode`}>Chế độ xuất bản</label><select id={`${id}-mode`} value={value.publicationMode} onChange={e=>change({publicationMode:e.target.value as Values['publicationMode']})} aria-describedby={`${id}-mode-help`}><option value="inherit">Theo cài đặt chung</option><option value="manual">Luôn duyệt thủ công</option><option value="auto">Cho phép tự đăng</option></select>
   <small id={`${id}-mode-help`}>“Cho phép tự đăng” vẫn cần công tắc tự xuất bản chung được bật và bài đạt điều kiện kiểm duyệt tự động.</small>
   <label className={styles.checkRow}><input type="checkbox" checked={value.scheduleEnabled} onChange={e=>change({scheduleEnabled:e.target.checked})} aria-describedby={`${id}-schedule`}/>Lấy tin theo lịch</label>
   <small id={`${id}-schedule`}>Chỉ chạy khi nguồn đang hoạt động. Hệ thống kiểm tra mỗi 15 phút nên thời điểm chạy thực tế có thể muộn hơn hạn dự kiến.</small>
   <label htmlFor={`${id}-interval`}>Chu kỳ lấy tin (phút)</label><input id={`${id}-interval`} type="number" min="15" max="1440" step="1" value={Number.isNaN(value.scheduleIntervalMinutes)?'':value.scheduleIntervalMinutes} onChange={e=>change({scheduleIntervalMinutes:e.target.value===''?NaN:Number(e.target.value)})} aria-describedby={`${id}-interval-help`}/>
   <small id={`${id}-interval-help`}>Số nguyên từ 15 đến 1.440. Ví dụ: 60 = mỗi giờ, 1.440 = mỗi ngày. Đổi chu kỳ không dời lần chạy đã được lên lịch.</small>
   <label htmlFor={`${id}-retry`}>Thử lại sau lỗi (phút)</label><input id={`${id}-retry`} type="number" min="15" max="360" step="1" value={Number.isNaN(value.scheduleRetryMinutes)?'':value.scheduleRetryMinutes} onChange={e=>change({scheduleRetryMinutes:e.target.value===''?NaN:Number(e.target.value)})} aria-describedby={`${id}-retry-help`}/>
   <small id={`${id}-retry-help`}>Số nguyên từ 15 đến 360; dùng khi lần lấy tin theo lịch thất bại. Ví dụ: 30 = thử lại sau 30 phút.</small>
  </fieldset>
  {dirty?<p>Thay đổi chưa lưu.</p>:null}{error?<p role="alert" className={styles.sourceError}>{error}</p>:null}{message?<p role="status">{message}</p>:null}
  {canAdmin?<div className={styles.sourceFormActions}><button type="button" className={styles.saveSettings} disabled={!dirty||locked||busy} onClick={()=>void save()}>{busy?'Đang lưu…':'Lưu cấu hình nguồn'}</button><button type="button" disabled={!dirty||locked||busy} onClick={()=>{if(window.confirm('Bỏ các thay đổi chưa lưu của nguồn này?')){setDraft(null);setError('');setMessage('');}}}>Hủy thay đổi</button></div>:<p>Chỉ quản trị viên Newsroom được thay đổi cấu hình nguồn.</p>}
 </section>;
}
