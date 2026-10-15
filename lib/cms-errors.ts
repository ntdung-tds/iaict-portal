import { cmsModules } from "./cms-schema";

function normalizeCode(raw: string) {
  return raw.trim().replace(/^INVALID_CMS_/, "");
}

function fieldLabel(fieldKey: string) {
  for (const moduleConfig of Object.values(cmsModules)) {
    const field = moduleConfig.fields.find((entry) => entry.key === fieldKey);
    if (field) return field.label;
  }
  return fieldKey.replaceAll("_", " ");
}

const fixedMessages: Record<string, string> = {
  MODULE: "Module CMS không tồn tại hoặc không còn được hỗ trợ.",
  USE_DEDICATED_USER_MANAGER: "Vui lòng quản lý tài khoản tại mục Quản lý người dùng.",
  READ_ONLY: "Nội dung này đang ở chế độ chỉ đọc.",
  CREATE_DISABLED: "Không thể tạo mới dữ liệu trong mục này.",
  DELETE_DISABLED: "Không thể xóa dữ liệu trong mục này.",
  ID: "Không xác định được bản ghi cần xử lý.",
  ID_REQUIRED: "Vui lòng chọn bản ghi cần xử lý.",
  NOT_FOUND: "Không tìm thấy dữ liệu cần xử lý.",
  NO_FIELDS: "Không có thay đổi nào để lưu.",
  REGISTRATION_DELETE_DISABLED: "Đăng ký khóa học không được xóa trực tiếp. Hãy cập nhật trạng thái thay vì xóa.",
  USER_EMAIL: "Vui lòng nhập địa chỉ email hợp lệ.",
  USER_ROLES: "Vui lòng chọn ít nhất một vai trò cho người dùng.",
  USER_ROLE_UNKNOWN: "Có vai trò không hợp lệ. Vui lòng chọn lại từ danh sách vai trò của hệ thống.",
  USER_NOT_FOUND: "Không tìm thấy người dùng cần xử lý.",
  USER_SELF_DELETE: "Bạn không thể tự vô hiệu hóa tài khoản đang đăng nhập.",
  MEDIA_SOURCE_REQUIRED: "Vui lòng nhập URL công khai của ảnh, tài liệu hoặc video.",
  MEDIA_HTTPS_REQUIRED: "URL Media phải sử dụng HTTPS để có thể nhúng an toàn trên website.",
  MEDIA_URL_DUPLICATE: "URL Media này đã có trong thư viện. Vui lòng chọn bản ghi hiện có thay vì tạo trùng.",
  MEDIA_TYPE_MISMATCH: "Loại tệp đã chọn không phù hợp với định dạng được suy ra từ URL hoặc tên tệp. Vui lòng kiểm tra lại loại Media.",
  MEDIA_SIZE_INVALID: "Dung lượng Media phải là số nguyên không âm tính theo byte.",
};

export function cmsErrorCode(raw: string) {
  return normalizeCode(raw);
}

export function translateCmsError(raw: string) {
  const message = raw?.trim?.() || "";
  const code = normalizeCode(message);

  const required = code.match(/^FIELD_(.+)_REQUIRED$/);
  if (required) {
    const key = required[1].toLowerCase();
    return `Vui lòng nhập ${fieldLabel(key).toLowerCase()}.`;
  }

  const number = code.match(/^FIELD_(.+)_NUMBER$/);
  if (number) {
    const key = number[1].toLowerCase();
    return `${fieldLabel(key)} phải là một số hợp lệ.`;
  }

  const json = code.match(/^FIELD_(.+)_JSON$/);
  if (json) {
    const key = json[1].toLowerCase();
    return `Dữ liệu JSON ở trường ${fieldLabel(key)} không hợp lệ.`;
  }

  const url = code.match(/^FIELD_(.+)_URL$/);
  if (url) {
    const key = url[1].toLowerCase();
    return `${fieldLabel(key)} phải là URL hợp lệ bắt đầu bằng http:// hoặc https://.`;
  }

  const email = code.match(/^FIELD_(.+)_EMAIL$/);
  if (email) {
    const key = email[1].toLowerCase();
    return `${fieldLabel(key)} không đúng định dạng email.`;
  }

  if (/UNIQUE constraint failed/i.test(message)) {
    return "Dữ liệu này đã tồn tại. Vui lòng kiểm tra lại các trường không được phép trùng lặp.";
  }
  if (/NOT NULL constraint failed/i.test(message)) {
    return "Còn thiếu dữ liệu bắt buộc. Vui lòng kiểm tra lại các trường có dấu *.";
  }
  if (/FOREIGN KEY constraint failed/i.test(message)) {
    return "Dữ liệu tham chiếu không còn tồn tại hoặc chưa hợp lệ. Vui lòng kiểm tra lại lựa chọn liên quan.";
  }

  return fixedMessages[code] ?? "Không thể hoàn tất thao tác. Vui lòng kiểm tra dữ liệu và thử lại.";
}
