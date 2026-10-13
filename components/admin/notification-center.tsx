"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminNotification } from "@/lib/admin-notifications";

type Filter = "all" | "unread" | "action";

function kindLabel(kind: AdminNotification["kind"]) {
  if (kind === "review-request") return "Duyệt bài";
  if (kind === "returned") return "Trả lại";
  if (kind === "scheduled") return "Đã lên lịch";
  if (kind === "published") return "Đã xuất bản";
  if (kind === "comment") return "Phản hồi";
  return "Sắp xuất bản";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function NotificationCenter({ initialItems }: { initialItems: AdminNotification[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const unreadCount = items.filter((item) => item.unread).length;
  const actionCount = items.filter((item) => item.level !== "info").length;
  const visible = useMemo(() => {
    if (filter === "unread") return items.filter((item) => item.unread);
    if (filter === "action") return items.filter((item) => item.level !== "info");
    return items;
  }, [filter, items]);

  async function markRead(ids: string[], markAll = false) {
    if (!ids.length && !markAll) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(markAll ? { markAll: true } : { ids }),
      });
      const data = (await response.json()) as { items?: AdminNotification[]; message?: string };
      if (!response.ok || !Array.isArray(data.items)) {
        setNotice(data.message ?? "Không thể cập nhật trạng thái thông báo.");
        return;
      }
      setItems(data.items);
    } catch {
      setNotice("Không thể kết nối API thông báo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-notification-center">
      <section className="admin-notification-toolbar">
        <div className="admin-notification-tabs" aria-label="Lọc thông báo">
          <button className={filter === "all" ? "active" : ""} type="button" onClick={() => setFilter("all")}>Tất cả <b>{items.length}</b></button>
          <button className={filter === "unread" ? "active" : ""} type="button" onClick={() => setFilter("unread")}>Chưa đọc <b>{unreadCount}</b></button>
          <button className={filter === "action" ? "active" : ""} type="button" onClick={() => setFilter("action")}>Cần xử lý <b>{actionCount}</b></button>
        </div>
        <button className="admin-button admin-button-secondary" type="button" disabled={busy || unreadCount === 0} onClick={() => markRead([], true)}>
          Đánh dấu tất cả đã đọc
        </button>
      </section>

      {notice ? <div className="admin-inline-notice" role="status">{notice}</div> : null}

      <section className="admin-notification-list">
        {visible.map((item) => (
          <article className={`admin-notification-item is-${item.level}${item.unread ? " is-unread" : ""}`} key={item.id}>
            <div className="admin-notification-marker" aria-hidden="true"><span></span></div>
            <div className="admin-notification-copy">
              <div className="admin-notification-meta">
                <span>{kindLabel(item.kind)}</span>
                <time>{formatDateTime(item.at)}</time>
                {item.unread ? <b>Mới</b> : null}
              </div>
              <h2>{item.title}</h2>
              <strong>{item.publicationTitle}</strong>
              <p>{item.message}</p>
            </div>
            <div className="admin-notification-actions">
              {item.unread ? (
                <button type="button" disabled={busy} onClick={() => markRead([item.id])}>Đã đọc</button>
              ) : null}
              <Link href={item.href} onClick={() => { if (item.unread) void markRead([item.id]); }}>
                {item.level === "info" ? "Mở bài" : "Xử lý"} →
              </Link>
            </div>
          </article>
        ))}
        {visible.length === 0 ? (
          <div className="admin-notification-empty">
            <span>✓</span>
            <strong>Không có thông báo trong nhóm này</strong>
            <p>Những việc mới từ workflow biên tập sẽ tự xuất hiện tại đây.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
