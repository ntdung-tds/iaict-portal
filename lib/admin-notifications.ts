import { createHash } from "node:crypto";
import { get, put } from "@vercel/blob";
import type { AdminSession } from "@/lib/admin-auth";
import { getCmsSnapshot, type CmsInteraction, type CmsPublication } from "@/lib/cms-store";

export type AdminNotificationKind =
  | "review-request"
  | "returned"
  | "scheduled"
  | "published"
  | "comment"
  | "upcoming";

export type AdminNotificationLevel = "action" | "warning" | "info";

export type AdminNotification = {
  id: string;
  kind: AdminNotificationKind;
  level: AdminNotificationLevel;
  title: string;
  message: string;
  at: string;
  publicationId: string;
  publicationTitle: string;
  href: string;
  unread: boolean;
};

export type AdminNotificationInbox = {
  items: AdminNotification[];
  unreadCount: number;
  actionCount: number;
  storageReady: boolean;
};

type NotificationReadState = {
  schemaVersion: 1;
  userId: string;
  updatedAt: string;
  readIds: string[];
};

const MAX_READ_IDS = 1200;
const MAX_NOTIFICATIONS = 120;
const EVENT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;

function readPath(userId: string) {
  const key = createHash("sha256").update(userId).digest("hex").slice(0, 32);
  return `cms/notification-read/${key}.json`;
}

function isReadState(value: unknown): value is NotificationReadState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NotificationReadState>;
  return candidate.schemaVersion === 1 && typeof candidate.userId === "string" && Array.isArray(candidate.readIds);
}

