"use client";
import { useEffect, useState, type FormEvent } from "react";

export default function NativeAuthSetupPage() {
  const [actorEmail, setActorEmail] = useState<string | null>(null);
  const [actorError, setActorError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/cms/session", {credentials:"same-origin",cache:"no-store",signal:controller.signal})
      .then(async response => {
        if (!response.ok) throw new Error("Không thể xác minh tài khoản đang đăng nhập.");
        const data = await response.json() as {actor?:{email?:string}};
        if (!data.actor?.email) throw new Error("Tài khoản hiện tại chưa có email IAICT hợp lệ.");
        if (!controller.signal.aborted) setActorEmail(data.actor.email);
      })
      .catch(() => { if (!controller.signal.aborted) setActorError("Không thể lấy email đăng nhập IAICT. Hãy kiểm tra phiên Cloudflare Access."); });
    return () => controller.abort();
  }, []);
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
    <section aria-label="Danh tính tài khoản IAICT" style={{padding:16,background:"#eff6ff",border:"1px solid #c5d9ef",borderRadius:10,margin:"18px 0"}}>
      <strong>Email đăng nhập IAICT của tài khoản này</strong>
      {actorEmail ? <p data-testid="iaict-login-email" style={{fontSize:18,fontWeight:700,overflowWrap:"anywhere",margin:"8px 0"}}>{actorEmail}</p> : <p role="status">{actorError || "Đang xác minh tài khoản…"}</p>}
      <p style={{margin:"8px 0"}}>Khi đăng nhập IAICT, phải sử dụng chính xác email trên, không phải một email cá nhân khác. Mật khẩu gắn với tài khoản CMS này.</p>
      <a href="/login">Mở trang đăng nhập IAICT</a>
    </section>
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
