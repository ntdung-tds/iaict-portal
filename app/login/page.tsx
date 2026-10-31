"use client";
import { useEffect, useRef, useState } from "react";

export default function LoginPage() {
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function authenticate() {
    if (!ready || pendingRef.current || !formRef.current?.reportValidity()) return;
    // Read the actual form controls: never rely on potentially stale hydration state.
    const email = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    pendingRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "same-origin", cache: "no-store", body: JSON.stringify({ email, password }),
      });
      if (response.ok) { if (passwordRef.current) passwordRef.current.value = ""; window.location.assign("/account"); return; }
      const data = await response.json() as {error?:string};
      setMessage(data.error || "Không thể đăng nhập.");
    } catch { setMessage("Không thể kết nối tới máy chủ."); }
    finally { pendingRef.current = false; setBusy(false); }
  }
  const fieldStyle = { display:"block", boxSizing:"border-box", width:"100%", padding:12, marginTop:8, borderRadius:8, border:"1px solid #cbd5e1" } as const;
  return <main style={{ minHeight:"100vh", display:"grid", placeItems:"center", padding:24, background:"#f5f7fb" }}>
    <form ref={formRef} method="post" onSubmit={event => { event.preventDefault(); void authenticate(); }} onKeyDown={event => { if (event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") { event.preventDefault(); void authenticate(); } }} style={{ width:"100%", maxWidth:420, background:"#fff", borderRadius:16, padding:32, boxShadow:"0 8px 40px #0f234014" }}>
      <p style={{ color:"#3360a1", fontWeight:700, letterSpacing:2 }}>IAICT PORTAL</p>
      <h1 style={{ fontSize:28, marginBottom:10 }}>Đăng nhập quản trị</h1>
      <p style={{ color:"#64748b", lineHeight:1.6 }}>Sử dụng tài khoản nội bộ IAICT. Không hỗ trợ đăng ký công khai.</p>
      <label htmlFor="iaict-email" style={{ display:"block", marginTop:24 }}>Email</label>
      <input ref={emailRef} id="iaict-email" type="email" autoComplete="username" required style={fieldStyle}/>
      <label htmlFor="iaict-password" style={{ display:"block", marginTop:18 }}>Mật khẩu</label>
      <input ref={passwordRef} id="iaict-password" type="password" autoComplete="current-password" required style={fieldStyle}/>
      {message ? <p role="alert" style={{ color:"#b42318" }}>{message}</p> : null}
      <button type="submit" disabled={!ready || busy} onClick={event => { event.preventDefault(); void authenticate(); }} style={{ width:"100%", background:"#164b95", color:"white", border:0, padding:14, borderRadius:9, marginTop:24, fontWeight:700 }}>{!ready ? "Đang tải…" : busy ? "Đang xác minh…" : "Đăng nhập"}</button>
    </form>
  </main>;
}
