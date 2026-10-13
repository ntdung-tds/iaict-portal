import Link from "next/link";
import { DataPlaceholder } from "@/components/data-placeholder";
import {
  intentCards,
  pillars,
  productGroups,
  solutionGroups,
  transferSteps,
} from "@/lib/public-content";

const capabilitySignals = [
  { code: "AI", title: "Trí tuệ nhân tạo", detail: "Tự động hóa, trợ lý số, khai thác tri thức" },
  { code: "DT", title: "Dữ liệu", detail: "Kiến trúc dữ liệu, phân tích, liên thông" },
  { code: "IoT", title: "IoT & Quan trắc", detail: "Cảm biến, thiết bị, dữ liệu hiện trường" },
  { code: "DX", title: "Chuyển đổi số", detail: "Quy trình, nền tảng, tích hợp vận hành" },
];

const projectCapabilities = [
  "Thu thập dữ liệu cảm biến ngoài hiện trường",
  "Kết nối 4G và đồng bộ dữ liệu về máy chủ",
  "Truy xuất nguồn gốc và quản lý vòng đời",
  "Sẵn sàng mở rộng theo mô hình ứng dụng thực tế",
];

export default function HomePage() {
  return (
    <main id="main-content" className="premium-home">
      <section className="hero hero-premium">
        <div className="hero-mesh" aria-hidden="true" />
        <div className="shell hero-grid premium-hero-grid">
          <div className="hero-copy premium-hero-copy">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              Viện Ứng dụng Công nghệ Thông tin và Truyền thông
            </div>
            <p className="kicker premium-kicker">Research → Build → Transfer → Scale</p>
            <h1>
              Từ bài toán thực tế đến <span>giải pháp số</span> có thể triển khai.
            </h1>
            <p className="lead premium-lead">
              IAICT kết nối nghiên cứu ứng dụng, công nghệ, triển khai thực tế và đào tạo để biến nhu cầu của cơ quan, tổ chức và doanh nghiệp thành hệ thống có thể vận hành, đo lường và mở rộng.
            </p>
            <div className="hero-actions premium-hero-actions">
              <Link className="button button-primary premium-primary-button" href="/giai-phap-dich-vu">
                Khám phá giải pháp <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-secondary premium-secondary-button" href="/lien-he">
                Trao đổi bài toán
              </Link>
            </div>
            <div className="hero-proofline" aria-label="Định hướng hoạt động IAICT">
              <span><b>01</b>Nghiên cứu ứng dụng</span>
              <span><b>02</b>Triển khai thực tế</span>
              <span><b>03</b>Chuyển giao & đào tạo</span>
            </div>
          </div>

          <aside className="hero-visual premium-capability-board" aria-label="Bản đồ năng lực công nghệ IAICT">
            <div className="capability-board-glow" aria-hidden="true" />
            <div className="capability-board-head">
              <div>
                <span className="board-label">IAICT Capability System</span>
                <strong>Năng lực công nghệ kết nối thành một hệ thống</strong>
              </div>
              <span className="board-status">Applied</span>
            </div>
            <div className="capability-grid">
              {capabilitySignals.map((item) => (
                <article className="capability-tile" key={item.code}>
                  <span className="capability-code">{item.code}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                </article>
              ))}
            </div>
            <div className="delivery-flow">
              <span>Khảo sát</span><i aria-hidden="true">→</i>
              <span>Thiết kế</span><i aria-hidden="true">→</i>
              <span>Thử nghiệm</span><i aria-hidden="true">→</i>
              <span>Triển khai</span>
            </div>
            <div className="board-watermark" aria-hidden="true">IAICT</div>
          </aside>
        </div>

        <div className="shell hero-pillar-rail" aria-label="Bốn trụ cột IAICT">
          {pillars.map((pillar, index) => (
            <Link href={pillar.href ?? "/"} key={pillar.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{pillar.title.replace("IAICT ", "")}</strong>
              <small>{pillar.summary}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="section premium-intent-section" aria-labelledby="intent-title">
        <div className="shell">
          <div className="section-heading premium-section-heading">
            <div>
              <p className="kicker">Bắt đầu từ nhu cầu</p>
              <h2 id="intent-title">Bạn đang cần giải quyết bài toán nào?</h2>
            </div>
            <p>
              Không bắt đầu bằng tên công nghệ. IAICT bắt đầu từ vấn đề cần giải quyết, điều kiện thực tế và kết quả cần đạt được.
            </p>
          </div>
          <div className="intent-grid premium-intent-grid">
            {intentCards.map((item, index) => (
              <Link className="intent-card premium-intent-card" href={item.href ?? "/"} key={item.title}>
                <div className="intent-card-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i aria-hidden="true">↗</i>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <b>Khám phá hướng triển khai</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section featured-project-section" aria-labelledby="featured-project-title">
        <div className="shell featured-project-shell">
          <div className="featured-project-copy">
            <p className="kicker kicker-light">Dự án ứng dụng tiêu biểu</p>
            <h2 id="featured-project-title">Trâm Rừng — từ dữ liệu hiện trường đến nền tảng quản lý số</h2>
            <p>
              Mô hình ứng dụng tại rừng phòng hộ kết nối IoT, dữ liệu cảm biến, truy xuất nguồn gốc và quản lý vòng đời trên một kiến trúc có khả năng vận hành ngoài thực địa và đồng bộ dữ liệu về máy chủ.
            </p>
            <div className="project-capability-list">
              {projectCapabilities.map((item) => (
                <span key={item}><i aria-hidden="true">✓</i>{item}</span>
              ))}
            </div>
            <div className="hero-actions">
              <Link className="button project-button" href="/du-an">Xem nhóm dự án <span aria-hidden="true">→</span></Link>
              <Link className="project-text-link" href="/lien-he">Trao đổi mô hình tương tự</Link>
            </div>
          </div>

          <div className="project-system-map" aria-label="Mô hình hệ thống dự án Trâm Rừng">
            <div className="map-grid" aria-hidden="true" />
            <div className="map-node map-node-field">
              <span>01</span><strong>Hiện trường</strong><small>Cảm biến • IoT</small>
            </div>
            <div className="map-link map-link-a" aria-hidden="true"><span /></div>
            <div className="map-node map-node-edge">
              <span>02</span><strong>Gateway</strong><small>Thu thập • 4G</small>
            </div>
            <div className="map-link map-link-b" aria-hidden="true"><span /></div>
            <div className="map-node map-node-core">
              <span>03</span><strong>Data Core</strong><small>Server • Database</small>
            </div>
            <div className="map-link map-link-c" aria-hidden="true"><span /></div>
            <div className="map-node map-node-app">
              <span>04</span><strong>Nền tảng</strong><small>Quản lý • Truy xuất</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tint premium-products-section" aria-labelledby="products-title">
        <div className="shell">
          <div className="section-heading premium-section-heading">
            <div>
              <p className="kicker">IAICT Technology</p>
              <h2 id="products-title">Sản phẩm & nền tảng theo hướng mô-đun</h2>
            </div>
            <div className="section-side-copy">
              <p>Từng nhóm có thể triển khai độc lập hoặc ghép thành kiến trúc tổng thể theo bài toán.</p>
              <Link className="text-link" href="/san-pham-nen-tang">Xem toàn bộ nhóm sản phẩm →</Link>
            </div>
          </div>
          <div className="compact-card-grid premium-product-grid">
            {productGroups.slice(0, 6).map((item, index) => (
              <article className="compact-card premium-product-card" key={item.title}>
                <div className="product-card-index">T{String(index + 1).padStart(2, "0")}</div>
                <span>Technology Module</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div className="product-card-line" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section premium-solutions-section" aria-labelledby="solutions-title">
        <div className="shell split-heading premium-solution-layout">
          <div className="solution-intro">
            <p className="kicker">IAICT Solutions</p>
            <h2 id="solutions-title">Không chỉ bàn giao phần mềm. Bàn giao khả năng vận hành.</h2>
            <p className="body-copy">
              Phạm vi có thể đi từ khảo sát hiện trạng, kiến trúc, phát triển, tích hợp đến cấu hình, chuyển giao và đồng hành vận hành.
            </p>
            <Link className="text-link" href="/giai-phap-dich-vu">Khám phá năng lực triển khai →</Link>
          </div>
          <div className="service-list premium-service-list">
            {solutionGroups.map((item, index) => (
              <div key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
                <small>{item.summary}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section transfer-section" aria-labelledby="transfer-title">
        <div className="shell">
          <div className="section-heading premium-section-heading transfer-heading">
            <div>
              <p className="kicker kicker-light">IAICT Transfer</p>
              <h2 id="transfer-title">Một chu trình từ bài toán đến khả năng làm chủ công nghệ</h2>
            </div>
            <p>Quy trình đủ chặt để kiểm soát chất lượng, nhưng đủ linh hoạt để phù hợp thực tế triển khai.</p>
          </div>
          <div className="transfer-steps">
            {transferSteps.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section academy-section premium-academy-section" aria-labelledby="academy-title">
        <div className="shell academy-grid premium-academy-grid">
          <div className="academy-copy premium-academy-copy">
            <p className="kicker kicker-light">IAICT Academy</p>
            <h2 id="academy-title">Đào tạo & tập huấn gắn trực tiếp với công việc</h2>
            <p>
              Nội dung được tổ chức theo đối tượng, mục tiêu, module, thời lượng, hình thức và tình huống công việc — phù hợp cả cơ quan nhà nước và doanh nghiệp.
            </p>
            <div className="hero-actions">
              <Link className="button button-light" href="/dao-tao-tap-huan">Xem phân hệ đào tạo</Link>
              <Link className="button button-ghost" href="/dao-tao-tap-huan/co-quan-nha-nuoc">Dành cho cơ quan nhà nước</Link>
            </div>
          </div>
          <div className="academy-matrix premium-academy-matrix" aria-label="Cấu trúc phân hệ đào tạo">
            <div><span>01</span><strong>Đối tượng</strong><small>Lãnh đạo • chuyên viên • đơn vị</small></div>
            <div><span>02</span><strong>Mục tiêu</strong><small>Năng lực cần đạt sau khóa học</small></div>
            <div><span>03</span><strong>Module</strong><small>Nội dung theo công việc thực tế</small></div>
            <div><span>04</span><strong>Triển khai</strong><small>Trực tiếp • trực tuyến • kết hợp</small></div>
          </div>
        </div>
      </section>

      <section className="section premium-editorial-section">
        <div className="shell editorial-grid premium-editorial-grid">
          <div className="editorial-intro">
            <p className="kicker">Dữ liệu có kiểm soát</p>
            <h2>Nội dung công khai phải đi cùng bằng chứng và nguồn dữ liệu rõ ràng</h2>
            <p>Website được thiết kế để kết nối dần với CMS, dữ liệu dự án, chuyên gia, đối tác, tin tức và sự kiện thay vì hard-code thông tin chưa được xác minh.</p>
          </div>
          <div className="editorial-placeholders">
            <DataPlaceholder label="CMS / Articles" title="Tin tức & sự kiện chính thức" description="Nội dung sẽ được xuất bản qua quy trình biên tập và phân loại." />
            <DataPlaceholder label="CMS / Experts" title="Chuyên gia & giảng viên" description="Chỉ hiển thị hồ sơ và thông tin được phép công khai." />
          </div>
        </div>
      </section>

      <section className="section section-compact premium-final-section">
        <div className="shell final-cta premium-final-cta">
          <div>
            <p className="kicker kicker-light">Bắt đầu từ bài toán thật</p>
            <h2>Trao đổi nhu cầu với IAICT</h2>
            <p>Chúng tôi cùng làm rõ mục tiêu, dữ liệu, hạ tầng, phạm vi và lộ trình trước khi lựa chọn công nghệ.</p>
          </div>
          <div className="final-cta-actions">
            <Link className="button button-light" href="/lien-he">Liên hệ & Hợp tác</Link>
            <Link className="final-cta-link" href="/gioi-thieu">Tìm hiểu về IAICT →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
