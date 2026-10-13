import Link from "next/link";
import { PublicSearch } from "@/components/public-search";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm kiếm nội dung IAICT theo từ khóa, năng lực, dự án và nhóm chủ đề.",
};

const quickPaths = [
  ["01", "Sản phẩm & Nền tảng", "IoT, AI, dữ liệu, truy xuất, quản lý vòng đời và các nền tảng ứng dụng.", "/san-pham-nen-tang"],
  ["02", "Giải pháp & Dịch vụ", "Tư vấn, thiết kế, tích hợp, triển khai và hỗ trợ vận hành theo bài toán.", "/giai-phap-dich-vu"],
  ["03", "Chuyển giao công nghệ", "Từ khảo sát, thử nghiệm đến chuẩn hóa, đào tạo và làm chủ giải pháp.", "/chuyen-giao-cong-nghe"],
  ["04", "Đào tạo & Tập huấn", "Chương trình theo đối tượng, vị trí việc làm, mục tiêu và hình thức tổ chức.", "/dao-tao-tap-huan"],
  ["05", "Dự án tiêu biểu", "Case study và mô hình ứng dụng được trình bày theo bối cảnh, kiến trúc và bằng chứng.", "/du-an"],
  ["06", "Tin tức & Tri thức", "Thông tin hoạt động, tri thức ứng dụng, sự kiện và các chủ đề công nghệ liên quan.", "/tin-tuc"],
] as const;

export default function SearchPage() {
  return (
    <main id="main-content" className="v9-page">
      <section className="v9-hero">
        <div className="shell v9-hero-grid">
          <div>
            <p className="v9-kicker">IAICT / DISCOVERY</p>
            <h1>Tìm đúng năng lực, không chỉ tìm từ khóa.</h1>
            <p className="v9-lead">Tìm sản phẩm, giải pháp, dự án và chương trình đào tạo trong nội dung IAICT đang công khai. Bắt đầu bằng một từ khóa hoặc chọn nhóm chủ đề phù hợp.</p>
          </div>
          <aside className="v9-signal" aria-label="Các cách khám phá nội dung IAICT">
            <div><small>BY NEED</small><strong>Theo nhu cầu</strong><span>Bắt đầu từ bài toán cần giải quyết.</span></div>
            <div><small>BY CAPABILITY</small><strong>Theo năng lực</strong><span>Công nghệ · giải pháp · chuyển giao.</span></div>
            <div><small>BY PROJECT</small><strong>Theo dự án</strong><span>Xem mô hình ứng dụng và kiến trúc.</span></div>
            <div><small>BY KNOWLEDGE</small><strong>Theo tri thức</strong><span>Tin tức, sự kiện và chuyên đề.</span></div>
          </aside>
        </div>
      </section>

      <section className="v9-section">
        <div className="shell">
          <div className="v9-section-head">
            <div><p className="v9-kicker">DISCOVERY HUB</p><h2>Bạn đang tìm nội dung nào?</h2></div>
            <p>Tìm nhanh theo tên hoặc mô tả, sau đó lọc kết quả theo nhóm nội dung.</p>
          </div>
          <PublicSearch />
        </div>
      </section>

      <section className="v9-section-alt">
        <div className="shell">
          <div className="v9-section-head">
            <div><p className="v9-kicker">MORE PATHS</p><h2>Tiếp tục bằng dự án hoặc tri thức ứng dụng.</h2></div>
            <p>Hai nhóm này phù hợp khi người xem muốn bắt đầu từ một mô hình triển khai cụ thể hoặc từ chủ đề đang quan tâm.</p>
          </div>
          <div className="v9-grid-4">
            {quickPaths.slice(4).map(([no, title, body, href]) => (
              <Link className="v9-card" href={href} key={title}><span>{no} · EXPLORE</span><h3>{title}</h3><p>{body}</p><small>Khám phá nội dung →</small></Link>
            ))}
            <Link className="v9-card" href="/gioi-thieu"><span>07 · IAICT</span><h3>Giới thiệu Viện</h3><p>Tìm hiểu cách IAICT kết nối công nghệ, giải pháp, chuyển giao và đào tạo trong cùng một hệ sinh thái.</p><small>About · Ecosystem</small></Link>
            <Link className="v9-card" href="/lien-he"><span>08 · CONTACT</span><h3>Trao đổi trực tiếp</h3><p>Nếu chưa xác định đúng nhóm nội dung, có thể bắt đầu từ bài toán và nhu cầu thực tế của đơn vị.</p><small>Contact · Collaboration</small></Link>
          </div>
        </div>
      </section>

      <section className="v9-cta"><div className="shell v9-cta-inner"><div><h2>Không chắc nên bắt đầu từ đâu?</h2><p>Hãy mô tả ngắn bài toán, bối cảnh và kết quả mong muốn; IAICT sẽ định hướng nhóm năng lực phù hợp để trao đổi tiếp.</p></div><Link href="/lien-he">Bắt đầu từ nhu cầu <span>↗</span></Link></div></section>
    </main>
  );
}

