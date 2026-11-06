"use client";

import { useEffect, useState, type FormEvent } from "react";

export default function NativeActivationPage() {
  const [ready,setReady]=useState(false);
  const [token,setToken]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    // Fragments are never sent on GET. Re-read on same-document hash changes
    // (e.g. a second invite link opened in the existing /activate browser tab).
    // Strip the fragment before rendering any token-dependent UI.
    function readInvitation(){
      const fragment=new URLSearchParams(window.location.hash.slice(1));
      const value=fragment.get("token")??"";
      window.history.replaceState(window.history.state,"",window.location.pathname);
      setToken(/^[a-f0-9]{64}$/.test(value)?value:"");
      setPassword("");
      setConfirm("");
      setDone(false);
      setMessage("");
      setReady(true);
    }
    readInvitation();
    window.addEventListener("hashchange",readInvitation);
    return ()=>window.removeEventListener("hashchange",readInvitation);
  },[]);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!ready||busy||!token)return;
    if(password!==confirm){setMessage("Hai mật khẩu không trùng khớp.");return;}
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/auth/activate",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token,password}),
      });
      const result=await response.json() as {ok?:boolean;error?:string};
      if(!response.ok||!result.ok){
        setMessage(result.error||"Không thể kích hoạt tài khoản.");
      }else{
        setDone(true);setToken("");setPassword("");setConfirm("");
        setMessage("Kích hoạt thành công. Hãy đăng nhập bằng email IAICT và mật khẩu vừa đặt.");
      }
    }catch{setMessage("Không thể kết nối máy chủ.");}
    finally{setBusy(false);}
  }
  const field={width:"100%",minWidth:0,boxSizing:"border-box" as const,
    padding:12,border:"1px solid #cbd5e1",borderRadius:8,marginTop:8};
  return <main id="main-content" style={{minHeight:"100vh",display:"grid",
    placeItems:"center",padding:20,background:"#f5f7fb"}}>
    <section style={{width:"100%",maxWidth:480,boxSizing:"border-box",
      padding:28,background:"#fff",borderRadius:16}}>
      <p style={{fontWeight:700,color:"#164b95",letterSpacing:2}}>IAICT PORTAL</p>
      <h1 style={{fontSize:26}}>Kích hoạt tài khoản IAICT</h1>
      <p style={{color:"#52657a",lineHeight:1.6}}>Đặt mật khẩu riêng từ 8–128 ký tự
        (khuyến nghị ít nhất 12). Liên kết kích hoạt chỉ sử dụng một lần,
        hết hạn sau 30 phút và không yêu cầu Cloudflare Access.</p>
      {ready&&!token&&!done?<p role="alert">Liên kết kích hoạt không hợp lệ hoặc không còn trong trình duyệt.</p>:null}
      {!done&&token?<form onSubmit={event=>void submit(event)}>
        <label htmlFor="activation-password">Mật khẩu mới</label>
        <input id="activation-password" type="password" autoComplete="new-password"
          minLength={8} maxLength={128} required value={password}
          disabled={!ready||busy} onChange={e=>setPassword(e.target.value)} style={field}/>
        <label htmlFor="activation-confirm" style={{display:"block",marginTop:20}}>
          Xác nhận mật khẩu</label>
        <input id="activation-confirm" type="password" autoComplete="new-password"
          minLength={8} maxLength={128} required value={confirm}
          disabled={!ready||busy} onChange={e=>setConfirm(e.target.value)} style={field}/>
        {message?<p role="alert" style={{color:"#b42318"}}>{message}</p>:null}
        <button type="submit" disabled={!ready||busy}
          style={{marginTop:24,padding:"12px 20px",background:"#164b95",
            color:"#fff",border:0,borderRadius:8}}>
          {busy?"Đang kích hoạt…":"Kích hoạt tài khoản"}
        </button>
      </form>:null}
      {done?<p role="status" style={{color:"#087245"}}>{message}</p>:null}
      <p style={{marginTop:24}}><a href="/login" style={{color:"#164b95",fontWeight:700}}>
        Đến trang đăng nhập IAICT</a></p>
    </section>
  </main>;
}
