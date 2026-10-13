export type PublicationType = "news" | "insight" | "notice" | "event";

export type PublicationSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type Publication = {
  slug: string;
  type: PublicationType;
  category: string;
  publishedAt: string;
  readingTime: string;
  title: string;
  excerpt: string;
  lede: string;
  featured?: boolean;
  keywords: string[];
  sections: PublicationSection[];
};

export const publications: Publication[] = [
  {
    slug: "tram-rung-tu-du-lieu-hien-truong-den-nen-tang-quan-ly-so",
    type: "news",
    category: "Dự án ứng dụng",
    publishedAt: "2026-10-13",
    readingTime: "4 phút đọc",
    title: "Trâm Rừng: từ dữ liệu hiện trường đến nền tảng quản lý số",
    excerpt: "IAICT tổ chức mô hình Trâm Rừng theo chuỗi cảm biến hiện trường, kết nối 4G, máy chủ dữ liệu, truy xuất nguồn gốc và quản lý vòng đời.",
    lede: "Trâm Rừng là một ví dụ cho cách IAICT tiếp cận bài toán ứng dụng công nghệ: bắt đầu từ điều kiện hiện trường, ưu tiên dữ liệu có thể thu nhận ổn định, sau đó mới mở rộng sang quản lý, truy xuất và khai thác dữ liệu.",
    featured: true,
    keywords: ["Trâm Rừng", "IoT", "rừng phòng hộ", "4G", "cảm biến", "truy xuất nguồn gốc", "quản lý vòng đời"],
    sections: [
      {
        heading: "Bài toán triển khai",
        paragraphs: [
          "Môi trường ngoài trời đặt ra yêu cầu khác biệt so với một hệ thống phần mềm thuần túy: thiết bị phải phù hợp điều kiện hiện trường, nguồn điện cần ổn định, kết nối phải có phương án dự phòng và dữ liệu phải được đưa về máy chủ theo cách dễ giám sát.",
          "Vì vậy, kiến trúc được tổ chức thành các lớp rõ ràng để từng thành phần có thể được kiểm tra, thay thế hoặc mở rộng mà không làm thay đổi toàn bộ hệ thống.",
        ],
      },
      {
        heading: "Chuỗi dữ liệu cốt lõi",
        bullets: [
          "Cảm biến và thiết bị IoT thu nhận thông số tại hiện trường.",
          "Gateway tập trung dữ liệu và truyền qua kết nối 4G khi cần.",
          "Máy chủ tiếp nhận, lưu trữ và tổ chức dữ liệu phục vụ khai thác lâu dài.",
          "Lớp ứng dụng hỗ trợ quản lý, truy xuất nguồn gốc và quản lý vòng đời.",
        ],
      },
      {
        heading: "Nguyên tắc của IAICT",
        paragraphs: [
          "IAICT ưu tiên khả năng vận hành và làm chủ hệ thống hơn việc đưa quá nhiều công nghệ vào cùng một thời điểm. Mỗi thành phần phải trả lời được một nhu cầu cụ thể và có thể kiểm chứng bằng dữ liệu thực tế.",
        ],
      },
    ],
  },
  {
    slug: "kien-truc-iot-tu-cam-bien-den-du-lieu-quan-ly",
    type: "insight",
    category: "IoT & Dữ liệu",
    publishedAt: "2026-10-12",
    readingTime: "5 phút đọc",
    title: "Kiến trúc IoT thực dụng: từ cảm biến đến dữ liệu quản lý",
    excerpt: "Một hệ thống IoT tốt không chỉ là tập hợp cảm biến; giá trị nằm ở chuỗi thu thập, truyền, lưu, giám sát và khai thác dữ liệu.",
    lede: "Khi triển khai IoT ngoài thực địa, việc lựa chọn cảm biến chỉ là một phần nhỏ. Kiến trúc cần được nhìn như một chuỗi dữ liệu liên tục từ thiết bị đến người sử dụng cuối cùng.",
    keywords: ["IoT", "cảm biến", "gateway", "4G", "server", "database", "quan trắc"],
    sections: [
      {
        heading: "Bốn lớp nên được tách rõ",
        bullets: [
          "Lớp hiện trường: cảm biến, thiết bị đo và bộ nguồn.",
          "Lớp kết nối: gateway, mạng truyền dẫn và cơ chế đồng bộ.",
          "Lớp dữ liệu: máy chủ, cơ sở dữ liệu, sao lưu và giám sát.",
          "Lớp ứng dụng: dashboard, cảnh báo, báo cáo và tích hợp nghiệp vụ.",
        ],
      },
      {
        heading: "Thiết kế cho điều kiện thật",
        paragraphs: [
          "Một kiến trúc có giá trị khi vẫn hoạt động trong điều kiện mạng không ổn định, nguồn điện gián đoạn hoặc phải thay thế một phần thiết bị. Vì thế, khả năng ghi đệm, gửi lại dữ liệu, giám sát trạng thái và bảo trì tại chỗ cần được tính ngay từ đầu.",
        ],
      },
    ],
  },
  {
    slug: "khung-dao-tao-ai-du-lieu-cho-co-quan-nha-nuoc",
    type: "news",
    category: "Đào tạo & Tập huấn",
    publishedAt: "2026-10-11",
    readingTime: "4 phút đọc",
    title: "IAICT xây dựng khung đào tạo AI và dữ liệu cho cơ quan nhà nước",
    excerpt: "Khung chương trình được tổ chức theo cấp quản lý, nhóm vị trí công việc và tình huống công vụ thay vì chỉ dạy công cụ đơn lẻ.",
    lede: "IAICT định hướng đào tạo theo nguyên tắc học để dùng được trong công việc: mỗi chuyên đề gắn với nhóm đối tượng, mục tiêu đầu ra và tình huống nghiệp vụ cụ thể.",
    keywords: ["đào tạo", "AI", "dữ liệu", "cơ quan nhà nước", "công vụ", "GenAI"],
    sections: [
      {
        heading: "Phân nhóm theo người học",
        bullets: [
          "Lãnh đạo và quản lý: tư duy số, quản trị, dữ liệu và ra quyết định.",
          "Chuyên viên: AI trong tham mưu, tổng hợp, soạn thảo và xử lý công việc.",
          "Cấp xã/phường: kỹ năng số, dữ liệu và công cụ AI gắn với công vụ cơ sở.",
          "Đơn vị sự nghiệp: ứng dụng công nghệ trong cung cấp dịch vụ và nghiệp vụ chuyên môn.",
        ],
      },
      {
        heading: "Không tách rời quản trị rủi ro",
        paragraphs: [
          "Các nội dung AI được đặt cùng yêu cầu kiểm chứng, bảo vệ dữ liệu, phân quyền sử dụng và trách nhiệm của người dùng. Mục tiêu là tăng năng suất nhưng vẫn giữ kiểm soát đối với thông tin và quyết định công vụ.",
        ],
      },
    ],
  },
  {
    slug: "iaict-hoan-thien-phien-ban-moi-cong-thong-tin-dien-tu",
    type: "news",
    category: "Tin hoạt động Viện",
    publishedAt: "2026-10-13",
    readingTime: "3 phút đọc",
    title: "IAICT hoàn thiện phiên bản mới của cổng thông tin điện tử",
    excerpt: "Cổng thông tin mới được tổ chức theo bốn trụ cột Technology, Solutions, Transfer và Academy, đồng thời ưu tiên khả năng tìm kiếm và mở rộng dữ liệu nội dung.",
    lede: "Phiên bản mới của cổng thông tin IAICT được xây dựng theo hướng một điểm truy cập cho năng lực công nghệ, giải pháp triển khai, chuyển giao và đào tạo của Viện.",
    keywords: ["IAICT", "cổng thông tin", "website", "Technology", "Solutions", "Transfer", "Academy"],
    sections: [
      {
        heading: "Từ website giới thiệu sang cổng thông tin",
        paragraphs: [
          "Thay vì chỉ trình bày thông tin tĩnh, kiến trúc mới chuẩn bị sẵn lớp dữ liệu cho bài viết, dự án, chương trình đào tạo và tìm kiếm nội dung công khai. Các nhóm thông tin được tách rõ để người dùng đi vào website từ chính nhu cầu của mình.",
        ],
      },
      {
        heading: "Bốn trụ cột nội dung",
        bullets: [
          "IAICT Technology: sản phẩm, nền tảng, AI, dữ liệu và IoT.",
          "IAICT Solutions: tư vấn, thiết kế, tích hợp, triển khai và vận hành.",
          "IAICT Transfer: nghiên cứu ứng dụng, thử nghiệm, hoàn thiện và chuyển giao.",
          "IAICT Academy: đào tạo, tập huấn và bồi dưỡng năng lực số.",
        ],
      },
    ],
  },
  {
    slug: "quy-trinh-chuyen-giao-cong-nghe-5-buoc",
    type: "insight",
    category: "Chuyển giao công nghệ",
    publishedAt: "2026-10-10",
    readingTime: "4 phút đọc",
    title: "Quy trình chuyển giao công nghệ 5 bước của IAICT",
    excerpt: "Khảo sát, thử nghiệm, hoàn thiện, chuyển giao và đồng hành là năm lớp công việc giúp một giải pháp đi từ ý tưởng đến khả năng vận hành.",
    lede: "Chuyển giao công nghệ không kết thúc ở việc bàn giao phần mềm hoặc thiết bị. Mục tiêu cuối cùng là đơn vị tiếp nhận có thể hiểu, sử dụng, vận hành và tiếp tục phát triển giải pháp.",
    keywords: ["chuyển giao công nghệ", "khảo sát", "thử nghiệm", "bàn giao", "vận hành"],
    sections: [
      {
        heading: "Năm bước triển khai",
        bullets: [
          "Khảo sát: làm rõ bài toán, hiện trạng và điều kiện ứng dụng.",
          "Thử nghiệm: xây dựng mô hình và tiêu chí đánh giá.",
          "Hoàn thiện: điều chỉnh giải pháp dựa trên bằng chứng thử nghiệm.",
          "Chuyển giao: bàn giao công nghệ, tài liệu và hướng dẫn vận hành.",
          "Đồng hành: hỗ trợ mở rộng, tích hợp và nâng cao năng lực sử dụng.",
        ],
      },
    ],
  },
  {
    slug: "tiep-nhan-nhu-cau-hop-tac-du-an-dao-tao-chuyen-giao",
    type: "notice",
    category: "Thông báo hợp tác",
    publishedAt: "2026-10-09",
    readingTime: "2 phút đọc",
    title: "IAICT tiếp nhận nhu cầu hợp tác dự án, đào tạo và chuyển giao công nghệ",
    excerpt: "Cơ quan, tổ chức và doanh nghiệp có thể trao đổi trực tiếp với IAICT từ bài toán, hiện trạng và kết quả mong muốn trước khi xác định phạm vi công nghệ.",
    lede: "IAICT tiếp nhận các nhu cầu tư vấn, triển khai, nghiên cứu ứng dụng, chuyển giao công nghệ và đào tạo theo hướng bắt đầu từ bài toán thực tế thay vì bắt đầu từ một sản phẩm cố định.",
    keywords: ["hợp tác", "liên hệ", "dự án", "đào tạo", "chuyển giao", "tư vấn"],
    sections: [
      {
        heading: "Thông tin nên chuẩn bị",
        bullets: [
          "Bài toán hoặc nhu cầu cần giải quyết.",
          "Đối tượng sử dụng và phạm vi dự kiến.",
          "Hạ tầng, dữ liệu hoặc hệ thống hiện có.",
          "Mốc thời gian hoặc kết quả mong muốn.",
        ],
      },
      {
        paragraphs: [
          "Từ các thông tin ban đầu, IAICT có thể cùng đơn vị làm rõ phạm vi và lựa chọn hướng tiếp cận phù hợp trước khi đi vào thiết kế chi tiết.",
        ],
      },
    ],
  },
];

export const featuredPublication = publications.find((item) => item.featured) ?? publications[0];

export function getPublication(slug: string) {
  return publications.find((item) => item.slug === slug);
}

export function getPublicationTypeLabel(type: PublicationType) {
  if (type === "insight") return "Góc nhìn chuyên môn";
  if (type === "notice") return "Thông báo";
  if (type === "event") return "Sự kiện";
  return "Tin IAICT";
}

export function formatPublicationDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
}
