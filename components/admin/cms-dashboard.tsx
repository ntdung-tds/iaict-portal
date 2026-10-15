"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./cms-dashboard.module.css";

type Actor = { id: string; email: string; displayName: string | null; roles: string[] };
type Activity = { id: string; action: string; entity_type: string | null; entity_id: string | null; created_at: string; actor: string };
type Overview = {
  actor: Actor;
  counts: Record<string, number>;
  publishedCount: number;
  recentActivity: Activity[];
};

const cards = [
  { key: "pages", label: "Trang", href: "/admin/content/pages", hint: "Landing & nội dung" },
  { key: "products", label: "Sản phẩm", href: "/admin/content/products", hint: "Nền tảng & giải pháp số" },
  { key: "solutions", label: "Giải pháp", href: "/admin/content/solutions", hint: "Tư vấn & triển khai" },
  { key: "courses", label: "Đào tạo", href: "/admin/content/courses", hint: "Khóa học & tập huấn" },
  { key: "projects", label: "Dự án", href: "/admin/content/projects", hint: "Case study & chuyển giao" },
  { key: "newsQueue", label: "Newsroom", href: "/admin/news", hint: "Hàng chờ cần xử lý" },
  { key: "leads", label: "Leads", href: "/admin/content/leads", hint: "Yêu cầu hợp tác" },
  { key: "registrations", label: "Đăng ký", href: "/admin/content/registrations", hint: "Đào tạo & sự kiện" },
];

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function CmsDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/cms/overview", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as Overview & { error?: string };
        if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
        if (active) setData(payload);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      });
    return () => { active = false; };
  }, []);

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>IAICT CMS · V17</span>
          <h1>Content Control Center</h1>
          <p>Quản trị nội dung, sản phẩm, đào tạo, dự án, newsroom, khách hàng và cấu hình website trong một luồng thống nhất.</p>
        </div>
        <div className={styles.identity}>
          <span>{data?.actor.displayName || data?.actor.email || "CMS Operator"}</span>
          <small>{data?.actor.roles?.join(" · ") || "Cloudflare Access"}</small>
        </div>
      </header>

      {error ? <div className={styles.error}>Không thể tải dashboard: {error}</div> : null}

      <section className={styles.scoreboard} aria-label="Tổng quan CMS">
        <div className={styles.primaryScore}>
          <span>Nội dung đã xuất bản</span>
          <strong>{data?.publishedCount ?? "—"}</strong>
          <small>Trang · sản phẩm · giải pháp · đào tạo · dự án</small>
        </div>
        <div className={styles.scoreMini}>
          <span>Media</span><strong>{data?.counts.media ?? "—"}</strong><small>Tài nguyên nội dung</small>
        </div>
        <div className={styles.scoreMini}>
          <span>Sự kiện</span><strong>{data?.counts.events ?? "—"}</strong><small>Lịch & hội thảo</small>
        </div>
        <div className={styles.scoreMini}>
          <span>Đối tác</span><strong>{data?.counts.partners ?? "—"}</strong><small>Hệ sinh thái</small>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div>
          <div className={styles.sectionHead}>
            <div><span>Workspace</span><h2>Các khu vực quản trị</h2></div>
            <Link href="/admin/settings">Cấu hình CMS →</Link>
          </div>
          <div className={styles.cardGrid}>
            {cards.map((card) => (
              <Link href={card.href} className={styles.moduleCard} key={card.key}>
                <div><span>{card.label}</span><small>{card.hint}</small></div>
                <strong>{data?.counts[card.key] ?? "—"}</strong>
              </Link>
            ))}
          </div>
        </div>

        <aside className={styles.activityPanel}>
          <div className={styles.sectionHead}>
            <div><span>Audit trail</span><h2>Hoạt động gần đây</h2></div>
            <Link href="/admin/content/audit">Xem tất cả</Link>
          </div>
          <div className={styles.activityList}>
            {!data && !error ? <div className={styles.loading}>Đang tải dữ liệu CMS…</div> : null}
            {data?.recentActivity.length === 0 ? <div className={styles.loading}>Chưa có hoạt động.</div> : null}
            {data?.recentActivity.map((item) => (
              <article key={item.id}>
                <span className={styles.activityDot} />
                <div>
                  <strong>{item.action}</strong>
                  <span>{item.entity_type || "system"}{item.entity_id ? ` · ${item.entity_id}` : ""}</span>
                  <small>{item.actor} · {formatTime(item.created_at)}</small>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.quickActions}>
        <div><span>Quick actions</span><strong>Thao tác nhanh</strong></div>
        <Link href="/admin/content/pages">+ Trang mới</Link>
        <Link href="/admin/content/products">+ Sản phẩm mới</Link>
        <Link href="/admin/content/courses">+ Khóa học mới</Link>
        <Link href="/admin/news">Mở Newsroom</Link>
        <Link href="/admin/content/navigation">Sửa menu</Link>
      </section>
    </main>
  );
}