async function getReadState(userId: string): Promise<NotificationReadState> {
  const fallback: NotificationReadState = {
    schemaVersion: 1,
    userId,
    updatedAt: new Date(0).toISOString(),
    readIds: [],
  };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fallback;

  try {
    const result = await get(readPath(userId), { access: "private", useCache: false });
    if (!result?.stream) return fallback;
    const parsed = JSON.parse(await new Response(result.stream).text()) as unknown;
    return isReadState(parsed) && parsed.userId === userId ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("NOTIFICATION_STORAGE_NOT_CONFIGURED");
  const current = await getReadState(userId);
  const merged = [...new Set([...ids, ...current.readIds])].slice(0, MAX_READ_IDS);
  const next: NotificationReadState = {
    schemaVersion: 1,
    userId,
    updatedAt: new Date().toISOString(),
    readIds: merged,
  };
  await put(readPath(userId), JSON.stringify(next), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

function latestWorkflowInteraction(interactions: CmsInteraction[], publicationId: string) {
  return interactions.find((entry) => entry.publicationId === publicationId && entry.kind === "action");
}

function itemRelevantToEditor(item: CmsPublication, session: AdminSession) {
  return item.submittedBy === session.displayName;
}

function itemRelevantToReviewer(item: CmsPublication, session: AdminSession) {
  return item.reviewerId === session.userId;
}

function itemRelevant(item: CmsPublication, session: AdminSession) {
  if (session.role === "superadmin") return true;
  if (session.role === "reviewer") return itemRelevantToReviewer(item, session);
  return itemRelevantToEditor(item, session);
}

function notificationHref(item: CmsPublication) {
  return `/dashboard/noi-dung?focus=${encodeURIComponent(item.id)}`;
}

function eventTitle(action: CmsInteraction["action"]) {
  if (action === "submit-review") return "Bài mới được gửi duyệt";
  if (action === "return-draft") return "Bài đã được trả lại";
  if (action === "schedule") return "Bài đã được duyệt và lên lịch";
  if (action === "publish") return "Bài đã được xuất bản";
  if (action === "comment") return "Có phản hồi mới";
  return "Cập nhật workflow";
}

function eventKind(action: CmsInteraction["action"]): AdminNotificationKind | undefined {
  if (action === "submit-review") return "review-request";
  if (action === "return-draft") return "returned";
  if (action === "schedule") return "scheduled";
  if (action === "publish") return "published";
  if (action === "comment") return "comment";
  return undefined;
}

function eventLevel(action: CmsInteraction["action"]): AdminNotificationLevel {
  if (action === "return-draft") return "warning";
  if (action === "submit-review") return "action";
  return "info";
}

function interactionRelevant(entry: CmsInteraction, item: CmsPublication, session: AdminSession) {
  if (entry.actor === session.displayName && session.role !== "superadmin") return false;
  if (session.role === "superadmin") return true;
  if (entry.action === "submit-review") return session.role === "reviewer" && itemRelevantToReviewer(item, session);
  if (entry.action === "return-draft") return session.role === "editor" && itemRelevantToEditor(item, session);
  if (entry.action === "schedule" || entry.action === "publish") {
    return (session.role === "editor" && itemRelevantToEditor(item, session)) ||
      (session.role === "reviewer" && itemRelevantToReviewer(item, session));
  }
  if (entry.action === "comment") return itemRelevant(item, session);
  return false;
}

export async function getNotificationInbox(session: AdminSession): Promise<AdminNotificationInbox> {
  const [snapshot, readState] = await Promise.all([getCmsSnapshot(), getReadState(session.userId)]);
  const readIds = new Set(readState.readIds);
  const now = Date.now();
  const itemById = new Map(snapshot.state.items.map((item) => [item.id, item]));
  const notifications = new Map<string, Omit<AdminNotification, "unread">>();

  for (const item of snapshot.state.items) {
    if (item.status === "review" && (session.role === "superadmin" || itemRelevantToReviewer(item, session))) {
      const id = `task:review:${item.id}:${item.submittedAt ?? item.updatedAt}`;
      notifications.set(id, {
        id,
        kind: "review-request",
        level: "action",
        title: session.role === "reviewer" ? "Bài đang chờ bạn duyệt" : "Bài đang chờ duyệt",
        message: `${item.submittedBy ? `${item.submittedBy} gửi` : "Nội dung được gửi"}${item.publishAt ? ` · đề xuất ${new Date(item.publishAt).toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" })}` : ""}.`,
        at: item.submittedAt ?? item.updatedAt,
        publicationId: item.id,
        publicationTitle: item.title,
        href: notificationHref(item),
      });
    }

    const latestAction = latestWorkflowInteraction(snapshot.state.interactions, item.id);
    if (
      session.role === "editor" &&
      item.status === "draft" &&
      itemRelevantToEditor(item, session) &&
      latestAction?.action === "return-draft"
    ) {
      const id = `task:return:${item.id}:${latestAction.id}`;
      notifications.set(id, {
        id,
        kind: "returned",
        level: "warning",
        title: "Bài bị trả lại cần chỉnh sửa",
        message: latestAction.message || "Người duyệt đã trả nội dung về nháp.",
        at: latestAction.at,
        publicationId: item.id,
        publicationTitle: item.title,
        href: notificationHref(item),
      });
    }

    if (item.status === "scheduled" && item.publishAt && itemRelevant(item, session)) {
      const publishTime = Date.parse(item.publishAt);
      if (Number.isFinite(publishTime) && publishTime > now && publishTime - now <= UPCOMING_WINDOW_MS) {
        const id = `task:upcoming:${item.id}:${item.publishAt}`;
        notifications.set(id, {
          id,
          kind: "upcoming",
          level: "action",
          title: "Sắp tới giờ xuất bản",
          message: `Bài sẽ công khai lúc ${new Date(item.publishAt).toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" })}.`,
          at: item.publishAt,
          publicationId: item.id,
          publicationTitle: item.title,
          href: notificationHref(item),
        });
      }
    }
  }

  for (const entry of snapshot.state.interactions) {
    const kind = eventKind(entry.action);
    if (!kind) continue;
    const eventTime = Date.parse(entry.at);
    if (Number.isFinite(eventTime) && now - eventTime > EVENT_RETENTION_MS) continue;
    const item = itemById.get(entry.publicationId);
    if (!item || !interactionRelevant(entry, item, session)) continue;

    const id = `event:${entry.id}`;
    notifications.set(id, {
      id,
      kind,
      level: eventLevel(entry.action),
      title: eventTitle(entry.action),
      message: entry.message || `${entry.actor} đã cập nhật workflow nội dung.`,
      at: entry.at,
      publicationId: item.id,
      publicationTitle: item.title,
      href: notificationHref(item),
    });
  }

  const items = [...notifications.values()]
    .map((item) => ({ ...item, unread: !readIds.has(item.id) }))
    .sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      const levelRank = { warning: 0, action: 1, info: 2 } as const;
      if (levelRank[a.level] !== levelRank[b.level]) return levelRank[a.level] - levelRank[b.level];
      return b.at.localeCompare(a.at);
    })
    .slice(0, MAX_NOTIFICATIONS);

  return {
    items,
    unreadCount: items.filter((item) => item.unread).length,
    actionCount: items.filter((item) => item.level !== "info").length,
    storageReady: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
}
