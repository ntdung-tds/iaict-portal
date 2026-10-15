export type CmsFieldType = "text" | "textarea" | "select" | "boolean" | "number" | "datetime" | "json" | "url" | "email";

export type CmsFieldOption = { value: string; label: string };

export type CmsField = {
  key: string;
  label: string;
  type: CmsFieldType;
  required?: boolean;
  readonly?: boolean;
  list?: boolean;
  placeholder?: string;
  help?: string;
  options?: CmsFieldOption[];
};

export type CmsModuleConfig = {
  key: string;
  label: string;
  singular: string;
  description: string;
  table: string;
  fields: CmsField[];
  searchColumns: string[];
  titleColumn: string;
  subtitleColumn?: string;
  statusColumn?: string;
  slugColumn?: string;
  publishColumn?: string;
  orderBy: string;
  allowCreate?: boolean;
  allowDelete?: boolean;
  readOnly?: boolean;
  adminOnly?: boolean;
};

const statusOptions: CmsFieldOption[] = [
  { value: "draft", label: "Bản nháp" },
  { value: "review", label: "Chờ duyệt" },
  { value: "published", label: "Đã xuất bản" },
  { value: "archived", label: "Lưu trữ" },
];

const leadStatusOptions: CmsFieldOption[] = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "qualified", label: "Đủ điều kiện" },
  { value: "won", label: "Hoàn thành" },
  { value: "closed", label: "Đóng" },
];

const baseSeoField: CmsField = {
  key: "seo_json",
  label: "SEO (JSON)",
  type: "json",
  help: "Ví dụ: {\"title\":\"...\",\"description\":\"...\"}",
};

const baseStatusField: CmsField = {
  key: "status",
  label: "Trạng thái",
  type: "select",
  required: true,
  list: true,
  options: statusOptions,
};

