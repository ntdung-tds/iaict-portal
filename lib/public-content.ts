export type NavigationItem = {
  label: string;
  href: string;
};

export type TaxonomyCard = {
  title: string;
  summary: string;
  href?: string;
};

export const mainNavigation: NavigationItem[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Sản phẩm & Nền tảng", href: "/san-pham-nen-tang" },
  { label: "Giải pháp & Dịch vụ", href: "/giai-phap-dich-vu" },
  { label: "Chuyển giao công nghệ", href: "/chuyen-giao-cong-nghe" },
  { label: "Đào tạo & Tập huấn", href: "/dao-tao-tap-huan" },
  { label: "Dự án tiêu biểu", href: "/du-an" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Liên hệ & Hợp tác", href: "/lien-he" },
];

export const pillars: TaxonomyCard[] = [
  { title: "IAICT Technology", summary: "Sản phẩm, nền tảng, IoT, AI, dữ liệu và phần mềm.", href: "/san-pham-nen-tang" },
  { title: "IAICT Solutions", summary: "Tư vấn, thiết kế, tích hợp, triển khai và vận hành.", href: "/giai-phap-dich-vu" },
  { title: "IAICT Transfer", summary: "Nghiên cứu ứng dụng, thử nghiệm, hoàn thiện và chuyển giao.", href: "/chuyen-giao-cong-nghe" },
  { title: "IAICT Academy", summary: "Đào tạo, tập huấn và bồi dưỡng năng lực số.", href: "/dao-tao-tap-huan" },
];

export const intentCards: TaxonomyCard[] = [
  { title: "Tư vấn chuyển đổi số", summary: "Khảo sát bài toán và lựa chọn lộ trình phù hợp.", href: "/giai-phap-dich-vu" },
  { title: "Xây dựng nền tảng", summary: "Phát triển nền tảng và phần mềm theo yêu cầu.", href: "/san-pham-nen-tang" },
  { title: "AI & Dữ liệu", summary: "Ứng dụng AI, dữ liệu và tự động hóa vào công việc.", href: "/san-pham-nen-tang#ai-du-lieu" },
  { title: "IoT & Quan trắc", summary: "Thu thập, kết nối và khai thác dữ liệu hiện trường.", href: "/san-pham-nen-tang#iot-quan-trac" },
  { title: "Chuyển giao công nghệ", summary: "Thử nghiệm, hoàn thiện và làm chủ giải pháp.", href: "/chuyen-giao-cong-nghe" },
  { title: "Đào tạo & Tập huấn", summary: "Chương trình theo nhóm đối tượng và nhu cầu thực tế.", href: "/dao-tao-tap-huan" },
  { title: "Tổ chức lớp cho cơ quan", summary: "Khung chương trình dành cho cơ quan nhà nước.", href: "/dao-tao-tap-huan/co-quan-nha-nuoc" },
  { title: "Hợp tác dự án", summary: "Trao đổi nhu cầu nghiên cứu, triển khai và đồng hành.", href: "/lien-he" },
];

export const productGroups: TaxonomyCard[] = [
  { title: "Nông – Lâm nghiệp thông minh", summary: "Nền tảng số cho quản lý, giám sát và khai thác dữ liệu ngành." },
  { title: "IoT & Quan trắc", summary: "Kết nối thiết bị, cảm biến và dữ liệu quan trắc." },
  { title: "Truy xuất nguồn gốc", summary: "Quản lý thông tin nguồn gốc và chuỗi dữ liệu liên quan." },
  { title: "Quản lý vòng đời", summary: "Theo dõi đối tượng, tài sản hoặc sản phẩm theo vòng đời." },
  { title: "AI & Dữ liệu", summary: "Khai thác dữ liệu và ứng dụng AI theo bài toán cụ thể." },
  { title: "Nền tảng/ứng dụng khác", summary: "Giải pháp có thể tùy biến và tích hợp theo yêu cầu." },
];

export const solutionGroups: TaxonomyCard[] = [
  { title: "Tư vấn chuyển đổi số", summary: "Đánh giá hiện trạng, mục tiêu và lộ trình thực hiện." },
  { title: "Tư vấn giải pháp công nghệ", summary: "Lựa chọn kiến trúc và phương án phù hợp bài toán." },
  { title: "Thiết kế hệ thống", summary: "Thiết kế kiến trúc, dữ liệu, tích hợp và vận hành." },
  { title: "AI & Dữ liệu", summary: "Thiết kế luồng dữ liệu và ứng dụng AI có kiểm soát." },
  { title: "IoT & Tự động hóa", summary: "Kết nối thiết bị, dữ liệu hiện trường và quy trình." },
  { title: "Phần mềm theo yêu cầu", summary: "Phát triển ứng dụng phục vụ quy trình nghiệp vụ cụ thể." },
  { title: "Tích hợp & Vận hành", summary: "Kết nối hệ thống, chuyển giao và hỗ trợ vận hành." },
];

export const newsCategories = [
  "Tin hoạt động Viện",
  "Khoa học & Công nghệ",
  "Chuyển đổi số",
  "AI & Dữ liệu",
  "IoT & Tự động hóa",
  "Nông – Lâm nghiệp thông minh",
  "Đào tạo & Tập huấn",
  "Chính sách & Văn bản",
  "Sự kiện – Hội thảo",
];

export const transferSteps: TaxonomyCard[] = [
  { title: "Khảo sát", summary: "Làm rõ bài toán, hiện trạng và điều kiện ứng dụng." },
  { title: "Thử nghiệm", summary: "Xây dựng mô hình thử nghiệm và tiêu chí đánh giá." },
  { title: "Hoàn thiện", summary: "Điều chỉnh giải pháp dựa trên bằng chứng thử nghiệm." },
  { title: "Chuyển giao", summary: "Bàn giao công nghệ, tài liệu và hướng dẫn vận hành." },
  { title: "Đồng hành", summary: "Hỗ trợ mở rộng, tích hợp và nâng cao năng lực sử dụng." },
];

export const governmentAudiences: TaxonomyCard[] = [
  { title: "Cấp tỉnh", summary: "Nhóm nội dung phục vụ quản trị và chuyển đổi số cấp tỉnh." },
  { title: "Sở/Ban/Ngành", summary: "Chương trình gắn với nghiệp vụ chuyên ngành." },
  { title: "Xã/Phường", summary: "Kỹ năng số, dữ liệu và AI gắn với công vụ cấp cơ sở." },
  { title: "Đơn vị sự nghiệp", summary: "Ứng dụng công nghệ và dữ liệu trong cung cấp dịch vụ." },
  { title: "Lãnh đạo/Quản lý", summary: "Tư duy, quản trị và ra quyết định trong môi trường số." },
  { title: "Chuyên viên", summary: "Kỹ năng và công cụ số phục vụ công việc hằng ngày." },
];
