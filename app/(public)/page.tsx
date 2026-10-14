import Link from "next/link";
import { HomeNewsroom } from "@/components/home/home-newsroom";
import { HomeHero } from "@/components/home/home-hero";
import styles from "@/components/home/home.module.css";
import { pillars } from "@/lib/public-content";

const capabilities = [
  ["01", "AI & DATA", "Dữ liệu · GenAI · Tự động hóa"],
  ["02", "IOT & MONITORING", "Sensor · Edge · Quan trắc"],
  ["03", "DIGITAL TRANSFORMATION", "Quy trình · Nền tảng · Vận hành"],
  ["04", "TRACEABILITY", "Truy xuất · Vòng đời · Minh bạch"],
  ["05", "TECHNOLOGY TRANSFER", "PoC · Chuẩn hóa · Chuyển giao"],
  ["06", "PUBLIC SECTOR TRAINING", "AI · Dữ liệu · Năng lực số"],
];

const needs = [
  {
    no: "01",
    title: "Chuyển đổi số có trọng tâm",
    body: "Bắt đầu từ quy trình, dữ liệu và bài toán vận hành; lựa chọn công nghệ sau khi đã xác định rõ mục tiêu.",
    narrative: "Phù hợp với đơn vị đang có nhiều nhu cầu hoặc sáng kiến rời rạc nhưng chưa có thứ tự ưu tiên, tiêu chí đo và lộ trình triển khai thống nhất.",
    points: ["Rà soát quy trình, dữ liệu và hệ thống hiện có", "Xác định điểm nghẽn và nhóm ưu tiên", "Chia lộ trình theo giai đoạn và khả năng tiếp nhận"],
    output: "Bản đồ ưu tiên · lộ trình · tiêu chí đánh giá",
    tags: ["Roadmap", "Process", "Governance"],
    href: "/giai-phap-dich-vu",
    meta: "Strategy / Process / Data",
  },
  {
    no: "02",
    title: "AI & dữ liệu cho công việc thực",
    body: "Tổ chức dữ liệu, xây dựng luồng xử lý và ứng dụng AI theo từng nhiệm vụ thay vì triển khai công nghệ rời rạc.",
    narrative: "Trọng tâm là dữ liệu đầu vào, quyền truy cập, cách kiểm tra kết quả và vị trí AI tham gia vào quy trình — không chỉ dừng ở một chatbot độc lập.",
    points: ["Chuẩn hóa nguồn dữ liệu và luồng xử lý", "Gắn AI với nhiệm vụ, vai trò và quyền truy cập", "Thiết kế cơ chế kiểm tra và phản hồi đầu ra"],
    output: "Luồng dữ liệu · nguyên mẫu AI · tiêu chí kiểm soát",
    tags: ["AI", "Data", "Workflow"],
    href: "/san-pham-nen-tang#ai-du-lieu",
    meta: "AI / Data / Workflow",
  },
  {
    no: "03",
    title: "IoT & dữ liệu hiện trường",
    body: "Kết nối cảm biến, gateway, truyền dẫn, server và cơ sở dữ liệu thành một chuỗi vận hành có thể kiểm soát.",
    narrative: "Thiết kế ưu tiên dữ liệu đến được server ổn định, có thể kiểm tra và lưu trữ có cấu trúc trước khi bổ sung các lớp phân tích hoặc tự động hóa.",
    points: ["Cảm biến, gateway, nguồn và kết nối phù hợp hiện trường", "Luồng dữ liệu từ thiết bị về server/CSDL", "Giám sát trạng thái và hỗ trợ vận hành"],
    output: "Kiến trúc IoT · luồng dữ liệu · cấu hình vận hành",
    tags: ["Sensor", "Edge", "Server"],
    href: "/san-pham-nen-tang#iot-quan-trac",
    meta: "Sensor / Edge / Server",
  },
  {
    no: "04",
    title: "Chuyển giao & nâng cao năng lực",
    body: "Đưa kết quả thử nghiệm thành quy trình, tài liệu, cấu hình và năng lực để đơn vị tiếp nhận có thể vận hành lâu dài.",
    narrative: "Một dự án chỉ thực sự hoàn thành khi người tiếp nhận hiểu cách cấu hình, vận hành, xử lý tình huống và tiếp tục phát triển hệ thống sau bàn giao.",
    points: ["Chuẩn hóa tài liệu và cấu hình bàn giao", "Đào tạo theo vai trò và nhiệm vụ thực tế", "Hỗ trợ sau tiếp nhận và mở rộng khi cần"],
    output: "Tài liệu · đào tạo · cơ chế hỗ trợ sau bàn giao",
    tags: ["Transfer", "Academy", "Support"],
    href: "/chuyen-giao-cong-nghe",
    meta: "Transfer / Academy",
  },
];

