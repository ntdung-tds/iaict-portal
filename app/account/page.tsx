"use client";

import { useCallback, useEffect, useState } from "react";

type Actor = { email: string; displayName: string | null; roles: string[] };
type State = { phase: "loading" } | { phase: "unauthenticated"; message: string } |
  { phase: "ready"; actor: Actor } | { phase: "error"; message: string };

export default function NativeSessionPage() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [ending, setEnding] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin", cache: "no-store", signal,
      });
      const data = await response.json() as {
        ok?: boolean; actor?: Actor; error?: string;
      };
      if (signal?.aborted) return;
      if (response.ok && data.ok && data.actor) {
        setState({ phase: "ready", actor: data.actor });
      } else if (response.status === 401 || response.status === 403) {
        setState({ phase: "unauthenticated", message: data.error ?? "Chưa đăng nhập." });
      } else {
        setState({ phase: "error", message: data.error ?? "Không thể xác minh phiên." });
      }
    } catch {
      if (!signal?.aborted) setState({ phase: "error", message: "Không thể kết nối tới máy chủ." });
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function logout() {
    setEnding(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Không thể đăng xuất IAICT.");
      window.location.assign("/login");
    } catch {
      setState({ phase: "error", message: "Đăng xuất chưa thành công. Vui lòng thử lại." });
      setEnding(false);
    }
  }
  const linkStyle = { color: "#164b95", fontWeight: 700 } as const;
  return <main id="main-content" style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24, display: "grid", placeItems: "center" }}>
    <section style={{ width: "100%", maxWidth: 520, background: "#fff", padding: 28, borderRadius: 16, boxSizing: "border-box", boxShadow: "0 8px 40px #0f234014", overflowWrap: "anywhere" }}>
      <p style={{ fontWeight: 700, letterSpacing: 2, color: "#3360a1" }}>IAICT PORTAL</p>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Kiểm tra đăng nhập IAICT</h1>
      {state.phase === "loading" ? <p role="status">Đang xác minh phiên đăng nhập…</p> : null}
      {state.phase === "ready" ? <>
        <p role="status" style={{ color: "#087245", fontWeight: 700 }}>Phiên đăng nhập IAICT đã được xác minh.</p>
        <dl>
          <dt style={{ fontWeight: 700, marginTop: 18 }}>Tài khoản</dt>
          <dd style={{ margin: "6px 0" }}>{state.actor.displayName || state.actor.email}</dd>
          <dt style={{ fontWeight: 700, marginTop: 16 }}>Email</dt>
          <dd style={{ margin: "6px 0" }}>{state.actor.email}</dd>
          <dt style={{ fontWeight: 700, marginTop: 16 }}>Vai trò IAICT</dt>
          <dd style={{ margin: "6px 0" }}>{state.actor.roles.join(", ")}</dd>
        </dl>
        <p style={{ color: "#52657a", lineHeight: 1.65 }}>
          Đây là bước xác minh phiên IAICT riêng. Khu vực quản trị vẫn được Cloudflare Access bảo vệ trong giai đoạn chuyển đổi.
        </p>
        <p><a href="/account/security" style={linkStyle}>Đổi mật khẩu IAICT</a></p>
        <p><a href="/admin" style={linkStyle}>Mở CMS (có thể yêu cầu Cloudflare Access)</a></p>
        <button type="button" disabled={ending} onClick={() => void logout()}
          style={{ marginTop: 12, border: 0, borderRadius: 8, background: "#164b95", color: "#fff", padding: "12px 20px", cursor: "pointer" }}>
          {ending ? "Đang đăng xuất…" : "Đăng xuất IAICT"}
        </button>
      </> : null}
      {state.phase === "unauthenticated" ? <>
        <p role="status" style={{ color: "#8a3a14" }}>Chưa đăng nhập IAICT hoặc phiên đã hết hạn.</p>
        <p style={{ color: "#52657a" }}>{state.message}</p>
        <p><a href="/login" style={linkStyle}>Đăng nhập IAICT</a></p>
      </> : null}
      {state.phase === "error" ? <>
        <p role="alert" style={{ color: "#a61c25" }}>{state.message}</p>
        <button type="button" onClick={() => { setState({ phase: "loading" }); void load(); }}>Thử lại</button>
      </> : null}
    </section>
  </main>;
}
