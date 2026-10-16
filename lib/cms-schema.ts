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

export const registrationStatusOptions: CmsFieldOption[] = [
  { value: "submitted", label: "Mới đăng ký" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
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
    description: "Quản lý sản phẩm và nền tảng công nghệ; sản phẩm đã xuất bản xuất hiện trong danh mục công khai.",
    table: "products",
    titleColumn: "title",
    subtitleColumn: "category",
    statusColumn: "status",
    slugColumn: "slug",
    publishColumn: "published_at",
    searchColumns: ["title", "slug", "summary", "category"],
    orderBy: "featured DESC, updated_at DESC",
    fields: [
      { key: "title", label: "Tên sản phẩm", type: "text", required: true, list: true, placeholder: "Ví dụ: Nền tảng giám sát nông nghiệp IAICT", help: "Tên hiển thị trong danh mục và đầu trang chi tiết. Viết rõ sản phẩm hoặc nền tảng cụ thể." },
      { key: "slug", label: "Đường dẫn (slug)", type: "text", required: true, list: true, placeholder: "Để trống để tự tạo từ tên sản phẩm", help: "Ví dụ nen-tang-giam-sat. Chỉ dùng chữ thường không dấu, số và dấu gạch nối; tối đa 120 ký tự. Hạn chế đổi đường dẫn sau khi xuất bản." },
      { ...baseStatusField, help: "Bản nháp: đang soạn; Chờ duyệt: cần rà soát; Đã xuất bản: công khai trong danh mục khi lưu; Lưu trữ: ẩn khỏi website." },
      { key: "category", label: "Nhóm sản phẩm", type: "text", list: true, placeholder: "Ví dụ: IoT & Giám sát hiện trường", help: "Nhãn phân nhóm hiển thị trên trang chi tiết. Nên dùng cùng cách viết cho các sản phẩm cùng nhóm; không bắt buộc." },
      { key: "summary", label: "Mô tả ngắn", type: "textarea", required: true, placeholder: "Sản phẩm giải quyết bài toán gì và phục vụ ai?", help: "Giới thiệu trong 2–3 câu; dùng ở thẻ danh mục và đầu trang chi tiết. Nhập văn bản thuần, không dán mã HTML." },
      { key: "features_json", label: "Tính năng (JSON)", type: "json", help: "Nêu những việc sản phẩm làm được, ví dụ giám sát dữ liệu hoặc phát cảnh báo. Nhập danh sách chuỗi theo mẫu bên dưới; chưa có thì dùng []." },
      { key: "technologies_json", label: "Công nghệ (JSON)", type: "json", help: "Liệt kê công nghệ thực tế đang sử dụng, ví dụ IoT, AI hoặc Cloudflare. Nhập danh sách chuỗi theo mẫu bên dưới; chưa có thì dùng []." },
      { key: "benefits_json", label: "Lợi ích (JSON)", type: "json", help: "Nêu giá trị mang lại cho đơn vị sử dụng; chỉ ghi số liệu khi có căn cứ. Nhập danh sách chuỗi theo mẫu bên dưới; chưa có thì dùng []." },
      { key: "integration_notes", label: "Khả năng tích hợp", type: "textarea", placeholder: "Ví dụ: Kết nối qua API với hệ thống dữ liệu hiện có.", help: "Thông tin này hiển thị công khai trên trang chi tiết. Nêu điều kiện hoặc hình thức kết nối; không nhập khóa API, mật khẩu hay thông tin nội bộ." },
      { ...baseSeoField, label: "SEO nâng cao (JSON)", help: "Nhập title và description dạng chuỗi khi cần. Giữ {} để dùng tên sản phẩm và mô tả ngắn hiện có; xem mẫu bên dưới." },
      { key: "featured", label: "Sản phẩm nổi bật", type: "boolean", help: "Ưu tiên xếp trước trong danh mục công khai khi sản phẩm đã xuất bản. Không làm bản nháp tự xuất hiện trên website." },
    ],
  },
  solutions: {
    key: "solutions",
    label: "Giải pháp & Dịch vụ",
    singular: "giải pháp",
    description: "Quản lý giải pháp và dịch vụ; nội dung đã xuất bản xuất hiện trong danh mục công khai.",
    table: "solutions",
    titleColumn: "title",
    subtitleColumn: "slug",
    statusColumn: "status",
    slugColumn: "slug",
    publishColumn: "published_at",
    searchColumns: ["title", "slug", "summary", "problem"],
    orderBy: "featured DESC, updated_at DESC",
    fields: [
      { key: "title", label: "Tên giải pháp", type: "text", required: true, list: true, placeholder: "Ví dụ: Giải pháp giám sát rừng bằng IoT", help: "Tên hiển thị trong danh mục và đầu trang chi tiết. Nêu rõ giải pháp hoặc dịch vụ cụ thể." },
      { key: "slug", label: "Đường dẫn (slug)", type: "text", required: true, list: true, placeholder: "Để trống để tự tạo từ tên giải pháp", help: "Ví dụ giam-sat-rung-iot. Chỉ dùng chữ thường không dấu, số và dấu gạch nối; tối đa 120 ký tự. Hạn chế đổi sau khi xuất bản." },
      { ...baseStatusField, help: "Bản nháp: đang soạn; Chờ duyệt: cần rà soát; Đã xuất bản: công khai khi lưu; Lưu trữ: ẩn khỏi website." },
      { key: "summary", label: "Mô tả ngắn", type: "textarea", required: true, placeholder: "Giải pháp phục vụ ai và giải quyết vấn đề gì?", help: "Giới thiệu trong 2–3 câu; dùng ở thẻ danh mục và đầu trang chi tiết. Nhập văn bản thuần, không dán mã HTML." },
      { key: "problem", label: "Bài toán cần giải quyết", type: "textarea", placeholder: "Ví dụ: Dữ liệu hiện trường còn phân tán và khó theo dõi kịp thời.", help: "Nêu hiện trạng, khó khăn và nhu cầu của đơn vị sử dụng. Nội dung hiển thị công khai; không nhập thông tin nội bộ hoặc dữ liệu cá nhân chưa được phép công bố." },
      { key: "scope_json", label: "Phạm vi (JSON)", type: "json", help: "Liệt kê các hạng mục thực hiện; nêu rõ giới hạn để tránh hiểu nhầm phạm vi dịch vụ. Nhập danh sách chuỗi theo mẫu bên dưới; chưa có thì dùng []." },
      { key: "process_json", label: "Quy trình (JSON)", type: "json", help: "Nhập các bước theo thứ tự triển khai, ví dụ khảo sát, cấu hình và bàn giao. Nhập danh sách chuỗi theo mẫu bên dưới; chưa có thì dùng []." },
      { key: "deliverables_json", label: "Sản phẩm bàn giao (JSON)", type: "json", help: "Nêu đầu ra cụ thể đơn vị nhận được, ví dụ hệ thống đã cấu hình hoặc tài liệu hướng dẫn. Nhập danh sách chuỗi theo mẫu bên dưới; chưa có thì dùng []." },
      { key: "technologies_json", label: "Công nghệ (JSON)", type: "json", help: "Liệt kê công nghệ phù hợp với phương án triển khai, ví dụ IoT hoặc AI. Nhập danh sách chuỗi theo mẫu bên dưới; chưa có thì dùng []." },
      { ...baseSeoField, label: "SEO nâng cao (JSON)", help: "Nhập title và description dạng chuỗi khi cần. Giữ {} để dùng tên giải pháp và mô tả ngắn hiện có; xem mẫu bên dưới." },
      { key: "featured", label: "Giải pháp nổi bật", type: "boolean", help: "Ưu tiên xếp trước trong danh mục công khai khi đã xuất bản; không làm bản nháp tự xuất hiện trên website." },
    ],
  },
  courses: {
    key: "courses",
    label: "Đào tạo & Tập huấn",
    singular: "khóa học",
    description: "Quản lý chương trình khóa học; nội dung đã xuất bản xuất hiện trong danh mục Đào tạo & Tập huấn.",
    table: "courses",
    titleColumn: "title",
    subtitleColumn: "code",
    statusColumn: "status",
    slugColumn: "slug",
    publishColumn: "published_at",
    searchColumns: ["title", "slug", "code", "summary"],
    orderBy: "featured DESC, updated_at DESC",
    fields: [
      { key: "code", label: "Mã khóa học", type: "text", list: true, placeholder: "Ví dụ: AI-XA-01", help: "Mã nội bộ để phân biệt khóa học. Không bắt buộc; nếu nhập phải khác mã khóa học đã có." },
      { key: "title", label: "Tên khóa học", type: "text", required: true, list: true, placeholder: "Ví dụ: Ứng dụng AI trong công vụ cấp xã", help: "Tên hiển thị ở danh mục và đầu trang chi tiết. Nêu rõ chủ đề và đối tượng khi cần." },
      { key: "slug", label: "Đường dẫn (slug)", type: "text", required: true, placeholder: "Để trống để tự tạo từ tên khóa học", help: "Ví dụ ung-dung-ai-cap-xa. Dùng chữ thường không dấu, số và dấu gạch nối; tối đa 120 ký tự. Không dùng co-quan-nha-nuoc vì đã có trang riêng; hạn chế đổi sau khi xuất bản." },
      { ...baseStatusField, help: "Bản nháp: đang soạn; Chờ duyệt: cần rà soát; Đã xuất bản: công khai khi lưu; Lưu trữ: ẩn khỏi website. Xuất bản khóa học không tự mở lớp hay nhận đăng ký." },
      { key: "summary", label: "Mô tả ngắn", type: "textarea", required: true, placeholder: "Khóa học phục vụ ai và giúp áp dụng được điều gì?", help: "Giới thiệu trong 2–3 câu; dùng ở thẻ danh mục và đầu trang chi tiết. Nhập văn bản thuần, không dán mã HTML." },
      { key: "duration", label: "Thời lượng", type: "text", placeholder: "Ví dụ: 02 ngày / 12 tiết", help: "Nêu rõ số ngày, giờ hoặc tiết học. Đây là thời lượng chương trình; ngày tổ chức cụ thể cấu hình tại Lịch lớp." },
      { key: "level", label: "Cấp độ", type: "text", placeholder: "Ví dụ: Cơ bản hoặc chuyên sâu", help: "Mô tả mức độ và nền tảng kiến thức phù hợp với học viên; có thể để trống." },
      { key: "class_size", label: "Quy mô lớp", type: "text", placeholder: "Ví dụ: 25–30 học viên", help: "Quy mô dự kiến để giới thiệu chương trình. Số chỗ nhận đăng ký thực tế cấu hình tại Lịch lớp." },
      { key: "audiences_json", label: "Đối tượng (JSON)", type: "json", help: "Nêu nhóm học viên phù hợp, ví dụ lãnh đạo, chuyên viên hoặc giáo viên. Nhập danh sách chuỗi theo mẫu; chưa có thì dùng []." },
      { key: "topics_json", label: "Chủ đề (JSON)", type: "json", help: "Liệt kê các chủ đề chính được giới thiệu trong khóa học. Nhập danh sách chuỗi theo mẫu; chưa có thì dùng []." },
      { key: "objectives_json", label: "Mục tiêu (JSON)", type: "json", help: "Nêu những việc học viên có thể thực hiện sau khóa học. Nhập danh sách chuỗi theo mẫu; chưa có thì dùng []." },
      { key: "modules_json", label: "Chương trình (JSON)", type: "json", help: "Nhập các buổi hoặc chuyên đề theo đúng thứ tự giảng dạy. Nhập danh sách chuỗi theo mẫu; chưa có thì dùng []." },
      { key: "delivery_modes_json", label: "Hình thức (JSON)", type: "json", help: "Nêu hình thức tổ chức, ví dụ trực tiếp, trực tuyến hoặc kết hợp. Nhập danh sách chuỗi theo mẫu; chưa có thì dùng []." },
      { key: "materials_json", label: "Tài liệu (JSON)", type: "json", help: "Liệt kê tên tài liệu hoặc đường dẫn HTTPS có thể công khai. Nội dung hiển thị ở trang chi tiết; không nhập tài liệu nội bộ hoặc liên kết cần giữ riêng. Nhập danh sách chuỗi theo mẫu; chưa có thì dùng []." },
      { key: "certificate_note", label: "Thông tin chứng nhận", type: "textarea", placeholder: "Nêu hình thức và điều kiện chứng nhận nếu có.", help: "Thông tin hiển thị công khai. Chỉ ghi hình thức và điều kiện chứng nhận đã được đơn vị xác nhận; có thể để trống." },
      { ...baseSeoField, label: "SEO nâng cao (JSON)", help: "Nhập title và description dạng chuỗi khi cần. Giữ {} để dùng tên khóa học và mô tả ngắn hiện có; xem mẫu bên dưới." },
      { key: "featured", label: "Khóa học nổi bật", type: "boolean", help: "Ưu tiên xếp trước trong danh mục công khai khi đã xuất bản; không làm bản nháp tự xuất hiện trên website." },
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
      { key: "title", help: "Tên dự án hiển thị trong danh mục và đầu trang chi tiết. Nên ngắn gọn, dễ nhận diện.", label: "Tên dự án", type: "text", required: true, list: true },
      { key: "slug", help: "Để trống để tạo từ tên dự án. Chỉ dùng chữ thường không dấu, số và dấu gạch nối, tối đa 120 ký tự. tram-rung đã dành cho trang Trâm Rừng.", label: "Đường dẫn (slug)", type: "text", required: true, list: true },
      { ...baseStatusField, help: "Chỉ Đã xuất bản mới hiển thị công khai; Bản nháp, Chờ duyệt và Lưu trữ không hiển thị trong danh mục CMS." },
      { key: "summary", help: "Tóm tắt bài toán và giá trị của dự án; hiển thị trên thẻ danh mục và đầu trang chi tiết.", label: "Mô tả ngắn", type: "textarea", required: true },
      { key: "context", help: "Mô tả hiện trạng, đối tượng hưởng lợi và vấn đề cần giải quyết. Nhập văn bản thường.", label: "Bối cảnh", type: "textarea" },
      { key: "solution", help: "Mô tả phương án triển khai và cách giải quyết bài toán. Nhập văn bản thường, không dùng mã HTML.", label: "Giải pháp", type: "textarea" },
      { key: "scope_json", help: "Danh sách các hạng mục hoặc phạm vi triển khai. Mỗi mục là một chuỗi trong dấu ngoặc kép; chưa có thì giữ [].", label: "Phạm vi (JSON)", type: "json" },
      { key: "technologies_json", help: "Danh sách công nghệ thực tế sử dụng trong dự án, ví dụ [\"IoT\", \"Cơ sở dữ liệu\"]. Chưa có thì giữ [].", label: "Công nghệ (JSON)", type: "json" },
      { key: "results_json", help: "Chỉ ghi kết quả đã được kiểm chứng; nếu là mục tiêu dự kiến, ghi rõ trong nội dung. Dùng danh sách chuỗi văn bản; chưa có thì giữ [].", label: "Kết quả (JSON)", type: "json" },
      { key: "replication_potential", help: "Nêu điều kiện áp dụng, đối tượng phù hợp và khả năng mở rộng mô hình. Nhập văn bản thường.", label: "Khả năng nhân rộng", type: "textarea" },
      { ...baseSeoField, help: "Tùy chọn: đối tượng JSON có title và description là chuỗi văn bản. Giữ {} để dùng tên và mô tả dự án." },
      { key: "featured", help: "Bật để ưu tiên dự án đã xuất bản trong danh mục. Không tự xuất bản dự án.", label: "Nổi bật", type: "boolean" },
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
      { key: "name", help: "Họ và tên hiển thị trong danh sách và trang hồ sơ chuyên gia.", label: "Họ tên", type: "text", required: true, list: true },
      { key: "slug", help: "Để trống để tạo từ họ tên. Chỉ dùng chữ thường không dấu, số và dấu gạch nối, tối đa 120 ký tự.", label: "Đường dẫn (slug)", type: "text", required: true },
      { ...baseStatusField, help: "Chỉ hồ sơ Đã xuất bản xuất hiện công khai. Bản nháp, Chờ duyệt và Lưu trữ không hiển thị trên website." },
      { key: "title", help: "Học hàm, học vị hoặc chức danh chuyên môn được phép công bố.", label: "Chức danh", type: "text", list: true },
      { key: "bio", help: "Giới thiệu kinh nghiệm và hoạt động chuyên môn. Nhập văn bản thường; tách đoạn bằng một dòng trống.", label: "Giới thiệu", type: "textarea" },
      { key: "expertise_json", help: "Danh sách lĩnh vực chuyên môn, mỗi mục là chuỗi văn bản. Ví dụ [\"Trí tuệ nhân tạo\", \"Chuyển đổi số\"]. Chưa có thì dùng [].", label: "Chuyên môn (JSON)", type: "json" },
      { key: "photo_media_id", help: "Chọn ảnh Công khai có URL HTTPS trong Thư viện Media. Có thể để trống hoặc chọn Không chọn để bỏ ảnh.", label: "Ảnh đại diện", type: "text" },
      { key: "public_contacts_json", help: "Chỉ nhập thông tin được phép công bố. Dùng đối tượng JSON với giá trị là chuỗi văn bản; email phải hợp lệ, website dùng HTTPS. Chưa có thì giữ {}.", label: "Liên hệ công khai (JSON)", type: "json" },
      { ...baseSeoField, help: "Tùy chọn: title và description là chuỗi văn bản trong đối tượng JSON. Giữ {} để dùng thông tin hồ sơ." },
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
      { key: "name", help: "Tên đầy đủ hoặc tên giao dịch của đơn vị được phép công bố.", label: "Tên đơn vị", type: "text", required: true, list: true },
      { ...baseStatusField, help: "Chỉ Đã xuất bản mới xuất hiện trong danh sách đối tác. Bản nháp, Chờ duyệt và Lưu trữ không hiển thị công khai." },
      { key: "logo_media_id", help: "Chọn ảnh logo Công khai có URL HTTPS trong Thư viện Media. Chọn Không chọn để bỏ logo.", label: "Logo", type: "text" },
      { key: "summary", help: "Giới thiệu ngắn về đơn vị và lĩnh vực hợp tác. Nội dung hiển thị trong danh sách đối tác.", label: "Mô tả", type: "textarea" },
      { key: "website", help: "Website chính thức, dùng URL HTTPS đầy đủ, ví dụ https://example.com. Có thể để trống nếu không công bố liên kết.", label: "Website", type: "url", list: true },
      { key: "public_note", help: "Ghi chú bổ sung được hiển thị công khai cùng mô tả. Chỉ ghi thông tin được phép công bố; không nhập ghi chú nội bộ.", label: "Ghi chú công khai", type: "textarea" },
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
      { key: "title", help: "Tên hội thảo, tọa đàm hoặc hoạt động hiển thị trên website.", label: "Tên sự kiện", type: "text", required: true, list: true },
      { key: "slug", help: "Để trống để tạo từ tên sự kiện. Chỉ dùng chữ thường không dấu, số và dấu gạch nối, tối đa 120 ký tự.", label: "Đường dẫn (slug)", type: "text", required: true },
      { ...baseStatusField, help: "Chỉ Đã xuất bản mới hiển thị công khai. Bản nháp, Chờ duyệt và Lưu trữ không hiển thị; ngày tổ chức không tự đổi trạng thái." },
      { key: "summary", help: "Giới thiệu ngắn về chủ đề, đối tượng tham dự và giá trị của sự kiện.", label: "Tóm tắt", type: "textarea" },
      { key: "start_at", help: "Ngày, giờ bắt đầu theo giờ Việt Nam (UTC+7). Có thể để trống nếu chưa chốt lịch.", label: "Bắt đầu", type: "datetime", list: true },
      { key: "end_at", help: "Ngày, giờ kết thúc theo giờ Việt Nam (UTC+7); không được trước thời điểm bắt đầu.", label: "Kết thúc", type: "datetime" },
      { key: "location", help: "Tên địa điểm, địa chỉ hoặc hình thức trực tuyến. Ví dụ: Hội trường tầng 2, Hà Nội.", label: "Địa điểm", type: "text" },
      { key: "registration_url", help: "Liên kết HTTPS tới biểu mẫu đăng ký. Có thể để trống; trường này không tự tạo biểu mẫu hay tự gửi lời mời.", label: "Liên kết đăng ký", type: "url" },
      { key: "body", help: "Nội dung, chương trình và hướng dẫn tham dự. Nhập văn bản thường; tách đoạn bằng một dòng trống.", label: "Nội dung", type: "textarea" },
      { ...baseSeoField, help: "Tùy chọn: title và description là chuỗi văn bản trong đối tượng JSON. Giữ {} để dùng tên và tóm tắt sự kiện." },
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
    label: "Yêu cầu liên hệ",
    singular: "yêu cầu",
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
      { key: "contact_name", help: "Họ tên người gửi yêu cầu. Dữ liệu gốc chỉ xem, không sửa tại đây.", label: "Người liên hệ", type: "text", readonly: true, list: true },
      { key: "organization", help: "Cơ quan hoặc đơn vị người liên hệ cung cấp; có thể chưa có thông tin.", label: "Đơn vị", type: "text", readonly: true, list: true },
      { key: "job_title", help: "Chức vụ hoặc vị trí công tác do người liên hệ cung cấp.", label: "Chức vụ", type: "text", readonly: true },
      { key: "phone", help: "Số điện thoại để liên hệ xử lý yêu cầu; giữ nguyên theo hồ sơ gốc.", label: "Điện thoại", type: "text", readonly: true },
      { key: "email", help: "Email người gửi cung cấp. Lưu thay đổi tại đây không tự gửi email.", label: "Email", type: "email", readonly: true },
      { key: "message", help: "Nội dung yêu cầu ban đầu, chỉ xem. Ghi kết quả xử lý vào Ghi chú nội bộ bên dưới.", label: "Nội dung", type: "textarea", readonly: true },
      { key: "status", help: "Mới → Đã liên hệ → Đủ điều kiện → Hoàn thành. Chọn Đóng khi không tiếp tục xử lý; không xóa hồ sơ.", label: "Trạng thái xử lý", type: "select", required: true, list: true, options: leadStatusOptions },
      { key: "owner_id", help: "Chọn tài khoản CMS đang hoạt động hoặc Không chọn để bỏ phân công. Người phụ trách đã ngừng hoạt động có thể được giữ trong hồ sơ cũ; nên phân công lại để tiếp tục xử lý.", label: "Người phụ trách", type: "text" },
      { key: "internal_notes", help: "Ghi kết quả trao đổi và bước xử lý tiếp theo. Chỉ dùng nội bộ CMS, không gửi cho khách; nên ghi ngày và tên người cập nhật.", label: "Ghi chú nội bộ", type: "textarea", placeholder: "Ví dụ: 16/10 — Nguyễn A: Đã trao đổi nhu cầu, hẹn gửi phương án ngày 18/10." },
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
    allowDelete: false,
    fields: [
      { key: "contact_name", help: "Họ tên người gửi đăng ký. Dữ liệu gốc chỉ xem, không sửa tại đây.", label: "Người đăng ký", type: "text", readonly: true, list: true },
      { key: "organization", help: "Cơ quan hoặc đơn vị người đăng ký cung cấp; có thể để trống trong hồ sơ gốc.", label: "Đơn vị", type: "text", readonly: true, list: true },
      { key: "job_title", help: "Chức vụ hoặc vị trí công tác do người đăng ký cung cấp.", label: "Chức vụ", type: "text", readonly: true },
      { key: "phone", help: "Số điện thoại để liên hệ xác nhận nhu cầu; chỉ dùng trong quá trình xử lý đăng ký.", label: "Điện thoại", type: "text", readonly: true },
      { key: "email", help: "Địa chỉ email do người đăng ký cung cấp. Đổi trạng thái không tự gửi email.", label: "Email", type: "email", readonly: true },
      { key: "course_id", help: "Chương trình đã đăng ký. Đây là thông tin gốc, không đổi khóa học tại đây.", label: "Khóa học", type: "text", readonly: true },
      { key: "session_id", help: "Lịch lớp đã chọn, hiển thị theo giờ Việt Nam (UTC+7). Không chọn nghĩa là chưa gắn lịch cụ thể hoặc lịch đã được xóa.", label: "Lịch lớp", type: "text", readonly: true },
      { key: "status", help: "Mới đăng ký → Đã liên hệ → Đã xác nhận → Đã hoàn thành; chọn Đã hủy khi không tiếp tục. Trạng thái được lưu nội bộ, không tự gửi thông báo hay giữ chỗ.", label: "Trạng thái xử lý", type: "select", required: true, list: true, options: registrationStatusOptions },
      { key: "delivery_preference", help: "Nguyện vọng hình thức học do người đăng ký cung cấp; chưa phải lịch tổ chức đã xác nhận.", label: "Hình thức mong muốn", type: "text", readonly: true },
      { key: "notes", help: "Nội dung người đăng ký gửi kèm. Chỉ xem để bảo toàn hồ sơ gốc; không dùng làm ghi chú xử lý nội bộ.", label: "Ghi chú của người đăng ký", type: "textarea", readonly: true },
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