const journey = [
  ["01", "DISCOVER", "Hiểu đúng bài toán", "Khảo sát nhu cầu, quy trình, dữ liệu, hiện trạng kỹ thuật và tiêu chí thành công."],
  ["02", "DESIGN", "Thiết kế giải pháp", "Xác định kiến trúc, phạm vi, tích hợp, dữ liệu và cách đo hiệu quả triển khai."],
  ["03", "PROVE", "Kiểm chứng thực tế", "Xây dựng PoC hoặc giai đoạn thử nghiệm để giảm rủi ro trước khi mở rộng."],
  ["04", "TRANSFER", "Chuẩn hóa & chuyển giao", "Hoàn thiện tài liệu, cấu hình, đào tạo và cơ chế vận hành cho đơn vị tiếp nhận."],
  ["05", "SCALE", "Nhân rộng có kiểm soát", "Mở rộng khi mô hình, dữ liệu và quy trình đã đủ ổn định để vận hành bền vững."],
];

const expertise = [
  ["01", "AI & Dữ liệu", "Từ dữ liệu phân tán đến hệ thống hỗ trợ công việc, phân tích và ra quyết định."],
  ["02", "IoT & Hệ thống", "Từ cảm biến hiện trường đến hạ tầng kết nối, server, cơ sở dữ liệu và dashboard."],
  ["03", "Chuyển đổi số", "Từ nhu cầu nghiệp vụ đến quy trình số, nền tảng, tích hợp và vận hành."],
  ["04", "Đào tạo & Chuyển giao", "Từ công nghệ đến năng lực sử dụng, quản trị và làm chủ hệ thống."],
];

const knowledge = [
  ["AI & Công vụ", "AI có kiểm soát trong môi trường công vụ", "Cách gắn AI với quy trình, dữ liệu, quyền truy cập và cơ chế kiểm tra."],
  ["Chuyển đổi số", "Tái thiết kế quy trình trước khi số hóa", "Số hóa hiệu quả bắt đầu từ việc hiểu và cải tiến cách công việc đang được thực hiện."],
  ["IoT & Dữ liệu", "Từ sensor đến dữ liệu có giá trị", "Một chuỗi dữ liệu tốt cần thu thập, kiểm tra, truyền dẫn, lưu trữ và khai thác nhất quán."],
  ["IAICT Academy", "Năng lực AI theo vị trí việc làm", "Đào tạo theo nhiệm vụ, tình huống và trách nhiệm cụ thể giúp AI đi vào công việc thực tế."],
];

