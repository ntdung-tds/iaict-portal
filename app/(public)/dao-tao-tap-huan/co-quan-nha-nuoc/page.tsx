import Link from "next/link";
import type { Metadata } from "next";
import { governmentAudiences } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Đào tạo dành cho cơ quan nhà nước",
  description: "Khung đào tạo, tập huấn theo cấp, vị trí việc làm và năng lực cần áp dụng trong môi trường công vụ.",
};

const trainingFlow = [
  ["01", "Role", "Xác định vị trí & nhiệm vụ", "Phân nhóm lãnh đạo, quản lý, chuyên viên và nghiệp vụ để chọn đúng độ sâu nội dung.", "Đầu ra · hồ sơ đối tượng"],
  ["02", "Module", "Thiết kế chương trình", "Ghép chuyên đề theo mục tiêu công việc, lĩnh vực và mức độ sẵn sàng của đơn vị.", "Đầu ra · cấu trúc học phần"],
  ["03", "Practice", "Thực hành theo tình huống", "Dùng hồ sơ, quy trình, dữ liệu và tình huống mô phỏng gần với công việc hằng ngày.", "Đầu ra · bài tập & sản phẩm"],
  ["04", "Evidence", "Đánh giá khả năng áp dụng", "Đánh giá bằng đầu ra thực hành và kế hoạch áp dụng thay vì chỉ kiểm tra ghi nhớ.", "Đầu ra · minh chứng năng lực"],
] as const;

export default function GovernmentTrainingPage() {
  return (
    <main id="main-content" className="v9-page">
      <section className="v9-hero">
        <div className="shell v9-hero-grid">
          <div>
            <p className="v9-kicker">IAICT ACADEMY / PUBLIC SECTOR</p>
            <h1>Đào tạo để áp dụng được vào công việc.</h1>
            <p className="v9-lead">Chương trình được thiết kế theo cấp, vị trí việc làm và năng lực cần dùng thật; nội dung có thể ghép linh hoạt từ AI, dữ liệu, chuyển đổi số đến quản trị và kỹ năng số.</p>
          </div>
          <aside className="v9-signal" aria-label="Khung đào tạo IAICT cho cơ quan nhà nước">
            <div><small>AUDIENCE</small><strong>Đúng đối tượng</strong><span>Theo cấp, vai trò và nhóm nghiệp vụ.</span></div>
            <div><small>OUTCOME</small><strong>Đúng năng lực</strong><span>Gắn với việc cần làm sau khóa học.</span></div>
            <div><small>PRACTICE</small><strong>Có thực hành</strong><span>Tình huống gần với môi trường công vụ.</span></div>
            <div><small>EVIDENCE</small><strong>Có đầu ra</strong><span>Đánh giá bằng sản phẩm và khả năng áp dụng.</span></div>
          </aside>
        </div>
      </section>

      <section className="v9-section">
        <div className="shell">
          <div className="v9-section-head">
            <div><p className="v9-kicker">AUDIENCE ARCHITECTURE</p><h2>Không dùng một chương trình cho mọi nhóm người học.</h2></div>
            <p>Mỗi nhóm có vai trò, mức độ ra quyết định và nhu cầu sử dụng công nghệ khác nhau; cấu trúc nội dung vì vậy cần được phân tầng ngay từ đầu.</p>
          </div>
          <div className="v9-grid-6">
            {governmentAudiences.map((item, index) => (
              <article className="v9-card" key={item.title}>
                <span>{String(index + 1).padStart(2, "0")} · ROLE-BASED</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <small>Audience · Outcome · Practice</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="v9-section-dark">
        <div className="shell">
          <div className="v9-section-head">
            <div><p className="v9-kicker" style={{ color: "#72dfc8" }}>IAICT ACADEMY / DESIGN FLOW</p><h2>Từ vị trí việc làm đến bằng chứng năng lực.</h2></div>
            <p>Khung này giúp lớp học đi từ “học công cụ” sang “làm được nhiệm vụ”, đồng thời dễ điều chỉnh theo lĩnh vực, địa bàn và thời lượng.</p>
          </div>
          <div className="v9-flow">
            {trainingFlow.map(([no, label, title, body, output]) => (
              <article key={label}><span>{no}</span><h3>{title}</h3><p>{body}</p><small>{output}</small></article>
            ))}
          </div>
        </div>
      </section>

      <section className="v9-section-alt">
        <div className="shell">
          <div className="v9-section-head">
            <div><p className="v9-kicker">PROGRAM DESIGN</p><h2>Một chương trình có thể ghép linh hoạt theo nhu cầu đơn vị.</h2></div>
            <p>Thay vì khóa cứng theo tên công nghệ, chương trình có thể tổ chức theo năng lực và tình huống công việc để dễ cập nhật khi công cụ thay đổi.</p>
          </div>
          <div className="v9-grid-4">
            <article className="v9-card"><span>01 · AI & CÔNG VỤ</span><h3>AI theo vị trí việc làm</h3><p>Sử dụng AI có kiểm soát trong tham mưu, tổng hợp, xử lý văn bản, dữ liệu và hỗ trợ nghiệp vụ.</p><small>Role · Task · Practice · Evidence</small></article>
            <article className="v9-card"><span>02 · DATA</span><h3>Dữ liệu & quản trị dữ liệu</h3><p>Tư duy dữ liệu, chuẩn hóa, chia sẻ, chất lượng dữ liệu và cách tổ chức dữ liệu phục vụ quản lý.</p><small>Data literacy · Governance</small></article>
            <article className="v9-card"><span>03 · LEADERSHIP</span><h3>Lãnh đạo & quản trị số</h3><p>Ra quyết định, lựa chọn ưu tiên, quản trị thay đổi và theo dõi hiệu quả trong môi trường số.</p><small>Strategy · Governance · KPI</small></article>
            <article className="v9-card"><span>04 · DIGITAL SKILLS</span><h3>Kỹ năng số theo nghiệp vụ</h3><p>Công cụ, quy trình và kỹ năng làm việc số gắn trực tiếp với nhiệm vụ của cán bộ, công chức, viên chức.</p><small>Workflow · Tools · Practice</small></article>
          </div>
        </div>
      </section>

      <section className="v9-cta"><div className="shell v9-cta-inner"><div><h2>Cần xây dựng chương trình riêng cho cơ quan hoặc địa phương?</h2><p>IAICT có thể cùng đơn vị khảo sát đối tượng, mục tiêu, thời lượng và tình huống thực tế để thiết kế chương trình phù hợp.</p></div><Link href="/lien-he">Trao đổi nhu cầu đào tạo <span>↗</span></Link></div></section>
    </main>
  );
}
