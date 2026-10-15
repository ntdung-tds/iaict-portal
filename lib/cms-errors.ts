import { cmsModules } from "./cms-schema";

function normalizeCode(raw: string) {
  return raw.trim().replace(/^INVALID_(?:CMS|ARTICLE|SESSION)_/, "");
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
  USER_ID: "Vui lòng chọn người dùng cần xử lý.",
  USER_SELF_DELETE: "Bạn không thể tự vô hiệu hóa tài khoản đang đăng nhập.",
  USER_SELF_EMAIL_CHANGE: "Không thể đổi email của chính tài khoản đang đăng nhập vì email đang được dùng để ánh xạ Cloudflare Access.",
  USER_SELF_DEACTIVATE: "Bạn không thể tự vô hiệu hóa tài khoản đang đăng nhập.",
  USER_SELF_ADMIN_REMOVE: "Bạn không thể tự gỡ vai trò Quản trị viên khỏi tài khoản đang đăng nhập.",
  USER_EMAIL_IN_USE: "Email này đã được gán cho một người dùng CMS khác.",
  LAST_ACTIVE_ADMIN: "Không thể thực hiện vì hệ thống phải luôn còn ít nhất một Quản trị viên đang hoạt động.",

  PRODUCT_SLUG_INVALID: "Đường dẫn sản phẩm chỉ dùng chữ thường không dấu, số, dấu gạch nối và tối đa 120 ký tự. Có thể để trống để tạo từ tên sản phẩm.",
  PRODUCT_JSON_OBJECT_REQUIRED: "SEO phải là đối tượng JSON trong dấu { }. Nếu chưa dùng, nhập {}.",
  PRODUCT_SEO_TEXT_REQUIRED: "title và description trong SEO phải là chuỗi văn bản đặt trong dấu ngoặc kép.",
  PRODUCT_LIST_TEXT_REQUIRED: "Tính năng, Công nghệ và Lợi ích phải là danh sách chuỗi văn bản trong dấu [ ]. Nếu chưa dùng, nhập [].",
  PAGE_SLUG_INVALID: "Đường dẫn trang chỉ dùng chữ thường không dấu, số, dấu gạch nối và tối đa 120 ký tự. Có thể để trống để tạo từ tiêu đề.",
  PAGE_JSON_OBJECT_REQUIRED: "SEO và Thông tin bổ sung phải là đối tượng JSON trong dấu { }. Nếu chưa dùng, nhập {}.",
  PAGE_SEO_TEXT_REQUIRED: "title và description trong SEO phải là chuỗi văn bản đặt trong dấu ngoặc kép.",
  PAGE_HERO_PUBLIC_REQUIRED: "Ảnh đại diện phải là ảnh Công khai có URL HTTPS trong Thư viện Media. Vui lòng chọn lại hoặc bỏ chọn ảnh.",
  MEDIA_SOURCE_REQUIRED: "Vui lòng nhập URL công khai của ảnh, tài liệu hoặc video.",
  MEDIA_URL_DUPLICATE: "URL Media này đã có trong thư viện. Vui lòng chọn bản ghi hiện có thay vì tạo trùng.",
  MEDIA_TYPE_MISMATCH: "Loại tệp đã chọn không phù hợp với định dạng được suy ra từ URL hoặc tên tệp.",
  MEDIA_SIZE_INVALID: "Dung lượng Media phải là số nguyên không âm tính theo byte.",

  EVENT_END_BEFORE_START: "Thời gian kết thúc sự kiện phải sau thời gian bắt đầu.",
  REDIRECT_SOURCE_PATH: "URL nguồn phải là đường dẫn nội bộ bắt đầu bằng dấu /, ví dụ /trang-cu.",
  REDIRECT_LOOP: "URL nguồn và URL đích không được giống nhau.",
  NAVIGATION_SELF_PARENT: "Một mục menu không thể tự chọn chính nó làm mục cha.",
  NAVIGATION_PARENT_NOT_FOUND: "Mục menu cha không còn tồn tại. Vui lòng chọn lại.",
  NAVIGATION_SORT_ORDER: "Thứ tự menu phải là số nguyên không âm.",
  LEAD_OWNER_NOT_FOUND: "Người phụ trách không tồn tại hoặc đã bị vô hiệu hóa.",

  CATEGORY_REQUIRED: "Vui lòng nhập tên chuyên mục.",
  CATEGORY_NOT_FOUND: "Không tìm thấy chuyên mục cần xử lý.",
  CATEGORY_IN_USE: "Không thể xóa chuyên mục đang có bài viết. Hãy chuyển bài viết sang chuyên mục khác trước.",
  REQUIRED_FIELDS: "Vui lòng nhập đầy đủ tiêu đề, chuyên mục và nội dung bài viết.",
  STATUS: "Trạng thái đã chọn không hợp lệ.",
  TAGS_JSON: "Danh sách thẻ của bài viết chưa hợp lệ.",
  SEO_JSON: "Dữ liệu SEO của bài viết chưa hợp lệ.",
  HERO_MEDIA_NOT_FOUND: "Ảnh đại diện đã chọn không còn tồn tại.",
  HERO_MEDIA_IMAGE_REQUIRED: "Ảnh đại diện bài viết phải là Media loại Ảnh.",

  COURSE_REQUIRED: "Vui lòng chọn khóa học cho phiên đào tạo.",
  COURSE_NOT_FOUND: "Khóa học đã chọn không còn tồn tại.",
  CAPACITY: "Sức chứa phải là số nguyên không âm.",
  END_BEFORE_START: "Thời gian kết thúc lớp phải sau thời gian bắt đầu.",
  REGISTRATION_CLOSE_BEFORE_OPEN: "Thời gian đóng đăng ký phải sau thời gian mở đăng ký.",
  ONLINE_URL: "URL học trực tuyến chưa đúng định dạng.",

  ORGANIZATION_NAME_REQUIRED: "Vui lòng nhập tên tổ chức.",
  CONTACT_EMAIL_INVALID: "Email liên hệ chưa đúng định dạng.",
  SOCIAL_LINK_INVALID: "Có liên kết mạng xã hội chưa đúng định dạng URL HTTPS.",

  REVISION_ID_REQUIRED: "Vui lòng chọn phiên bản cần khôi phục.",
  REVISION_NOT_FOUND: "Không tìm thấy phiên bản cần khôi phục.",
  REVISION_NOT_RESTORABLE: "Loại dữ liệu này không hỗ trợ khôi phục tự động.",
  REVISION_SNAPSHOT_INVALID: "Dữ liệu snapshot của phiên bản bị lỗi và không thể khôi phục tự động.",
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

  const https = code.match(/^FIELD_(.+)_HTTPS$/);
  if (https) {
    const key = https[1].toLowerCase();
    return `${fieldLabel(key)} phải sử dụng HTTPS để có thể dùng an toàn trên website.`;
  }

  const email = code.match(/^FIELD_(.+)_EMAIL$/);
  if (email) {
    const key = email[1].toLowerCase();
    return `${fieldLabel(key)} không đúng định dạng email.`;
  }

  const dateTime = code.match(/^FIELD_(.+)_DATETIME$/);
  if (dateTime) {
    const key = dateTime[1].toLowerCase();
    return `${fieldLabel(key)} không đúng định dạng ngày giờ.`;
  }

  const option = code.match(/^FIELD_(.+)_OPTION$/);
  if (option) {
    const key = option[1].toLowerCase();
    return `Giá trị đã chọn cho ${fieldLabel(key).toLowerCase()} không hợp lệ.`;
  }

  const mediaNotFound = code.match(/^FIELD_(.+)_NOT_FOUND$/);
  if (mediaNotFound) {
    const key = mediaNotFound[1].toLowerCase();
    return `${fieldLabel(key)} đã chọn không còn tồn tại.`;
  }

  const imageRequired = code.match(/^FIELD_(.+)_IMAGE_REQUIRED$/);
  if (imageRequired) {
    const key = imageRequired[1].toLowerCase();
    return `${fieldLabel(key)} phải chọn Media loại Ảnh.`;
  }

  if (code.startsWith("USER_ROLE_NOT_SEEDED_")) {
    return "Danh mục vai trò trong cơ sở dữ liệu chưa đồng bộ. Vui lòng liên hệ Quản trị viên hệ thống.";
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