export default function HomePage() {
  return (
    <main id="main-content" className="ia-home">
      <HomeHero />

      <section className={`${styles.capabilityBar} ia-capability`} aria-label="Năng lực nổi bật">
        <div className={`shell ${styles.capabilityInner}`}>
          {capabilities.map(([no, title, body]) => (
            <div className={`${styles.capabilityItem} ia-capability-item`} key={title}>
              <span>{no}</span>
              <strong>{title}</strong>
              <small>{body}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="ia-entry" aria-label="Khám phá theo nhu cầu">
        <div className="shell">
          <div className="ia-entry-label"><strong>Khám phá IAICT theo nhu cầu của bạn</strong><span>Công nghệ phù hợp. Lộ trình rõ ràng.</span></div>
          <div className="ia-entry-grid">
            <Link href="/san-pham-nen-tang#ai-du-lieu"><span className="ia-entry-icon" aria-hidden="true">AI</span><span><strong>AI & Dữ liệu</strong><small>Ứng dụng vào công việc</small></span><span aria-hidden="true">↗</span></Link>
            <Link href="/san-pham-nen-tang#iot-quan-trac"><span className="ia-entry-icon" aria-hidden="true">IoT</span><span><strong>IoT & Quan trắc</strong><small>Kết nối dữ liệu hiện trường</small></span><span aria-hidden="true">↗</span></Link>
            <Link href="/giai-phap-dich-vu"><span className="ia-entry-icon" aria-hidden="true">DX</span><span><strong>Giải pháp số</strong><small>Thiết kế theo nhu cầu</small></span><span aria-hidden="true">↗</span></Link>
            <Link href="/dao-tao-tap-huan"><span className="ia-entry-icon" aria-hidden="true">ED</span><span><strong>Đào tạo & Tập huấn</strong><small>Nâng cao năng lực đội ngũ</small></span><span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className={`${styles.sectionIntro} ia-needs`} aria-labelledby="needs-title">
        <div className="shell">
          <div className={`${styles.editorialHeading} ia-section-heading`}>
            <div>
              <p className={styles.label}>From problem to capability</p>
              <h2 id="needs-title">Bài toán đúng trước.<br />Công nghệ sau.</h2>
            </div>
            <div className={styles.headingSide}>
              <span className={styles.headingRule} />
              <p>IAICT tiếp cận công nghệ từ nhu cầu vận hành, dữ liệu và khả năng làm chủ của tổ chức. Mỗi giải pháp cần trả lời rõ: giải quyết vấn đề gì, vận hành ra sao và chuyển giao như thế nào.</p>
            </div>
          </div>

          <div className="ia-service-list">
            {needs.map((item) => (
              <article className="ia-service-row" key={item.no}>
                <span className="ia-service-no">{item.no}</span>
                <div className="ia-service-copy">
                  <span className="ia-service-meta">{item.meta}</span>
                  <h3><Link href={item.href}>{item.title}<span aria-hidden="true">↗</span></Link></h3>
                  <p>{item.body}</p>
                  <details className="ia-service-details">
                    <summary>Hướng tiếp cận & đầu ra</summary>
                    <div><p>{item.narrative}</p><ul>{item.points.map(point => <li key={point}>{point}</li>)}</ul><strong>{item.output}</strong></div>
                  </details>
                </div>
                <div className="ia-service-tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.ecosystemSection} ia-ecosystem`} aria-labelledby="ecosystem-title">
        <div className="shell">
          <div className={styles.ecosystemIntro}>
            <p className={styles.labelLight}>IAICT Ecosystem</p>
            <h2 id="ecosystem-title">Một hệ sinh thái.<br />Bốn năng lực liên kết.</h2>
            <p>Technology tạo nền tảng. Solutions đưa công nghệ vào bài toán cụ thể. Transfer giúp kết quả được tiếp nhận. Academy xây dựng năng lực để vận hành và phát triển tiếp.</p>
          </div>

          <div className={styles.ecosystemStack}>
            {pillars.map((pillar, index) => (
              <Link href={pillar.href ?? "/"} className={`${styles.ecosystemRow} ia-ecosystem-row`} key={pillar.title}>
                <span className={styles.ecosystemNo}>{String(index + 1).padStart(2, "0")}</span>
                <div><small>IAICT / {index === 0 ? "Technology" : index === 1 ? "Solutions" : index === 2 ? "Transfer" : "Academy"}</small><h3>{pillar.title}</h3></div>
                <p>{pillar.summary}</p>
                <b aria-hidden="true">↗</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.projectSection} ia-project`} aria-labelledby="project-title">
        <div className={`shell ${styles.projectSpotlight}`}>
          <div className={styles.projectNarrative}>
            <div className={styles.projectIndex}><span>PROJECT / 01</span><i /><span>FIELD SYSTEMS</span></div>
            <p className={styles.label}>IAICT Project Lab</p>
            <h2 id="project-title">Trâm Rừng.<br />Kết nối rừng với dữ liệu.</h2>
            <p className={styles.projectLead}>Một dự án cho thấy cách IAICT tiếp cận dữ liệu hiện trường: ưu tiên chuỗi thu thập đơn giản, kết nối linh hoạt, nguồn dự phòng và server làm trung tâm lưu trữ.</p>
            <div className={styles.projectFacts}>
              <span><small>Environment</small><strong>Outdoor</strong></span>
              <span><small>Connectivity</small><strong>4G</strong></span>
              <span><small>Power</small><strong>UPS</strong></span>
              <span><small>Core</small><strong>Server + DB</strong></span>
            </div>
            <Link className={styles.textAction} href="/du-an/tram-rung">Khám phá dự án <span>↗</span></Link>
          </div>

          <div className={`${styles.architecture} ia-project-architecture`} aria-label="Kiến trúc dữ liệu Trâm Rừng">
            <div className={styles.architectureTop}>
              <div><small>DATA ARCHITECTURE</small><strong>Field → Core → Application</strong></div>
              <span>TRÂM RỪNG</span>
            </div>
            <div className={styles.flowVisual}>
              <div className={styles.flowLine} aria-hidden="true" />
              {[
                ["01", "Sensor", "Thu thập"],
                ["02", "Edge", "Kiểm tra"],
                ["03", "4G", "Truyền dẫn"],
                ["04", "Server", "Lưu trữ"],
                ["05", "Apps", "Khai thác"],
              ].map(([no, title, body]) => (
                <div className={styles.flowNode} key={no}>
                  <span>{no}</span><i /><strong>{title}</strong><small>{body}</small>
                </div>
              ))}
            </div>
            <div className={styles.architectureNote}><span>DATA-FIRST</span><p>Giá trị bắt đầu từ dữ liệu được thu nhận ổn định, có cấu trúc và có thể kiểm tra.</p></div>
          </div>
        </div>
      </section>

      <section className={`${styles.journeySection} ia-journey`} aria-labelledby="journey-title">
        <div className="shell">
          <div className={`${styles.editorialHeading} ia-section-heading`}>
            <div><p className={styles.label}>IAICT Method</p><h2 id="journey-title">Từ nhu cầu đến<br />khả năng nhân rộng.</h2></div>
            <div className={styles.headingSide}><span className={styles.headingRule} /><p>Một dự án công nghệ chỉ hoàn chỉnh khi có thể đi qua đủ các lớp: hiểu bài toán, thiết kế, kiểm chứng, chuyển giao và mở rộng.</p></div>
          </div>
          <div className={styles.journeyLine}>
            {journey.map(([no, key, title, body]) => (
              <article className={`${styles.journeyStep} ia-journey-step`} key={key}>
                <div><span>{no}</span><i /></div>
                <small>{key}</small>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.expertiseSection} ia-expertise`} aria-labelledby="expertise-title">
        <div className={`shell ${styles.expertiseLayout}`}>
          <div className={styles.expertiseStatement}>
            <p className={styles.labelLight}>Core Expertise</p>
            <h2 id="expertise-title">Không chỉ làm phần mềm.<br />Chúng tôi thiết kế năng lực vận hành.</h2>
            <p>Công nghệ, dữ liệu, quy trình và con người cần được thiết kế cùng nhau. Đó là cách một hệ thống có thể tiếp tục tạo giá trị sau giai đoạn triển khai.</p>
            <Link className={styles.lightAction} href="/gioi-thieu">Tìm hiểu về IAICT <span>↗</span></Link>
          </div>
          <div className={styles.expertiseList}>
            {expertise.map(([no, title, body]) => (
              <article className="ia-expertise-card" key={title}><span>{no}</span><div><h3>{title}</h3><p>{body}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.gallerySection} ia-gallery`} aria-labelledby="gallery-title">
        <div className="shell">
          <div className={`${styles.editorialHeading} ia-section-heading`}>
            <div><p className={styles.label}>Capability Spaces</p><h2 id="gallery-title">Từ hiện trường<br />đến hệ thống số.</h2></div>
            <div className={styles.headingSide}><span className={styles.headingRule} /><p>Các không gian năng lực được tổ chức để người xem hiểu mối liên hệ giữa công nghệ, dữ liệu, vận hành và chuyển giao.</p></div>
          </div>
          <div className={styles.gallery}>
            <Link href="/du-an/tram-rung" className={`${styles.galleryCard} ${styles.galleryLead} ia-gallery-card ia-gallery-lead`}><span>01 / PROJECT</span><strong>Trâm Rừng</strong><small>IoT ngoài trời · dữ liệu hiện trường · server</small><b>↗</b></Link>
            <Link href="/san-pham-nen-tang#iot-quan-trac" className={`${styles.galleryCard} ia-gallery-card`}><span>02 / TECHNOLOGY</span><strong>IoT & Quan trắc</strong><small>Sensor · edge · connectivity</small><b>↗</b></Link>
            <Link href="/san-pham-nen-tang#ai-du-lieu" className={`${styles.galleryCard} ia-gallery-card`}><span>03 / DATA</span><strong>AI & Dữ liệu</strong><small>Workflow · analytics · intelligence</small><b>↗</b></Link>
            <Link href="/dao-tao-tap-huan" className={`${styles.galleryCard} ${styles.galleryWide} ia-gallery-card`}><span>04 / ACADEMY</span><strong>Năng lực số cho tổ chức</strong><small>AI · dữ liệu · kỹ năng số · chuyển giao</small><b>↗</b></Link>
          </div>
        </div>
      </section>

      <HomeNewsroom />

      <section className={`${styles.knowledgeSection} ia-knowledge`} aria-labelledby="knowledge-title">
        <div className="shell">
          <div className={styles.knowledgeHead}>
            <div><p className={styles.label}>IAICT Knowledge</p><h2 id="knowledge-title">Góc nhìn chuyên môn.</h2></div>
            <Link href="/tin-tuc">Xem Tin tức & Tri thức <span>↗</span></Link>
          </div>
          <div className={styles.knowledgeGrid}>
            {knowledge.map(([tag, title, body], index) => (
              <article className={`${styles.knowledgeCard} ia-knowledge-card ${index === 0 ? `${styles.knowledgeLead} ia-knowledge-lead` : ""}`} key={title}>
                <span>{tag}</span>
                <h3>{title}</h3>
                <p>{body}</p>
                <small>IAICT / Knowledge</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.closingSection} ia-closing`}>
        <div className={`shell ${styles.closingInner}`}>
          <div>
            <p className={styles.labelLight}>Collaborate with IAICT</p>
            <h2>Cùng biến bài toán thực tế<br />thành giải pháp triển khai được.</h2>
          </div>
          <div className={styles.closingAction}>
            <p>Trao đổi với IAICT về bài toán công nghệ, dữ liệu, IoT, chuyển đổi số, chuyển giao hoặc đào tạo.</p>
            <Link href="/lien-he">Liên hệ & Hợp tác <span>↗</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
