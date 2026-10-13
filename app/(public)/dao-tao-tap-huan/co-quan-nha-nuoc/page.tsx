import Link from "next/link";
import type { Metadata } from "next";
import { governmentAudiences } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Đào tạo dành cho cơ quan nhà nước",
  description: "Khung đào tạo và tập huấn năng lực số dành cho cơ quan nhà nước, lãnh đạo, chuyên viên, cấp tỉnh, sở ngành và xã phường.",
};

const specialties = [
  {
    code: "01",
    title: "Lãnh đạo số & quản trị chuyển đổi số",
    summary: "Tư duy chiến lược, tổ chức thực thi, quản trị thay đổi và ra quyết định trong môi trường số.",
    tags: "Lãnh đạo • Quản lý",
  },
  {
    code: "02",
    title: "AI tạo sinh trong công vụ",
    summary: "Ứng dụng GenAI cho tham mưu, tổng hợp, soạn thảo, tra cứu và xử lý công việc theo nguyên tắc có kiểm soát.",
    tags: "AI • Công vụ",
  },
  {
    code: "03",
    title: "Quản trị dữ liệu & dữ liệu mở",
    summary: "Tổ chức dữ liệu, chất lượng dữ liệu, chia sẻ, khai thác và tư duy liên thông phục vụ quản lý nhà nước.",
    tags: "Dữ liệu • Liên thông",
  },
  {
    code: "04",
    title: "Kỹ năng số cho cán bộ, công chức, viên chức",
    summary: "Nâng cao năng lực sử dụng công cụ số, cộng tác, quản lý thông tin, bảo mật và hiệu suất công việc hằng ngày.",
    tags: "Kỹ năng số • Năng suất",
  },
  {
    code: "05",
    title: "Truyền thông số & quản trị khủng hoảng",
    summary: "Tổ chức nội dung, truyền thông đa kênh, xử lý thông tin và phản ứng trong các tình huống truyền thông số.",
    tags: "Truyền thông • Điều hành",
  },
  {
    code: "06",
    title: "Ứng dụng AI theo lĩnh vực",
    summary: "Thiết kế chuyên đề theo bài toán ngành như giáo dục, nông nghiệp, hành chính, dữ liệu, truyền thông và dịch vụ công.",
    tags: "Theo ngành • Thực hành",
  },
];

const designSteps = [
  ["01", "Xác định đối tượng", "Phân nhóm lãnh đạo, quản lý, chuyên viên hoặc cán bộ cấp cơ sở để chọn độ sâu phù hợp."],
  ["02", "Chốt bài toán công việc", "Ưu tiên tình huống thật, quy trình thật và dữ liệu mẫu sát với môi trường của đơn vị."],
  ["03", "Thiết kế chương trình", "Kết hợp nội dung nền tảng, thực hành, tình huống và hướng dẫn áp dụng sau lớp học."],
  ["04", "Đánh giá & chuyển giao", "Tổng hợp kết quả, tài liệu học tập và khuyến nghị để đơn vị tiếp tục triển khai nội bộ."],
];

export default function GovernmentTrainingPage() {
  return (
    <main id="main-content" className="government-training-page">
      <section className="government-training-hero">
        <div className="government-training-grid" aria-hidden="true"></div>
        <div className="shell government-training-hero-inner">
          <div>
            <div className="government-training-breadcrumb"><Link href="/">IAICT</Link><span>/</span><Link href="/dao-tao-tap-huan">IAICT Academy</Link><span>/</span><b>Cơ quan nhà nước</b></div>
            <p className="kicker">IAICT Academy / Public Sector</p>
            <h1>Năng lực số gắn trực tiếp với công việc của khu vực công</h1>
            <p className="page-lead">Khung đào tạo được thiết kế theo cấp quản lý, nhóm vị trí việc làm và bài toán thực tế; ưu tiên khả năng áp dụng sau khóa học thay vì dừng ở kiến thức khái quát.</p>
            <div className="government-training-actions">
              <a className="button button-primary" href="#chuyen-de">Xem nhóm chuyên đề</a>
              <Link className="government-training-inline-link" href="/lien-he">Trao đổi nhu cầu tổ chức lớp ↗</Link>
            </div>
          </div>

          <aside className="government-training-policy-card">
            <span>Định hướng chính sách</span>
            <strong>Phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số</strong>
            <p>Chương trình được xây dựng theo tinh thần Nghị quyết 57-NQ/TW ngày 22/12/2024, tập trung vào năng lực thực thi, dữ liệu, công nghệ và đổi mới phương thức làm việc.</p>
            <div><b>Nghị quyết 57</b><b>Năng lực số</b><b>Ứng dụng thực tế</b></div>
          </aside>
        </div>
      </section>

      <section className="section government-audience-section">
        <div className="shell">
          <div className="government-section-heading">
            <div><p className="kicker">Theo đối tượng</p><h2>Chọn đúng cấp độ trước khi chọn nội dung</h2></div>
            <p>Cùng một chủ đề nhưng cách tổ chức cho lãnh đạo, chuyên viên, sở ngành hay xã/phường cần khác nhau về mục tiêu, ví dụ và mức độ thực hành.</p>
          </div>
          <div className="government-audience-grid">
            {governmentAudiences.map((item, index) => (
              <article key={item.title}>
                <div><span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden="true"></i></div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section government-specialty-section" id="chuyen-de">
        <div className="shell">
          <div className="government-section-heading light">
            <div><p className="kicker kicker-light">Nhóm chuyên đề</p><h2>Từ tư duy quản trị đến kỹ năng sử dụng công cụ</h2></div>
            <p>Có thể chọn một chuyên đề độc lập hoặc ghép thành chương trình theo cấp, lĩnh vực và mục tiêu của đơn vị.</p>
          </div>
          <div className="government-specialty-grid">
            {specialties.map((item) => (
              <article key={item.code}>
                <div className="government-specialty-top"><span>{item.code}</span><b>{item.tags}</b></div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section government-design-section">
        <div className="shell government-design-grid">
          <div>
            <p className="kicker">Thiết kế lớp theo nhu cầu</p>
            <h2>Không áp một giáo trình cho mọi cơ quan</h2>
            <p>IAICT có thể bắt đầu từ mục tiêu của đơn vị, nhóm học viên và các tình huống công việc cần cải thiện để thiết kế thời lượng, nội dung và mức độ thực hành phù hợp.</p>
            <Link className="text-link" href="/lien-he">Trao đổi đầu bài đào tạo →</Link>
          </div>
          <div className="government-design-steps">
            {designSteps.map(([code, title, description]) => (
              <article key={code}>
                <span>{code}</span>
                <div><strong>{title}</strong><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-compact government-training-final-section">
        <div className="shell government-training-final-card">
          <div>
            <p className="kicker kicker-light">Tổ chức chương trình</p>
            <h2>Từ một buổi tập huấn đến chương trình bồi dưỡng theo lộ trình</h2>
            <p>IAICT có thể cùng xây dựng nội dung, tình huống thực hành, tài liệu, kế hoạch triển khai và phương án đánh giá phù hợp với từng nhóm học viên.</p>
          </div>
          <div className="government-training-final-actions">
            <Link className="button button-light" href="/lien-he">Trao đổi nhu cầu</Link>
            <Link href="/dao-tao-tap-huan">Xem IAICT Academy →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
