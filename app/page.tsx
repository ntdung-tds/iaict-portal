const capabilityGroups = [
  {
    eyebrow: "Nền tảng",
    title: "Sản phẩm & nền tảng số",
    text: "Phát triển các nền tảng phục vụ quản trị, dữ liệu, IoT, truy xuất nguồn gốc và các bài toán chuyển đổi số theo nhu cầu thực tế.",
  },
  {
    eyebrow: "Giải pháp",
    title: "Tư vấn & triển khai",
    text: "Khảo sát hiện trạng, thiết kế kiến trúc, xây dựng giải pháp và đồng hành triển khai cho cơ quan, tổ chức và doanh nghiệp.",
  },
  {
    eyebrow: "Năng lực",
    title: "Phần mềm theo yêu cầu",
    text: "Thiết kế và phát triển phần mềm theo quy trình có kiểm soát, chú trọng khả năng tích hợp, vận hành và mở rộng lâu dài.",
  },
  {
    eyebrow: "Chuyển giao",
    title: "Công nghệ & dữ liệu",
    text: "Kết nối nghiên cứu với ứng dụng, xây dựng mô hình thử nghiệm, chuyển giao giải pháp và hỗ trợ làm chủ công nghệ.",
  },
  {
    eyebrow: "Đào tạo",
    title: "Tập huấn & bồi dưỡng",
    text: "Tổ chức chương trình nâng cao năng lực số, dữ liệu và AI theo nhóm đối tượng, gắn nội dung đào tạo với công việc thực tế.",
  },
  {
    eyebrow: "Dự án",
    title: "Mô hình ứng dụng",
    text: "Triển khai các mô hình thực tế để kiểm chứng công nghệ, hoàn thiện quy trình và tạo cơ sở cho nhân rộng giải pháp.",
  },
];

const priorities = [
  "Nội dung có cấu trúc, sẵn sàng kết nối CMS",
  "Kiến trúc Cloudflare-native theo đặc tả v3.4.3.11",
  "Bảo mật, quyền riêng tư và khả năng kiểm toán ngay từ nền tảng",
  "Trải nghiệm responsive, rõ ràng và phù hợp cổng thông tin chuyên nghiệp",
];

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <div className="topline">
          <div className="shell topline-inner">
            <span>Cổng thông tin điện tử IAICT</span>
            <span className="status-dot">Bản dựng kỹ thuật M0</span>
          </div>
        </div>
        <div className="shell brand-row">
          <a className="brand" href="/" aria-label="IAICT - Trang chủ">
            <span className="brand-mark" aria-hidden="true">IA</span>
            <span>
              <strong>IAICT</strong>
              <small>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</small>
            </span>
          </a>
          <nav className="main-nav" aria-label="Điều hướng chính">
            <a href="#gioi-thieu">Giới thiệu</a>
            <a href="#nang-luc">Năng lực</a>
            <a href="#du-an">Dự án</a>
            <a href="#tin-tuc">Tin tức</a>
            <a href="#lien-he">Liên hệ</a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="gioi-thieu">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="kicker">Công nghệ • Dữ liệu • Chuyển đổi số</p>
              <h1>Biến nhu cầu thực tiễn thành giải pháp số có thể triển khai.</h1>
              <p className="lead">
                IAICT xây dựng và ứng dụng công nghệ thông tin, truyền thông và dữ liệu theo hướng thực tiễn, an toàn và có khả năng mở rộng.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#nang-luc">Khám phá năng lực</a>
                <a className="button button-secondary" href="#lien-he">Trao đổi nhu cầu</a>
              </div>
            </div>
            <aside className="hero-panel" aria-label="Định hướng triển khai">
              <span className="panel-label">Định hướng</span>
              <h2>Từ nghiên cứu đến vận hành</h2>
              <p>
                Kết nối tư vấn, phát triển sản phẩm, thử nghiệm, chuyển giao và đào tạo trong một chu trình triển khai thống nhất.
              </p>
              <div className="signal-grid" aria-hidden="true">
                <span>01</span><span>02</span><span>03</span><span>04</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="section" id="nang-luc">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="kicker">Năng lực cốt lõi</p>
                <h2>Một hệ sinh thái dịch vụ công nghệ liền mạch</h2>
              </div>
              <p>
                Cấu trúc cổng thông tin được thiết kế để phát triển thành các phân hệ dữ liệu có cấu trúc thay vì chỉ là một website tin tức.
              </p>
            </div>
            <div className="capability-grid">
              {capabilityGroups.map((item) => (
                <article className="capability-card" key={item.title}>
                  <span>{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <a href="#lien-he" aria-label={`Tìm hiểu thêm về ${item.title}`}>Tìm hiểu thêm →</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-tint" id="du-an">
          <div className="shell split-panel">
            <div>
              <p className="kicker">Nền tảng kỹ thuật</p>
              <h2>Thiết kế để phát triển lâu dài, không khóa cứng vào trang tĩnh.</h2>
              <p className="body-copy">
                Baseline hiện tại tập trung chứng minh stack Next.js 16 + vinext trên Cloudflare Workers trước khi mở rộng CMS, biểu mẫu, tìm kiếm và các phân hệ nghiệp vụ.
              </p>
            </div>
            <ul className="priority-list">
              {priorities.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="section" id="tin-tuc">
          <div className="shell callout">
            <div>
              <p className="kicker">Nội dung & hoạt động</p>
              <h2>Sẵn sàng cho tin tức, sự kiện, đào tạo và các dự án tiêu biểu.</h2>
              <p>
                Dữ liệu demo ở baseline này chỉ dùng để kiểm thử bố cục. Nội dung chính thức sẽ đi qua CMS và quy trình xuất bản có kiểm soát ở các milestone tiếp theo.
              </p>
            </div>
            <div className="callout-chip">M0 → M1 → M2</div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="lien-he">
        <div className="shell footer-grid">
          <div>
            <strong className="footer-brand">IAICT</strong>
            <p>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</p>
          </div>
          <div>
            <span className="footer-label">Liên hệ</span>
            <p>Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội</p>
          </div>
          <div>
            <span className="footer-label">Hệ thống</span>
            <a href="/api/health">API Health</a>
          </div>
        </div>
        <div className="shell footer-bottom">© {new Date().getFullYear()} IAICT. Cổng thông tin đang trong giai đoạn xây dựng.</div>
      </footer>
    </>
  );
}
