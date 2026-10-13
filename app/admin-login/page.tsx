import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_SESSION_COOKIE, isAdminAuthConfigured, verifyAdminSession } from "../../lib/admin-auth";
import "./login.css";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
  description: "Đăng nhập không gian quản trị nội dung IAICT.",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; logged_out?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (session) redirect("/dashboard");

  const params = (await searchParams) ?? {};
  const configured = isAdminAuthConfigured();
  const errorMessage =
    params.error === "credentials"
      ? "Tên đăng nhập hoặc mật khẩu chưa đúng."
      : params.error === "config"
        ? "Hệ thống xác thực quản trị chưa được cấu hình đầy đủ."
        : null;

  return (
    <main id="main-content" className="admin-login-page">
      <div className="admin-login-orbit" aria-hidden="true"></div>
      <section className="admin-login-shell">
        <div className="admin-login-brand">
          <span className="admin-login-mark">IA</span>
          <div>
            <strong>IAICT</strong>
            <small>Content Operations</small>
          </div>
        </div>

        <div className="admin-login-card">
          <p className="admin-login-kicker">SECURE WORKSPACE</p>
          <h1>Đăng nhập quản trị</h1>
          <p className="admin-login-lead">
            Truy cập dashboard biên tập, quản lý nội dung và các phân hệ vận hành của cổng thông tin IAICT.
          </p>

          {!configured ? (
            <div className="admin-login-alert is-error">
              Xác thực chưa sẵn sàng. Cần cấu hình các secret quản trị trên môi trường triển khai.
            </div>
          ) : null}
          {errorMessage ? <div className="admin-login-alert is-error">{errorMessage}</div> : null}
          {params.logged_out ? <div className="admin-login-alert is-success">Đã đăng xuất an toàn.</div> : null}

          <form className="admin-login-form" method="post" action="/api/admin/login">
            <label>
              <span>Tên đăng nhập</span>
              <input name="username" type="text" autoComplete="username" required disabled={!configured} />
            </label>
            <label>
              <span>Mật khẩu</span>
              <input name="password" type="password" autoComplete="current-password" required disabled={!configured} />
            </label>
            <button type="submit" disabled={!configured}>
              Đăng nhập <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="admin-login-security">
            <span>Session 8 giờ</span>
            <span>HttpOnly cookie</span>
            <span>SameSite=Lax</span>
          </div>
        </div>

        <div className="admin-login-footer">
          <Link href="/">← Về cổng thông tin</Link>
          <span>IAICT Admin • Nội bộ</span>
        </div>
      </section>
    </main>
  );
}