export const cmsModules: Record<string, CmsModuleConfig> = {
  pages: {
    key: "pages",
    label: "Trang",
    singular: "trang",
    description: "Tạo trang nội dung độc lập tại /noi-dung/duong-dan-trang; quản lý bản nháp và xuất bản.",
    table: "pages",
    titleColumn: "title",
    subtitleColumn: "slug",
    statusColumn: "status",
    slugColumn: "slug",
    publishColumn: "published_at",
    searchColumns: ["title", "slug", "summary"],
    orderBy: "updated_at DESC",
    fields: [
      { key: "title", label: "Tiêu đề", type: "text", required: true, list: true, placeholder: "Ví dụ: Hợp tác nghiên cứu với IAICT", help: "Tên chính hiển thị ở đầu trang. Viết rõ nội dung, tránh viết hoa toàn bộ." },
      { key: "slug", label: "Đường dẫn (slug)", type: "text", required: true, list: true, placeholder: "Để trống để tự tạo từ tiêu đề", help: "Ví dụ hop-tac-nghien-cuu. Chỉ dùng chữ thường không dấu, số và dấu gạch nối; tối đa 120 ký tự. Hạn chế đổi khi trang đã xuất bản." },
      { ...baseStatusField, help: "Bản nháp: đang soạn; Chờ duyệt: cần rà soát; Đã xuất bản: công khai ngay khi lưu; Lưu trữ: ẩn khỏi website." },
      { key: "page_type", label: "Loại trang", type: "select", required: true, help: "Dùng để phân loại nội dung trong CMS. Các loại hiện dùng chung mẫu trình bày; lựa chọn này không tự đổi giao diện.", options: [
        { value: "standard", label: "Trang chuẩn" },
        { value: "landing", label: "Landing page" },
        { value: "service", label: "Trang dịch vụ" },
        { value: "product", label: "Trang sản phẩm" },
        { value: "training", label: "Trang đào tạo" },
      ] },
      { key: "summary", label: "Tóm tắt", type: "textarea", placeholder: "Giới thiệu nội dung trong 2–3 câu.", help: "Đoạn giới thiệu ngay dưới tiêu đề; không bắt buộc." },
      { key: "body", label: "Nội dung", type: "textarea", required: true, placeholder: "Nhập nội dung trang. Cách một dòng trống để tách đoạn.", help: "Nhập văn bản thuần; cách các đoạn bằng một dòng trống. Mã HTML và Markdown không được chuyển thành định dạng trên trang này." },
      { key: "layout_json", label: "Thông tin bổ sung (JSON)", type: "json", help: "Hiển thị dưới mục Thông tin bổ sung ở cuối nội dung. Đây không phải công cụ thay đổi bố cục. Nếu chưa dùng, giữ nguyên {}." },
      { key: "hero_media_id", label: "Ảnh đại diện", type: "text", help: "Chọn ảnh có URL HTTPS và phạm vi Công khai trong Thư viện Media. Ảnh hiển thị ở đầu trang; có thể để Không chọn." },
      { ...baseSeoField, label: "SEO nâng cao (JSON)", help: "Có thể nhập title và description dạng chuỗi. Để {} thì trang dùng tiêu đề và tóm tắt hiện có; xem mẫu bên dưới." },
      { key: "featured", label: "Đánh dấu nổi bật", type: "boolean", help: "Đánh dấu trang quan trọng trong CMS; không tự thêm trang vào menu hay trang chủ." },
    ],
  },
  products: {
    key: "products",
    label: "Sản phẩm & Nền tảng",
    singular: "sản phẩm",
    description: "Danh mục nền tảng, sản phẩm số, IoT, AI và truy xuất nguồn gốc.",
    table: "products",
    titleColumn: "title",
    subtitleColumn: "category",
    statusColumn: "status",
    slugColumn: "slug",
    publishColumn: "published_at",
    searchColumns: ["title", "slug", "summary", "category"],
    orderBy: "featured DESC, updated_at DESC",
    fields: [
      { key: "title", label: "Tên sản phẩm", type: "text", required: true, list: true },
      { key: "slug", label: "Slug", type: "text", required: true, list: true },
      baseStatusField,
      { key: "category", label: "Nhóm sản phẩm", type: "text", list: true },
      { key: "summary", label: "Mô tả ngắn", type: "textarea", required: true },
      { key: "features_json", label: "Tính năng (JSON)", type: "json" },
      { key: "technologies_json", label: "Công nghệ (JSON)", type: "json" },
      { key: "benefits_json", label: "Lợi ích (JSON)", type: "json" },
      { key: "integration_notes", label: "Ghi chú tích hợp", type: "textarea" },
      baseSeoField,
      { key: "featured", label: "Nổi bật", type: "boolean" },
    ],
  },
  solutions: {
    key: "solutions",
    label: "Giải pháp & Dịch vụ",
    singular: "giải pháp",
    description: "Tư vấn, thiết kế hệ thống, phần mềm, AI, dữ liệu và chuyển giao.",
    table: "solutions",
    titleColumn: "title",
    subtitleColumn: "slug",
    statusColumn: "status",
    slugColumn: "slug",
    publishColumn: "published_at",
    searchColumns: ["title", "slug", "summary", "problem"],
    orderBy: "featured DESC, updated_at DESC",
    fields: [
      { key: "title", label: "Tên giải pháp", type: "text", required: true, list: true },
      { key: "slug", label: "Slug", type: "text", required: true, list: true },
      baseStatusField,
      { key: "summary", label: "Mô tả ngắn", type: "textarea", required: true },
      { key: "problem", label: "Bài toán", type: "textarea" },
      { key: "scope_json", label: "Phạm vi (JSON)", type: "json" },
      { key: "process_json", label: "Quy trình (JSON)", type: "json" },
      { key: "deliverables_json", label: "Sản phẩm bàn giao (JSON)", type: "json" },
      { key: "technologies_json", label: "Công nghệ (JSON)", type: "json" },
      baseSeoField,
      { key: "featured", label: "Nổi bật", type: "boolean" },
    ],
  },
  courses: {
    key: "courses",
    label: "Đào tạo & Tập huấn",
    singular: "khóa học",
    description: "Khóa học, chương trình bồi dưỡng và nội dung đào tạo theo đối tượng.",
    table: "courses",
    titleColumn: "title",
    subtitleColumn: "code",
    statusColumn: "status",
    slugColumn: "slug",
    publishColumn: "published_at",
    searchColumns: ["title", "slug", "code", "summary"],
    orderBy: "featured DESC, updated_at DESC",
    fields: [
      { key: "code", label: "Mã khóa", type: "text", list: true },
      { key: "title", label: "Tên khóa học", type: "text", required: true, list: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      baseStatusField,
      { key: "summary", label: "Mô tả ngắn", type: "textarea", required: true },
      { key: "duration", label: "Thời lượng", type: "text" },
      { key: "level", label: "Cấp độ", type: "text" },
      { key: "class_size", label: "Quy mô lớp", type: "text" },
      { key: "audiences_json", label: "Đối tượng (JSON)", type: "json" },
      { key: "topics_json", label: "Chủ đề (JSON)", type: "json" },
      { key: "objectives_json", label: "Mục tiêu (JSON)", type: "json" },
      { key: "modules_json", label: "Chương trình (JSON)", type: "json" },
      { key: "delivery_modes_json", label: "Hình thức (JSON)", type: "json" },
      { key: "materials_json", label: "Tài liệu (JSON)", type: "json" },
      { key: "certificate_note", label: "Chứng nhận / ghi chú", type: "textarea" },
      baseSeoField,
      { key: "featured", label: "Nổi bật", type: "boolean" },
    ],
  },
  projects: {
    key: "projects",
    label: "Dự án",
    singular: "dự án",
    description: "Dự án tiêu biểu, bối cảnh triển khai, kết quả và khả năng nhân rộng.",
    table: "projects",
    titleColumn: "title",
    subtitleColumn: "slug",
    statusColumn: "status",
    slugColumn: "slug",
    publishColumn: "published_at",
    searchColumns: ["title", "slug", "summary", "context"],
    orderBy: "featured DESC, updated_at DESC",
    fields: [
      { key: "title", label: "Tên dự án", type: "text", required: true, list: true },
      { key: "slug", label: "Slug", type: "text", required: true, list: true },
      baseStatusField,
      { key: "summary", label: "Mô tả ngắn", type: "textarea", required: true },
      { key: "context", label: "Bối cảnh", type: "textarea" },
      { key: "solution", label: "Giải pháp", type: "textarea" },
      { key: "scope_json", label: "Phạm vi (JSON)", type: "json" },
      { key: "technologies_json", label: "Công nghệ (JSON)", type: "json" },
      { key: "results_json", label: "Kết quả (JSON)", type: "json" },
      { key: "replication_potential", label: "Khả năng nhân rộng", type: "textarea" },
      baseSeoField,
      { key: "featured", label: "Nổi bật", type: "boolean" },
    ],
  },
  experts: {
    key: "experts",
    label: "Chuyên gia",
    singular: "chuyên gia",
    description: "Hồ sơ chuyên gia, lĩnh vực chuyên môn và thông tin công khai.",
    table: "experts",
    titleColumn: "name",
    subtitleColumn: "title",
    statusColumn: "status",
    slugColumn: "slug",
    searchColumns: ["name", "slug", "title", "bio"],
    orderBy: "updated_at DESC",
    fields: [
      { key: "name", label: "Họ tên", type: "text", required: true, list: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      baseStatusField,
      { key: "title", label: "Chức danh", type: "text", list: true },
      { key: "bio", label: "Giới thiệu", type: "textarea" },
      { key: "expertise_json", label: "Chuyên môn (JSON)", type: "json" },
      { key: "photo_media_id", label: "Ảnh đại diện Media ID", type: "text" },
      { key: "public_contacts_json", label: "Liên hệ công khai (JSON)", type: "json" },
      baseSeoField,
    ],
  },
  partners: {
    key: "partners",
    label: "Đối tác",
    singular: "đối tác",
    description: "Đơn vị hợp tác, logo, website và mô tả hiển thị công khai.",
    table: "partners",
    titleColumn: "name",
    subtitleColumn: "website",
    statusColumn: "status",
    searchColumns: ["name", "summary", "website"],
    orderBy: "updated_at DESC",
    fields: [
      { key: "name", label: "Tên đơn vị", type: "text", required: true, list: true },
      baseStatusField,
      { key: "logo_media_id", label: "Logo Media ID", type: "text" },
      { key: "summary", label: "Mô tả", type: "textarea" },
      { key: "website", label: "Website", type: "url", list: true },
      { key: "public_note", label: "Ghi chú công khai", type: "textarea" },
    ],
  },
  events: {
    key: "events",
    label: "Sự kiện",
    singular: "sự kiện",
    description: "Hội thảo, tọa đàm, sự kiện và lịch đăng ký.",
    table: "events",
    titleColumn: "title",
    subtitleColumn: "start_at",
    statusColumn: "status",
    slugColumn: "slug",
    searchColumns: ["title", "slug", "summary", "location"],
    orderBy: "start_at DESC, updated_at DESC",
    fields: [
      { key: "title", label: "Tên sự kiện", type: "text", required: true, list: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      baseStatusField,
      { key: "summary", label: "Tóm tắt", type: "textarea" },
      { key: "start_at", label: "Bắt đầu", type: "datetime", list: true },
      { key: "end_at", label: "Kết thúc", type: "datetime" },
      { key: "location", label: "Địa điểm", type: "text" },
      { key: "registration_url", label: "Link đăng ký", type: "url" },
      { key: "body", label: "Nội dung", type: "textarea" },
      baseSeoField,
    ],
  },
  media: {
    key: "media",
    label: "Media",
    singular: "media",
    description: "Thư viện ảnh, tài liệu và video qua URL HTTPS. Khóa lưu trữ được tạo tự động; tải tệp trực tiếp chưa được bật.",
    table: "media",
    titleColumn: "filename",
    subtitleColumn: "mime_type",
    searchColumns: ["filename", "storage_key", "alt", "caption", "public_url"],
    orderBy: "updated_at DESC",
    fields: [
      { key: "type", label: "Loại", type: "select", required: true, options: [
        { value: "image", label: "Ảnh" },
        { value: "document", label: "Tài liệu" },
        { value: "video", label: "Video" },
        { value: "other", label: "Khác" },
      ] },
      { key: "storage_key", label: "Storage key", type: "text", required: true, list: true },
      { key: "public_url", label: "URL công khai", type: "url", list: true },
      { key: "visibility", label: "Hiển thị", type: "select", required: true, options: [
        { value: "public", label: "Công khai" },
        { value: "private", label: "Riêng tư" },
      ] },
      { key: "filename", label: "Tên file", type: "text", list: true },
      { key: "mime_type", label: "MIME type", type: "text" },
      { key: "size_bytes", label: "Dung lượng (byte)", type: "number" },
      { key: "alt", label: "Alt text", type: "text" },
      { key: "caption", label: "Caption", type: "textarea" },
      { key: "metadata_json", label: "Metadata (JSON)", type: "json" },
    ],
  },
  navigation: {
    key: "navigation",
    label: "Menu điều hướng",
    singular: "mục menu",
    description: "Quản lý menu chính và thứ tự hiển thị trên website.",
    table: "navigation_items",
    titleColumn: "label",
    subtitleColumn: "href",
    searchColumns: ["label", "href", "group_name"],
    orderBy: "group_name ASC, sort_order ASC",
    fields: [
      { key: "label", label: "Nhãn", type: "text", required: true, list: true },
      { key: "href", label: "Đường dẫn", type: "text", required: true, list: true },
      { key: "group_name", label: "Nhóm", type: "text", required: true },
      { key: "parent_id", label: "Parent ID", type: "text" },
      { key: "sort_order", label: "Thứ tự", type: "number", list: true },
      { key: "is_active", label: "Đang hiển thị", type: "boolean", list: true },
      { key: "opens_new_tab", label: "Mở tab mới", type: "boolean" },
    ],
  },
  redirects: {
    key: "redirects",
    label: "Redirects",
    singular: "redirect",
    description: "Điều hướng URL cũ sang URL mới và kiểm soát mã trạng thái.",
    table: "redirects",
    titleColumn: "source_path",
    subtitleColumn: "destination_path",
    searchColumns: ["source_path", "destination_path"],
    orderBy: "created_at DESC",
    fields: [
      { key: "source_path", label: "URL nguồn", type: "text", required: true, list: true },
      { key: "destination_path", label: "URL đích", type: "text", required: true, list: true },
      { key: "status_code", label: "Mã HTTP", type: "select", required: true, options: [
        { value: "301", label: "301 — Permanent" },
        { value: "302", label: "302 — Temporary" },
        { value: "307", label: "307 — Temporary" },
        { value: "308", label: "308 — Permanent" },
      ] },
      { key: "is_active", label: "Kích hoạt", type: "boolean", list: true },
    ],
  },
  users: {
    key: "users",
    label: "Người dùng & Phân quyền",
    singular: "người dùng",
    description: "Quản trị người dùng CMS ánh xạ từ Cloudflare Access và vai trò nội bộ.",
    table: "admin_users",
    titleColumn: "display_name",
    subtitleColumn: "email",
    searchColumns: ["display_name", "email"],
    orderBy: "updated_at DESC",
    adminOnly: true,
    fields: [
      { key: "email", label: "Email", type: "email", required: true, list: true },
      { key: "display_name", label: "Tên hiển thị", type: "text", list: true },
      { key: "is_active", label: "Hoạt động", type: "boolean", list: true },
      { key: "roles", label: "Vai trò", type: "text", required: true, help: "Các mã vai trò cách nhau bằng dấu phẩy, ví dụ: admin,editor" },
    ],
  },
  leads: {
    key: "leads",
    label: "Liên hệ & Leads",
    singular: "lead",
    description: "Yêu cầu hợp tác, tư vấn và liên hệ gửi từ website.",
    table: "leads",
    titleColumn: "contact_name",
    subtitleColumn: "organization",
    statusColumn: "status",
    searchColumns: ["contact_name", "organization", "email", "phone", "message"],
    orderBy: "created_at DESC",
    allowCreate: false,
    allowDelete: false,
    fields: [
      { key: "contact_name", label: "Người liên hệ", type: "text", readonly: true, list: true },
      { key: "organization", label: "Đơn vị", type: "text", readonly: true, list: true },
      { key: "job_title", label: "Chức vụ", type: "text", readonly: true },
      { key: "phone", label: "Điện thoại", type: "text", readonly: true },
      { key: "email", label: "Email", type: "email", readonly: true },
      { key: "message", label: "Nội dung", type: "textarea", readonly: true },
      { key: "status", label: "Trạng thái", type: "select", list: true, options: leadStatusOptions },
      { key: "owner_id", label: "Phụ trách (User ID)", type: "text" },
      { key: "internal_notes", label: "Ghi chú nội bộ", type: "textarea" },
    ],
  },
  registrations: {
    key: "registrations",
    label: "Đăng ký khóa học",
    singular: "đăng ký",
    description: "Danh sách đăng ký đào tạo phát sinh từ website.",
    table: "course_registrations",
    titleColumn: "contact_name",
    subtitleColumn: "organization",
    statusColumn: "status",
    searchColumns: ["contact_name", "organization", "email", "phone"],
    orderBy: "created_at DESC",
    allowCreate: false,
    fields: [
      { key: "contact_name", label: "Người đăng ký", type: "text", readonly: true, list: true },
      { key: "organization", label: "Đơn vị", type: "text", readonly: true, list: true },
      { key: "job_title", label: "Chức vụ", type: "text", readonly: true },
      { key: "phone", label: "Điện thoại", type: "text", readonly: true },
      { key: "email", label: "Email", type: "email", readonly: true },
      { key: "course_id", label: "Course ID", type: "text", readonly: true },
      { key: "session_id", label: "Session ID", type: "text", readonly: true },
      { key: "status", label: "Trạng thái", type: "text", list: true },
      { key: "delivery_preference", label: "Hình thức mong muốn", type: "text", readonly: true },
      { key: "notes", label: "Ghi chú", type: "textarea", readonly: true },
    ],
  },
  audit: {
    key: "audit",
    label: "Nhật ký hệ thống",
    singular: "bản ghi",
    description: "Dấu vết thao tác quản trị và thay đổi quan trọng trong CMS.",
    table: "audit_logs",
    titleColumn: "action",
    subtitleColumn: "entity_type",
    searchColumns: ["action", "entity_type", "entity_id", "metadata_json"],
    orderBy: "created_at DESC",
    readOnly: true,
    allowCreate: false,
    allowDelete: false,
    adminOnly: true,
    fields: [
      { key: "action", label: "Hành động", type: "text", readonly: true, list: true },
      { key: "entity_type", label: "Loại đối tượng", type: "text", readonly: true, list: true },
      { key: "entity_id", label: "ID đối tượng", type: "text", readonly: true },
      { key: "actor_user_id", label: "Người thực hiện", type: "text", readonly: true },
      { key: "metadata_json", label: "Metadata", type: "json", readonly: true },
      { key: "created_at", label: "Thời điểm", type: "text", readonly: true, list: true },
    ],
  },
};

export const cmsModuleKeys = Object.keys(cmsModules);

export function getCmsModule(moduleKey: string): CmsModuleConfig | null {
  return cmsModules[moduleKey] ?? null;
}

export function isJsonField(field: CmsField) {
  return field.type === "json";
}
