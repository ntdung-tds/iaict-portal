"use client";

import { useEffect, useState } from "react";
import type { CmsRoleCode } from "@/lib/cms-roles";
import { sessionDateInput, sessionDateIso, sessionDateLabel } from "@/lib/cms-session-dates";
import styles from "./course-session-studio.module.css";

type Course = { id: string; title: string; code: string | null; status: string };
type Session = Record<string, unknown> & { id: string; course_id: string; course_title: string; course_code: string | null; status: string };
type Draft = Record<string, string>;
const empty: Draft = { course_id: "", status: "draft", start_at: "", end_at: "", registration_open_at: "", registration_close_at: "", location: "", online_url_private: "", capacity: "", notes_public: "" };
const statuses: Record<string, string> = { draft: "Bản nháp", open: "Mở đăng ký", closed: "Đóng đăng ký", completed: "Đã hoàn thành", cancelled: "Đã hủy" };
const dates = ["start_at", "end_at", "registration_open_at", "registration_close_at"];
const fields = [
  { key: "status", label: "Trạng thái", help: "Chọn giai đoạn của lớp. Trạng thái Mở đăng ký chưa tự tạo biểu mẫu đăng ký trên website." },
  { key: "capacity", label: "Sức chứa", type: "number", help: "Số học viên dự kiến tối đa; để trống nếu chưa xác định. 0 nghĩa là không có chỗ. Trường này chưa tự chặn đăng ký vượt số lượng." },
  { key: "start_at", label: "Bắt đầu", type: "datetime-local", help: "Ngày, giờ khai giảng theo giờ Việt Nam (UTC+7). Có thể để trống khi chưa chốt lịch." },
  { key: "end_at", label: "Kết thúc", type: "datetime-local", help: "Ngày, giờ kết thúc theo giờ Việt Nam (UTC+7), không trước thời điểm bắt đầu." },
  { key: "registration_open_at", label: "Mở đăng ký", type: "datetime-local", help: "Mốc bắt đầu tiếp nhận dự kiến, theo giờ Việt Nam (UTC+7). Không tự chuyển trạng thái lớp." },
  { key: "registration_close_at", label: "Đóng đăng ký", type: "datetime-local", help: "Mốc kết thúc tiếp nhận dự kiến, theo giờ Việt Nam (UTC+7), không trước mốc mở đăng ký." },
  { key: "location", label: "Địa điểm", placeholder: "Ví dụ: Hội trường tầng 2, Hà Nội hoặc Trực tuyến", help: "Ghi tên phòng và địa chỉ để học viên dễ tìm; nếu học online, ghi Trực tuyến." },
  { key: "online_url_private", label: "URL học trực tuyến (riêng tư)", type: "url", placeholder: "https://meet.google.com/abc-defg-hij", help: "Liên kết HTTPS đến phòng học. Chỉ lưu nội bộ trong CMS, không hiển thị công khai; có thể để trống." },
  { key: "notes_public", label: "Ghi chú công khai", type: "textarea", placeholder: "Ví dụ: Có mặt trước 15 phút, mang theo máy tính cá nhân.", help: "Nhập văn bản thường dành cho học viên. Không ghi mật khẩu phòng học hoặc thông tin cá nhân tại đây." },
];
function toDraft(item: Session): Draft {
  return Object.fromEntries(Object.keys(empty).map(key => [key, dates.includes(key) ? sessionDateInput(item[key]) : String(item[key] ?? empty[key])]));
}
function validate(draft: Draft, courses: Course[]) {
  if (!courses.some(course => course.id === draft.course_id)) return "Vui lòng chọn khóa học chưa được lưu trữ.";
  if (!statuses[draft.status]) return "Trạng thái đã chọn không hợp lệ.";
  if (draft.capacity.trim() && (!Number.isSafeInteger(Number(draft.capacity)) || Number(draft.capacity) < 0)) return "Sức chứa phải là số nguyên không âm.";
  try {
    const [start, end, open, close] = dates.map(key => sessionDateIso(draft[key]));
    if (start && end && end < start) return "Thời gian kết thúc lớp không được trước thời gian bắt đầu.";
    if (open && close && close < open) return "Thời gian đóng đăng ký không được trước thời gian mở đăng ký.";
  } catch { return "Ngày giờ chưa hợp lệ. Vui lòng nhập ngày và giờ đầy đủ theo giờ Việt Nam (UTC+7)."; }
  if (draft.online_url_private.trim()) {
    try { if (new URL(draft.online_url_private.trim()).protocol !== "https:") return "URL học trực tuyến phải dùng HTTPS."; }
    catch { return "URL học trực tuyến phải là URL HTTPS hợp lệ."; }
  }
  return null;
}
export function CourseSessionStudio() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [roles, setRoles] = useState<CmsRoleCode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [baseline, setBaseline] = useState<Draft>(empty);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canEdit = roles.includes("admin") || roles.includes("editor");
  const canDelete = roles.includes("admin");
  const dirty = canEdit && JSON.stringify(draft) !== JSON.stringify(baseline);
  const validation = validate(draft, courses);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    void (async () => {
      try {
        const response = await fetch("/api/admin/cms/course-sessions", { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Không thể tải lịch lớp.");
        if (controller.signal.aborted) return;
        const initial = payload.sessions[0] ? toDraft(payload.sessions[0]) : { ...empty, course_id: payload.courses[0]?.id ?? "" };
        setRoles(payload.actor?.roles ?? []); setSessions(payload.sessions); setCourses(payload.courses);
        setSelectedId(payload.sessions[0]?.id ?? null); setDraft(initial); setBaseline(initial);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : String(cause)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function switchTo(item: Session | null) {
    if (busy || (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Bỏ thay đổi để chuyển lịch lớp?"))) return;
    const next = item ? toDraft(item) : { ...empty, course_id: courses[0]?.id ?? "" };
    setSelectedId(item?.id ?? null); setDraft(next); setBaseline(next); setError(null); setMessage(null);
  }
  async function save() {
    if (!canEdit || busy) return;
    if (validation) { setError(validation); return; }
    setBusy(true); setError(null); setMessage(null);
    try {
      const data = { ...draft, ...Object.fromEntries(dates.map(key => [key, sessionDateIso(draft[key])])) };
      const response = await fetch("/api/admin/cms/course-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedId, data }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Không thể lưu lịch lớp.");
      const record: Session = payload.record;
      if (!record?.id) throw new Error("Chưa nhận được lịch lớp đã lưu. Vui lòng tải lại trang để kiểm tra.");
      const next = toDraft(record);
      setSessions(current => [record, ...current.filter(item => item.id !== record.id)]);
      setSelectedId(record.id); setDraft(next); setBaseline(next);
      setMessage(selectedId ? "Đã lưu lịch lớp." : "Đã tạo lịch lớp.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!canDelete || busy || !selectedId || !window.confirm("Xóa lịch lớp này? Các đăng ký đã liên kết sẽ được giữ lại nhưng không còn gắn với lịch này.")) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/cms/course-sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Không thể xóa lịch lớp.");
      setSessions(current => current.filter(item => item.id !== selectedId));
      const next = { ...empty, course_id: courses[0]?.id ?? "" };
      setSelectedId(null); setDraft(next); setBaseline(next); setMessage("Đã xóa lịch lớp.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  const disabled = busy || loading || !canEdit;
  const set = (key: string, value: string) => { if (!disabled) { setDraft(current => ({ ...current, [key]: value })); setMessage(null); } };
  return <main id="main-content" className={styles.page}>
    <header className={styles.header}><div><span>IAICT CMS / ĐÀO TẠO</span><h1>Lịch lớp & Phiên đào tạo</h1><p>Quản lý từng đợt mở lớp. Tất cả ngày giờ hiển thị và nhập theo giờ Việt Nam (UTC+7).</p><p>Thông tin chương trình được quản lý riêng tại <a href="/admin/content/courses">Khóa học</a>.</p></div>{canEdit && <button onClick={() => switchTo(null)} disabled={disabled || courses.length === 0}>+ Lịch mới</button>}</header>
    {loading && <div className={styles.success} role="status">Đang tải lịch lớp…</div>}
    {!loading && !error && courses.length === 0 && <div className={styles.success}>Chưa có khóa học khả dụng. Hãy tạo khóa học trước khi tạo lịch lớp.</div>}
    {!canEdit && roles.length > 0 && <div className={styles.success}>Chế độ chỉ đọc theo vai trò hiện tại.</div>}
    {error && <div className={styles.error} role="alert">{error}{roles.length === 0 && <button onClick={() => setReload(value => value + 1)}>Thử lại</button>}</div>}
    {message && <div className={styles.success} role="status">{message}</div>}
    <section className={styles.workspace} aria-busy={loading || busy}>
      <aside className={styles.list} aria-label="Danh sách lịch lớp">{sessions.map(item => <button key={item.id} disabled={busy} aria-pressed={item.id === selectedId} className={item.id === selectedId ? styles.itemActive : styles.item} onClick={() => switchTo(item)}><small>{statuses[item.status] ?? item.status} · {item.course_code || "KHÓA HỌC"}</small><strong>{item.course_title}</strong><span>{sessionDateLabel(item.start_at)}{item.location ? ` · ${item.location}` : ""}</span></button>)}{!loading && sessions.length === 0 && <div className={styles.empty}>Chưa có lịch lớp.</div>}</aside>
      <section className={styles.editor}><div className={styles.grid}>
        <label className={styles.wide} htmlFor="session-course_id"><span>Khóa học *</span><select id="session-course_id" aria-label="Khóa học" aria-describedby="help-course_id" required disabled={disabled} value={draft.course_id} onChange={event => set("course_id", event.target.value)}><option value="">Chọn khóa học</option>{draft.course_id && !courses.some(course => course.id === draft.course_id) && <option value={draft.course_id}>Khóa học đã lưu trữ — chọn khóa khác để lưu</option>}{courses.map(course => <option key={course.id} value={course.id}>{course.code ? `${course.code} · ` : ""}{course.title}</option>)}</select><small id="help-course_id">Bắt buộc. Chọn chương trình chưa được lưu trữ; mỗi chương trình có thể có nhiều lịch lớp.</small></label>
        {fields.map(field => {
          const props = { id: `session-${field.key}`, "aria-label": field.label, "aria-describedby": `help-${field.key}`, disabled, value: draft[field.key], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(field.key, event.target.value) };
          return <label key={field.key} htmlFor={props.id} className={field.type === "textarea" ? styles.wide : undefined}><span>{field.label}</span>{field.key === "status" ? <select {...props}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : field.type === "textarea" ? <textarea {...props} rows={5} placeholder={field.placeholder}/> : <input {...props} type={field.type ?? "text"} min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? 1 : undefined} placeholder={field.placeholder}/>}<small id={`help-${field.key}`}>{field.help}</small></label>;
        })}
      </div>{canEdit && <div className={styles.actions}>{dirty && <span> Có thay đổi chưa lưu.</span>}{validation && <span>{validation}</span>}<button disabled={disabled || Boolean(validation)} onClick={() => void save()}>{busy ? "Đang xử lý…" : selectedId ? "Lưu thay đổi" : "Tạo lịch lớp"}</button>{selectedId && canDelete && <button className={styles.delete} disabled={disabled} onClick={() => void remove()}>Xóa</button>}</div>}</section>
    </section>
  </main>;
}
