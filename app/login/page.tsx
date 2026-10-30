"use client";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "same-origin", cache: "no-store", body: JSON.stringify({ email, password }),
      });
      if (response.ok) { window.location.assign("/admin"); return; }
      const data = await response.json() as {error?:string};
      setMessage(data.error || "Không thể đăng nhập.");
    } catch { setMessage("Không thể kết nối tới máy chủ."); }
    finally { setBusy(false); }
  }
  const fieldStyle = { display:"block", boxSizing:"border-box", width:"100%", padding:12, marginTop:8, borderRadius:8, border:"1px solid #cbd5e1" } as const;
  return <main style={{ minHeight:"100vh", display:"grid", placeItems:"center", padding:24, background:"#f5f7fb" }}>
    <form onSubmit={submit} style={{ width:"100%", maxWidth:420, background:"#fff", borderRadius:16, padding:32, boxShadow:"0 8px 40px #0f234014" }}>
      <p style={{ color:"#3360a1", fontWeight:700, letterSpacing:2 }}>IAICT PORTAL</p>
      <h1 style={{ fontSize:28, marginBottom:10 }}>Đăng nhập quản trị</h1>
      <p style={{ color:"#64748b", lineHeight:1.6 }}>Sử dụng tài khoản nội bộ IAICT. Không hỗ trợ đăng ký công khai.</p>
      <label htmlFor="iaict-email" style={{ display:"block", marginTop:24 }}>Email</label>
      <input id="iaict-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} style={fieldStyle}/>
      <label htmlFor="iaict-password" style={{ display:"block", marginTop:18 }}>Mật khẩu</label>
      <input id="iaict-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} style={fieldStyle}/>
      {message ? <p role="alert" style={{ color:"#b42318" }}>{message}</p> : null}
      <button type="submit" disabled={busy} style={{ width:"100%", background:"#164b95", color:"white", border:0, padding:14, borderRadius:9, marginTop:24, fontWeight:700 }}>{busy ? "Đang xác minh…" : "Đăng nhập"}</button>
    </form>
  </main>;
}
