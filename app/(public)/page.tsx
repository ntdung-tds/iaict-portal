import Link from "next/link";
import { DataPlaceholder } from "@/components/data-placeholder";
import { intentCards, pillars, productGroups, solutionGroups } from "@/lib/public-content";

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="kicker">Công nghệ • Giải pháp • Chuyển giao • Đào tạo</p>
            <h1>Từ bài toán thực tế đến giải pháp số có thể triển khai.</h1>
            <p className="lead">Cổng thông tin giúp cơ quan, tổ chức và doanh nghiệp nhanh chóng tìm đúng năng lực, giải pháp và chương trình phù hợp tại IAICT.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/giai-phap-dich-vu">Khám phá giải pháp</Link>
              <Link className="button button-secondary" href="/lien-he">Đề nghị tư vấn</Link>
            </div>
            <div className="hero-pillars" aria-label="Bốn trụ cột IAICT">
              {pillars.map((pillar) => <span key={pillar.title}>{pillar.title.replace("IAICT ", "")}</span>)}
            </div>
          </div>
          <aside className="hero-visual" aria-label="Chu trình triển khai IAICT">
            <div className="orbit orbit-one" aria-hidden="true" />
            <div className="orbit orbit-two" aria-hidden="true" />
            <div className="hero-visual-core">
              <span>IAICT</span>
              <strong>Ứng dụng</strong>
              <small>nghiên cứu → triển khai</small>
            </div>
            <div className="hero-node node-a">AI</div>
            <div className="hero-node node-b">IoT</div>
            <div className="hero-node node-c">Data</div>
            <div className="hero-node node-d">DX</div>
          </aside>
        </div>
      </section>

      <section className="section" aria-labelledby="intent-title">
        <div className="shell">
          <div className="section-heading">
            <div><p className="kicker">Đi theo nhu cầu</p><h2 id="intent-title">Bạn đang cần gì?</h2></div>
            <p>Chọn theo bài toán trước, sau đó đi đến nhóm sản phẩm, giải pháp, chuyển giao hoặc đào tạo phù hợp.</p>
          </div>
          <div className="intent-grid">
            {intentCards.map((item, index) => (
              <Link className="intent-card" href={item.href ?? "/"} key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <b aria-hidden="true">→</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint" aria-labelledby="products-title">
        <div className="shell">
          <div className="section-heading">
            <div><p className="kicker">IAICT Technology</p><h2 id="products-title">Sản phẩm & Nền tảng</h2></div>
            <Link className="text-link" href="/san-pham-nen-tang">Xem toàn bộ nhóm sản phẩm →</Link>
          </div>
          <div className="compact-card-grid">
            {productGroups.slice(0, 6).map((item) => <article className="compact-card" key={item.title}><span>Technology</span><h3>{item.title}</h3><p>{item.summary}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="solutions-title">
        <div className="shell split-heading">
          <div><p className="kicker">IAICT Solutions</p><h2 id="solutions-title">Giải pháp & Dịch vụ</h2><p className="body-copy">Tiếp cận theo phạm vi công việc, từ khảo sát và thiết kế đến tích hợp, triển khai và vận hành.</p><Link className="text-link" href="/giai-phap-dich-vu">Khám phá năng lực triển khai →</Link></div>
          <div className="service-list">{solutionGroups.map((item, index) => <div key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong></div>)}</div>
        </div>
      </section>

      <section className="section academy-section" aria-labelledby="academy-title">
        <div className="shell academy-grid">
          <div className="academy-copy"><p className="kicker">IAICT Academy</p><h2 id="academy-title">Đào tạo & Tập huấn gắn với công việc thực tế</h2><p>Cấu trúc đào tạo được tổ chức theo đối tượng, mục tiêu, module, thời lượng, hình thức và lịch triển khai.</p><div className="hero-actions"><Link className="button button-primary" href="/dao-tao-tap-huan">Xem phân hệ đào tạo</Link><Link className="button button-ghost" href="/dao-tao-tap-huan/co-quan-nha-nuoc">Dành cho cơ quan nhà nước</Link></div></div>
          <div className="academy-matrix" aria-label="Cấu trúc phân hệ đào tạo"><span>Đối tượng</span><span>Mục tiêu</span><span>Module</span><span>Thời lượng</span><span>Hình thức</span><span>Lịch / Session</span></div>
        </div>
      </section>

      <section className="section section-compact">
        <div className="shell government-banner">
          <div><p className="kicker">Dành cho cơ quan nhà nước</p><h2>Khung đào tạo theo cấp và nhóm vị trí công việc</h2><p>Hỗ trợ định hướng chương trình cho cấp tỉnh, sở/ban/ngành, xã/phường, đơn vị sự nghiệp và các nhóm lãnh đạo/chuyên viên.</p></div>
          <Link className="button button-light" href="/dao-tao-tap-huan/co-quan-nha-nuoc">Khám phá chương trình</Link>
        </div>
      </section>

      <section className="section section-tint" aria-labelledby="projects-title">
        <div className="shell three-column-section">
          <div><p className="kicker">Dự án tiêu biểu</p><h2 id="projects-title">Từ mô hình ứng dụng đến khả năng nhân rộng</h2><Link className="text-link" href="/du-an">Xem dự án →</Link></div>
          <DataPlaceholder label="CMS / Projects" title="Dữ liệu dự án đang được kết nối" description="Chỉ hiển thị dự án đã được xác minh và xuất bản qua quy trình biên tập." />
          <DataPlaceholder label="Media / Evidence" title="Không dùng số liệu hoặc thành tích giả" description="Media, kết quả và case study sẽ lấy từ nguồn dữ liệu chính thức." />
        </div>
      </section>

      <section className="section" aria-labelledby="capability-title">
        <div className="shell">
          <div className="section-heading"><div><p className="kicker">Năng lực công nghệ</p><h2 id="capability-title">Bốn trụ cột, một chu trình triển khai</h2></div><p>Kết nối công nghệ, giải pháp, chuyển giao và đào tạo thay vì tách rời từng hoạt động.</p></div>
          <div className="pillar-grid">{pillars.map((item) => <Link className="pillar-card" href={item.href ?? "/"} key={item.title}><h3>{item.title}</h3><p>{item.summary}</p><span>Khám phá →</span></Link>)}</div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell editorial-grid">
          <div><p className="kicker">Chuyên gia / Giảng viên</p><h2>Năng lực con người được xuất bản có kiểm soát</h2><DataPlaceholder label="CMS / Experts" title="Danh sách chuyên gia sẽ hiển thị từ CMS" description="Chỉ công bố hồ sơ và thông tin liên hệ được phép công khai." /></div>
          <div><p className="kicker">Đối tác</p><h2>Hợp tác dựa trên thông tin đã xác minh</h2><DataPlaceholder label="CMS / Partners" title="Danh sách đối tác chưa được hard-code" description="Logo và thông tin đối tác chỉ xuất hiện sau khi được xác minh và phê duyệt." /></div>
        </div>
      </section>

      <section className="section" aria-labelledby="news-title">
        <div className="shell">
          <div className="section-heading"><div><p className="kicker">Tin tức & Sự kiện</p><h2 id="news-title">Kênh thông tin chính thức</h2></div><Link className="text-link" href="/tin-tuc">Đến trang Tin tức →</Link></div>
          <div className="news-placeholder-grid"><DataPlaceholder label="CMS / Articles" title="4–6 bài chọn lọc trên trang chủ" description="Tin tức không lấn át sản phẩm, giải pháp và đào tạo." /><DataPlaceholder label="CMS / Events" title="Sự kiện và hội thảo" description="Lịch sự kiện sẽ được đồng bộ từ thực thể nội dung chính thức." /></div>
        </div>
      </section>

      <section className="section section-compact">
        <div className="shell final-cta final-cta-strong"><div><p className="kicker">Bắt đầu từ nhu cầu</p><h2>Trao đổi bài toán với IAICT</h2><p>Chọn đúng hướng giải pháp trước khi đi sâu vào công nghệ.</p></div><Link className="button button-primary" href="/lien-he">Liên hệ & Hợp tác</Link></div>
      </section>
    </main>
  );
}
