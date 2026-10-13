"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SearchPublication = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  keywords: string[];
  coverImage?: {
    src: string;
    alt: string;
  };
};

type SearchItem = {
  title: string;
  summary: string;
  href: string;
  category: "Sản phẩm" | "Giải pháp" | "Đào tạo" | "Dự án" | "Thông tin";
  keywords: string;
  image?: {
    src: string;
    alt: string;
  };
};

const baseSearchIndex: SearchItem[] = [
  { title: "Giới thiệu IAICT", summary: "Định hướng nghiên cứu ứng dụng, bốn trụ cột năng lực và cách IAICT tiếp cận một bài toán triển khai.", href: "/gioi-thieu", category: "Thông tin", keywords: "viện giới thiệu nghiên cứu ứng dụng công nghệ chuyển giao academy technology solutions" },
  { title: "Sản phẩm & Nền tảng", summary: "Các nhóm nền tảng, IoT, AI, dữ liệu, truy xuất nguồn gốc và quản lý vòng đời.", href: "/san-pham-nen-tang", category: "Sản phẩm", keywords: "phần mềm nền tảng sản phẩm iot ai dữ liệu truy xuất vòng đời" },
  { title: "IoT & Quan trắc", summary: "Kết nối thiết bị, cảm biến và dữ liệu hiện trường về hệ thống quản lý tập trung.", href: "/san-pham-nen-tang#iot-quan-trac", category: "Sản phẩm", keywords: "iot cảm biến quan trắc 4g gateway hiện trường dữ liệu thiết bị" },
  { title: "AI & Dữ liệu", summary: "Khai thác dữ liệu và ứng dụng AI theo bài toán nghiệp vụ cụ thể.", href: "/san-pham-nen-tang#ai-du-lieu", category: "Sản phẩm", keywords: "trí tuệ nhân tạo genai dữ liệu phân tích tự động hóa" },
  { title: "Giải pháp & Dịch vụ", summary: "Tư vấn chuyển đổi số, thiết kế hệ thống, tích hợp, phát triển phần mềm và vận hành.", href: "/giai-phap-dich-vu", category: "Giải pháp", keywords: "tư vấn chuyển đổi số thiết kế hệ thống tích hợp phần mềm vận hành" },
  { title: "Chuyển giao công nghệ", summary: "Khảo sát, thử nghiệm, hoàn thiện, bàn giao công nghệ và đồng hành vận hành.", href: "/chuyen-giao-cong-nghe", category: "Giải pháp", keywords: "chuyển giao công nghệ thử nghiệm hoàn thiện bàn giao vận hành" },
  { title: "Đào tạo & Tập huấn", summary: "Chương trình đào tạo theo nhóm đối tượng, lĩnh vực và nhu cầu thực tế.", href: "/dao-tao-tap-huan", category: "Đào tạo", keywords: "đào tạo tập huấn khóa học năng lực số ai dữ liệu" },
  { title: "Đào tạo dành cho cơ quan nhà nước", summary: "Khung bồi dưỡng theo cấp, nhóm vị trí công việc và chuyên đề phục vụ khu vực công.", href: "/dao-tao-tap-huan/co-quan-nha-nuoc", category: "Đào tạo", keywords: "cơ quan nhà nước nghị quyết 57 xã phường sở ban ngành cán bộ công chức viên chức" },
  { title: "Làm chủ GenAI trong công vụ", summary: "Khai thác AI tạo sinh cho tham mưu, tổng hợp, soạn thảo và xử lý công việc có kiểm soát.", href: "/dao-tao-tap-huan/co-quan-nha-nuoc#chuyen-de", category: "Đào tạo", keywords: "genai ai công vụ tham mưu tổng hợp soạn thảo cán bộ công chức" },
  { title: "Quản trị dữ liệu và dữ liệu mở", summary: "Tổ chức, quản trị, khai thác và chia sẻ dữ liệu phục vụ quản lý và cung cấp dịch vụ.", href: "/dao-tao-tap-huan/co-quan-nha-nuoc#chuyen-de", category: "Đào tạo", keywords: "dữ liệu mở quản trị dữ liệu liên thông cơ sở dữ liệu chính quyền số" },
  { title: "Dự án Trâm Rừng", summary: "Mô hình kết nối dữ liệu cảm biến ngoài hiện trường với máy chủ, truy xuất nguồn gốc và quản lý vòng đời.", href: "/du-an#tram-rung", category: "Dự án", keywords: "trâm rừng rừng phòng hộ iot cảm biến 4g truy xuất nguồn gốc vòng đời server" },
  { title: "Dự án tiêu biểu", summary: "Các mô hình ứng dụng được trình bày theo bài toán, kiến trúc, cách triển khai và khả năng mở rộng.", href: "/du-an", category: "Dự án", keywords: "dự án mô hình triển khai case study nghiên cứu ứng dụng" },
  { title: "Tin tức & Sự kiện", summary: "Kênh thông tin về hoạt động Viện, khoa học công nghệ, chuyển đổi số, đào tạo và sự kiện.", href: "/tin-tuc", category: "Thông tin", keywords: "tin tức sự kiện hội thảo khoa học công nghệ chuyển đổi số" },
  { title: "Liên hệ & Hợp tác", summary: "Trao đổi nhu cầu tư vấn, triển khai, chuyển giao, đào tạo và hợp tác dự án.", href: "/lien-he", category: "Thông tin", keywords: "liên hệ hợp tác tư vấn dự án đào tạo chuyển giao" },
];

