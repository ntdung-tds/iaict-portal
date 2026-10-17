export const CMS_ROLE_CODES = [
  "admin",
  "editor",
  "reviewer",
  "viewer",
  "news_admin",
  "news_editor",
  "news_reviewer",
] as const;

export type CmsRoleCode = (typeof CMS_ROLE_CODES)[number];

export type CmsRoleDefinition = {
  code: CmsRoleCode;
  name: string;
  scope: "cms" | "newsroom";
  level: "admin" | "edit" | "review" | "view";
  description: string;
  permissions: string[];
};

export const CMS_ROLE_DEFINITIONS: readonly CmsRoleDefinition[] = [
  {
    code: "admin",
    name: "Quản trị viên",
    scope: "cms",
    level: "admin",
    description: "Toàn quyền CMS: nội dung, cấu hình, người dùng và Newsroom.",
    permissions: ["Xem toàn bộ CMS", "Tạo/sửa/xóa nội dung", "Xuất bản", "Quản lý người dùng", "Cấu hình hệ thống", "Toàn quyền Newsroom"],
  },
  {
    code: "editor",
    name: "Biên tập viên",
    scope: "cms",
    level: "edit",
    description: "Tạo và chỉnh sửa nội dung; không quản lý người dùng hoặc cấu hình hệ thống.",
    permissions: ["Xem CMS", "Tạo/sửa nội dung", "Biên tập hàng chờ Newsroom", "Không quản lý người dùng", "Không xóa dữ liệu quản trị"],
  },
  {
    code: "reviewer",
    name: "Người duyệt",
    scope: "cms",
    level: "review",
    description: "Đọc nội dung và thực hiện bước duyệt/xuất bản trong Newsroom.",
    permissions: ["Xem CMS", "Xem nội dung", "Duyệt/từ chối Newsroom", "Xuất bản bài đã duyệt", "Không chỉnh sửa nội dung CMS"],
  },
  {
    code: "viewer",
    name: "Chỉ xem",
    scope: "cms",
    level: "view",
    description: "Quyền đọc an toàn cho người chỉ cần theo dõi và kiểm tra nội dung.",
    permissions: ["Xem CMS", "Xem nội dung", "Không tạo/sửa/xóa", "Không xuất bản", "Không quản lý người dùng"],
  },
  {
    code: "news_admin",
    name: "Quản trị Newsroom",
    scope: "newsroom",
    level: "admin",
    description: "Toàn quyền riêng trong Newsroom; không cấp quyền quản trị các module CMS khác.",
    permissions: ["Xem Newsroom", "Biên tập", "Duyệt/từ chối", "Xuất bản", "Cấu hình nguồn tin/auto-publish"],
  },
  {
    code: "news_editor",
    name: "Biên tập Newsroom",
    scope: "newsroom",
    level: "edit",
    description: "Chỉ biên tập hàng chờ Newsroom; không duyệt hoặc cấu hình hệ thống.",
    permissions: ["Xem Newsroom", "Sửa tiêu đề/tóm tắt/chuyên mục", "Không duyệt", "Không xuất bản", "Không cấu hình nguồn tin"],
  },
  {
    code: "news_reviewer",
    name: "Duyệt Newsroom",
    scope: "newsroom",
    level: "review",
    description: "Chỉ duyệt, từ chối và xuất bản nội dung Newsroom đã đủ điều kiện.",
    permissions: ["Xem Newsroom", "Duyệt/từ chối", "Xuất bản", "Không sửa cấu hình nguồn tin", "Không quản trị CMS khác"],
  },
] as const;

export const CMS_ADMIN_ROLES = ["admin"] as const;
export const CMS_EDIT_ROLES = ["admin", "editor"] as const;
export const CMS_READ_ROLES = ["admin", "editor", "reviewer", "viewer"] as const;

export const NEWSROOM_ADMIN_ROLES = ["admin", "news_admin"] as const;
export const NEWSROOM_EDIT_ROLES = ["admin", "editor", "news_admin", "news_editor"] as const;
export const NEWSROOM_REVIEW_ROLES = ["admin", "reviewer", "news_admin", "news_reviewer"] as const;
export const NEWSROOM_READ_ROLES = [
  "admin",
  "editor",
  "reviewer",
  "viewer",
  "news_admin",
  "news_editor",
  "news_reviewer",
] as const;

export function isCmsRoleCode(value: string): value is CmsRoleCode {
  return (CMS_ROLE_CODES as readonly string[]).includes(value);
}

export function normalizeRoleSelection(values: unknown): CmsRoleCode[] {
  if (!Array.isArray(values)) return [];
  const unique = [...new Set(values.map((value) => String(value).trim()).filter(isCmsRoleCode))];
  if (unique.includes("admin")) return ["admin"];

  const globalRoles = unique.filter((role) => ["editor", "reviewer", "viewer"].includes(role));
  const newsroomRoles = unique.filter((role) => ["news_admin", "news_editor", "news_reviewer"].includes(role));
  if (globalRoles.length > 1) throw new Error("INVALID_CMS_USER_GLOBAL_ROLE_CONFLICT");
  if (newsroomRoles.length > 1) throw new Error("INVALID_CMS_USER_NEWSROOM_ROLE_CONFLICT");
  return unique;
}
