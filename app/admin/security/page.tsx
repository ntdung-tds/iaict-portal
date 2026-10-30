"use client";
import { useState, type FormEvent } from "react";

export default function NativeAuthSetupPage() {
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) { setMessage("Hai mật khẩu không trùng khớp."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/cms/auth-setup", {
        method:"POST", headers:{"Content-Type":"application/json"},
        credentials:"same-origin", body:JSON.stringify({ currentPassword, password }),
      });
      const data = await response.json() as {ok?:boolean;error?:string};
      setMessage(response.ok && data.ok ? "Đã thiết lập mật khẩu IAICT. Phiên cũ đã bị thu hồi." : data.error || "Không thể cập nhật mật khẩu.");
      if (response.ok) { setPassword("");setCurrentPassword("");setConfirm(""); }
    } catch { setMessage("Không thể kết nối tới máy chủ."); }
    finally { setBusy(false); }
  }
  const style = { display:"block", width:"100%", padding:10, margin:"8px 0 18px" } as const;
  return <main style={{ maxWidth:700, margin:"0 auto", padding:32 }}>
    <h1>Bảo mật tài khoản IAICT</h1>
    <p>Thiết lập mật khẩu riêng trước khi chuyển đổi khỏi Cloudflare Access. Chỉ quản trị viên đã xác thực mới được sử dụng.</p>
    <form onSubmit={submit}>
      <label htmlFor="old">Mật khẩu IAICT hiện tại (bỏ trống lần đầu)</label>
      <input id="old" type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} style={style}/>
      <label htmlFor="new">Mật khẩu mới (ít nhất 8 ký tự; khuyến nghị từ 12 ký tự)</label>
      <input id="new" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} style={style}/>
      <label htmlFor="confirm">Xác nhận mật khẩu</label>
      <input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)} style={style}/>
      {message ? <p role="status">{message}</p> : null}
      <button type="submit" disabled={busy}>{busy?"Đang cập nhật…":"Lưu mật khẩu IAICT"}</button>
    </form>
  </main>;
}