const filters = ["Tất cả", "Sản phẩm", "Giải pháp", "Đào tạo", "Dự án", "Thông tin"] as const;
const suggestions = ["AI & Dữ liệu", "IoT & Quan trắc", "Trâm Rừng", "Đào tạo cơ quan nhà nước"];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function categoryForPublication(item: SearchPublication): SearchItem["category"] {
  if (item.category.includes("Đào tạo")) return "Đào tạo";
  if (item.category.includes("Dự án")) return "Dự án";
  return "Thông tin";
}

export function SiteSearch({ publications }: { publications: SearchPublication[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tất cả");

  const searchIndex = useMemo<SearchItem[]>(() => {
    const publicationSearchIndex = publications.map((item) => ({
      title: item.title,
      summary: item.excerpt,
      href: `/tin-tuc/${item.slug}`,
      category: categoryForPublication(item),
      keywords: `${item.keywords.join(" ")} ${item.category}`,
      image: item.coverImage,
    }));
    return [...baseSearchIndex, ...publicationSearchIndex];
  }, [publications]);

  const results = useMemo(() => {
    const needle = normalize(query);
    return searchIndex.filter((item) => {
      const matchesFilter = filter === "Tất cả" || item.category === filter;
      if (!matchesFilter) return false;
      if (!needle) return true;
      return normalize(`${item.title} ${item.summary} ${item.keywords} ${item.category}`).includes(needle);
    });
  }, [filter, query, searchIndex]);

  const hasSearchIntent = query.trim().length > 0 || filter !== "Tất cả";

  return (
    <div className="site-search-panel">
      <form className="site-search-form" onSubmit={(event) => event.preventDefault()} role="search">
        <label htmlFor="site-search-input">Từ khóa</label>
        <div className="site-search-input-row">
          <span aria-hidden="true">⌕</span>
          <input id="site-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: AI, IoT, Trâm Rừng, đào tạo..." aria-label="Từ khóa tìm kiếm" autoComplete="off" />
          {query ? <button type="button" className="site-search-clear" onClick={() => setQuery("")}>Xóa</button> : null}
        </div>
      </form>

      <div className="site-search-filters" aria-label="Lọc kết quả">
        {filters.map((item) => (
          <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>
        ))}
      </div>

      {!hasSearchIntent ? (
        <div className="site-search-suggestions">
          <span>Tìm nhanh</span>
          <div>{suggestions.map((item) => <button type="button" key={item} onClick={() => setQuery(item)}>{item} <i aria-hidden="true">→</i></button>)}</div>
        </div>
      ) : null}

      <div className="site-search-results-head" aria-live="polite">
        <div><span>{hasSearchIntent ? "Kết quả phù hợp" : "Khám phá nội dung"}</span><strong>{results.length.toString().padStart(2, "0")}</strong></div>
        <p>{hasSearchIntent ? "Kết quả được tìm trong các trang và bài viết công khai của IAICT." : "Có thể nhập từ khóa hoặc chọn một nhóm nội dung để thu hẹp kết quả."}</p>
      </div>

      {results.length ? (
        <div className="site-search-results">
          {results.map((item, index) => (
            <Link href={item.href} key={`${item.href}-${item.title}`} className={`site-search-result-card${item.image ? " has-image" : ""}`}>
              {item.image ? <img className="site-search-result-thumb" src={item.image.src} alt={item.image.alt} loading="lazy" /> : null}
              <div className="site-search-result-content">
                <div className="site-search-result-meta"><span>{item.category}</span><b>{String(index + 1).padStart(2, "0")}</b></div>
                <h2>{item.title}</h2><p>{item.summary}</p><strong>Xem nội dung <i aria-hidden="true">→</i></strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="site-search-empty"><span>Không tìm thấy kết quả phù hợp</span><p>Thử từ khóa ngắn hơn, bỏ dấu hoặc chọn lại nhóm nội dung.</p><button type="button" onClick={() => { setQuery(""); setFilter("Tất cả"); }}>Đặt lại tìm kiếm</button></div>
      )}

      <p className="site-search-note">Chỉ mục tìm kiếm bao phủ các trang chính và toàn bộ bài viết đang được xuất bản từ CMS.</p>
    </div>
  );
}
