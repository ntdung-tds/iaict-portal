// Examples are guidance only. They never replace an editor's saved data.
export const cmsJsonExamples: Record<string, unknown> = {
  seo_json: { title: "Giải pháp IoT của IAICT", description: "Giới thiệu giải pháp thu thập và giám sát dữ liệu hiện trường." },
  layout_json: { "Tổng quan": "Giới thiệu nội dung trang", "Thông tin bổ sung": "Nội dung cần làm rõ" },
  features_json: ["Giám sát dữ liệu theo thời gian thực", "Cảnh báo khi vượt ngưỡng"],
  technologies_json: ["IoT", "AI", "Cloudflare"],
  benefits_json: ["Giảm thời gian tổng hợp dữ liệu", "Hỗ trợ ra quyết định"],
  scope_json: ["Khảo sát hiện trạng", "Triển khai tại đơn vị"],
  process_json: ["Bước 1: Khảo sát", "Bước 2: Cấu hình", "Bước 3: Bàn giao"],
  deliverables_json: ["Hệ thống đã cấu hình", "Tài liệu hướng dẫn sử dụng"],
  results_json: ["Hoàn thành hệ thống giám sát", "Bàn giao tài liệu vận hành"],
  audiences_json: ["Cán bộ, công chức", "Lãnh đạo đơn vị"],
  topics_json: ["Ứng dụng AI trong công việc", "An toàn dữ liệu"],
  objectives_json: ["Biết soạn yêu cầu cho AI", "Kiểm tra kết quả trước khi sử dụng"],
  modules_json: ["Buổi 1: Tổng quan và thực hành", "Buổi 2: Bài tập theo vị trí việc làm"],
  delivery_modes_json: ["Trực tiếp", "Trực tuyến"],
  materials_json: ["Giáo trình học viên", "Phiếu bài tập thực hành"],
  expertise_json: ["Trí tuệ nhân tạo", "Chuyển đổi số"],
  public_contacts_json: { email: "lienhe@example.com", website: "https://example.com" },
  metadata_json: { credit: "IAICT", note: "Ảnh minh họa dự án" },
};

export function cmsJsonExample(key: string): string {
  return JSON.stringify(cmsJsonExamples[key] ?? [], null, 2);
}

export function cmsJsonInstruction(key: string): string {
  const isList = Array.isArray(cmsJsonExamples[key]);
  return isList
    ? 'Nhập danh sách trong dấu [ ]; mỗi mục đặt trong dấu ngoặc kép và ngăn cách bằng dấu phẩy. Chưa có dữ liệu thì dùng [].'
    : 'Nhập các cặp "tên trường": "nội dung" trong dấu { }, ngăn cách bằng dấu phẩy. Chưa cần cấu hình thì dùng {}.';
}
