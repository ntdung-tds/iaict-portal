"use client";

import { useEffect, useState, type FormEvent } from "react";

export default function AccountSecurityPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [otherSessions,setOtherSessions]=useState<number|null>(null);
  const [sessionBusy,setSessionBusy]=useState(false);
  const [sessionMessage,setSessionMessage]=useState("");
  useEffect(()=>{
    if(!ready)return;
    const controller=new AbortController();
    void fetch("/api/account/sessions",{cache:"no-store",credentials:"same-origin",signal:controller.signal})
      .then(async response=>{
        if(!response.ok)return;
        const data=await response.json() as {otherActiveSessions?:number};
        if(!controller.signal.aborted&&Number.isSafeInteger(data.otherActiveSessions))
          setOtherSessions(Math.max(0,Number(data.otherActiveSessions)));
      }).catch(()=>{});
    return ()=>controller.abort();
  },[ready]);
  async function revokeOtherSessions(){
    if(sessionBusy||otherSessions===null||otherSessions===0)return;
    if(!window.confirm("Đăng xuất tất cả phiên IAICT khác? Phiên trên thiết bị này vẫn được giữ."))return;
    setSessionBusy(true);setSessionMessage("");
    try{
      const response=await fetch("/api/account/sessions",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"revokeOthers"}),
      });
      const data=await response.json() as {ok?:boolean;error?:string};
      if(!response.ok||!data.ok)throw new Error(data.error||"Không thể thu hồi phiên.");
      setOtherSessions(0);setSessionMessage("Đã đăng xuất các phiên IAICT khác. Phiên này vẫn được giữ.");
    }catch(error){setSessionMessage(error instanceof Error?error.message:"Không thể thu hồi phiên.");}
    finally{setSessionBusy(false);}
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || busy) return;
    if (password !== confirmation) {
      setMessage("Hai mật khẩu mới không trùng khớp.");
      return;
    }
    if (password === currentPassword) {
      setMessage("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setMessage(result.error || "Không thể đổi mật khẩu.");
        return;
      }
      // Server has revoked all native sessions and cleared the browser cookie.
      setSuccess(true);
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
      setMessage("Đổi mật khẩu thành công. Các phiên IAICT cũ đã bị thu hồi. Hãy đăng nhập lại.");
    } catch {
      setMessage("Không thể kết nối tới máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  const field = { boxSizing: "border-box", width: "100%", padding: 12, marginTop: 8,
    border: "1px solid #cbd5e1", borderRadius: 8 } as const;
  const label = { display: "block", marginTop: 20, fontWeight: 600 } as const;
  return (
    <main id="main-content" style={{ minHeight: "100vh", background: "#f5f7fb",
      padding: 24, display: "grid", placeItems: "center" }}>
      <section style={{ width: "100%", maxWidth: 480, boxSizing: "border-box",
        background: "#fff", padding: 28, borderRadius: 16 }}>
        <p style={{ color: "#3360a1", fontWeight: 700, letterSpacing: 2 }}>IAICT PORTAL</p>
        <h1 style={{ fontSize: 26 }}>Đổi mật khẩu IAICT</h1>
        <p style={{ color: "#52657a", lineHeight: 1.6 }}>
          Chỉ đổi mật khẩu của tài khoản đang đăng nhập. Yêu cầu mật khẩu hiện tại.
          Mật khẩu mới ít nhất 8 ký tự (khuyến nghị 12+). Sau khi đổi, tất cả
          các phiên đăng nhập IAICT sẽ bị thu hồi.
        </p>
        {!success ? (
          <form onSubmit={event => void submit(event)}>
            <label htmlFor="current" style={label}>Mật khẩu IAICT hiện tại</label>
            <input id="current" type="password" autoComplete="current-password"
              required disabled={!ready || busy} minLength={8} maxLength={128} value={currentPassword}
              onChange={event => setCurrentPassword(event.target.value)} style={field} />
            <label htmlFor="next" style={label}>Mật khẩu mới</label>
            <input id="next" type="password" autoComplete="new-password"
              required disabled={!ready || busy} minLength={8} maxLength={128} value={password}
              onChange={event => setPassword(event.target.value)} style={field} />
            <label htmlFor="confirm" style={label}>Xác nhận mật khẩu mới</label>
            <input id="confirm" type="password" autoComplete="new-password"
              required disabled={!ready || busy} minLength={8} maxLength={128} value={confirmation}
              onChange={event => setConfirmation(event.target.value)} style={field} />
            {message ? <p role="alert" style={{ color: "#b42318" }}>{message}</p> : null}
            <button type="submit" disabled={!ready || busy} style={{ marginTop: 24, padding: "12px 20px",
              background: "#164b95", border: 0, borderRadius: 8, color: "#fff" }}>
              {!ready ? "Đang tải…" : busy ? "Đang đổi mật khẩu…" : "Lưu mật khẩu mới"}
            </button>
          </form>
        ) : <p role="status" style={{ color: "#087245" }}>{message}</p>}
        {!success&&otherSessions!==null?<section aria-label="Phiên đăng nhập IAICT" style={{marginTop:28,borderTop:"1px solid #e2e8f0",paddingTop:20}}>
          <h2 style={{fontSize:18}}>Phiên đăng nhập khác</h2>
          <p style={{color:"#52657a"}}>Hiện có {otherSessions} phiên IAICT khác còn hiệu lực. Không bao gồm các phiên Cloudflare Access.</p>
          <button type="button" onClick={()=>void revokeOtherSessions()} disabled={sessionBusy||otherSessions===0}
            style={{padding:"10px 16px",borderRadius:8,border:"1px solid #b42318",color:"#b42318",background:"#fff"}}>
            {sessionBusy?"Đang thu hồi…":"Đăng xuất tất cả phiên khác"}
          </button>
          {sessionMessage?<p role="status">{sessionMessage}</p>:null}
        </section>:null}
        <p style={{ marginTop: 24 }}>
          <a href={success ? "/login" : "/account"} style={{ color: "#164b95", fontWeight: 700 }}>
            {success ? "Đăng nhập lại" : "Quay lại tài khoản"}
          </a>
        </p>
      </section>
    </main>
  );
}
