export const AUDIT_ACTION_LABELS:Record<string,string>={"cms.entity.create":"Tạo nội dung","cms.entity.update":"Cập nhật nội dung","cms.entity.delete":"Xóa nội dung","cms.article.create":"Tạo bài viết","cms.article.update":"Cập nhật bài viết","cms.article.delete":"Xóa bài viết","cms.user.create":"Thêm người dùng","cms.user.update":"Cập nhật người dùng","cms.user.deactivate":"Vô hiệu hóa người dùng","cms.revision.restore":"Khôi phục phiên bản","cms.settings.update":"Cập nhật cấu hình","news.settings.update":"Cập nhật Newsroom","news.source.settings.update":"Cập nhật nguồn tin","news.review.edit":"Biên tập tin","news.review.approved":"Duyệt tin","news.review.rejected":"Từ chối tin"};
export function auditTime(value:unknown):string {
 const raw=String(value??'');
 // SQLite datetime values without a zone are stored as UTC.
 const normalized=raw.includes('T')?raw:raw.replace(' ','T');
 const date=new Date(/[zZ]$|[+-]\d{2}:\d{2}$/.test(normalized)?normalized:normalized+'Z');
 return Number.isNaN(date.getTime())?'Không xác định':date.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'medium'});
}
export function auditMetadata(value:unknown):string {
 try{return JSON.stringify(typeof value==='string'?JSON.parse(value):value??{},null,2);}catch{return String(value??'');}
}
