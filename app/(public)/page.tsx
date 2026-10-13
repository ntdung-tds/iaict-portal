import Link from "next/link";
import { WowHero } from "@/components/wow/wow-hero";
import styles from "@/components/wow/wow.module.css";
import { intentCards, pillars } from "@/lib/public-content";

const capabilities = [
  "AI & DATA",
  "IOT & MONITORING",
  "DIGITAL TRANSFORMATION",
  "TRACEABILITY",
  "TECHNOLOGY TRANSFER",
  "PUBLIC SECTOR TRAINING",
];

const journey = [
  ["01", "DISCOVER", "Hiểu đúng bài toán", "Khảo sát nhu cầu, bối cảnh vận hành và tiêu chí thành công trước khi chọn công nghệ."],
  ["02", "PROVE", "Thử nghiệm có tiêu chí", "Tạo PoC/demo để kiểm chứng khả năng triển khai và cách đo kết quả."],
  ["03", "TRANSFER", "Chuẩn hóa & chuyển giao", "Đóng gói quy trình, tài liệu, cấu hình và năng lực vận hành cho đơn vị tiếp nhận."],
  ["04", "SCALE", "Nhân rộng bền vững", "Mở rộng theo cụm, theo đơn vị hoặc theo địa bàn khi dữ liệu và mô hình đã đủ tin cậy."],
];

const knowledge = [
  ["AI & Công vụ", "AI có kiểm soát trong môi trường công vụ", "Gắn AI với quy trình, dữ liệu và cơ chế kiểm tra thay vì chỉ sử dụng như công cụ hỏi đáp."],
  ["Chuyển đổi số", "Tái thiết kế quy trình trước khi số hóa", "Số hóa quy trình chưa tốt chỉ làm tăng tốc một quy trình chưa tốt."],
  ["IoT", "Từ sensor đến dữ liệu có giá trị", "Giá trị không nằm ở cảm biến riêng lẻ mà ở chuỗi thu thập, kiểm tra, lưu trữ và khai thác."],
  ["Academy", "Năng lực AI theo vị trí việc làm", "Đào tạo theo nhiệm vụ và tình huống thực tế thay vì chỉ học công cụ."],
];

export default function HomePage() {
  return (
    <main id="main-content">
      <WowHero />

      <div className={styles.capabilityBar} aria-label="Năng lực nổi bật">
        <div className={`shell ${styles.capabilityInner}`}>
          {capabilities.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>

      <section className={styles.section} aria-labelledby="needs-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>Đi từ bài toán</p><h2 id="needs-title">Bạn đang cần giải quyết điều gì?</h2></div>
            <p>Bản demo tổ chức nội dung theo nhu cầu người dùng trước, sau đó mới dẫn đến công nghệ, giải pháp, chuyển giao hoặc đào tạo.</p>
          </div>
          <div className={styles.problemGrid}>
            {intentCards.slice(0, 4).map((item, index) => (
              <Link className={styles.problemCard} href={item.href ?? "/"} key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionDark} aria-labelledby="ecosystem-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>IAICT Ecosystem</p><h2 id="ecosystem-title">Bốn trụ cột, một hành trình triển khai.</h2></div>
            <p>Technology, Solutions, Transfer và Academy được kết nối thành một chu trình thay vì các mảng hoạt động rời rạc.</p>
          </div>
          <div className={styles.ecosystemGrid}>
            {pillars.map((pillar, index) => (
              <Link href={pillar.href ?? "/"} className={styles.ecosystemCard} key={pillar.title}>
                <span>0{index + 1}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.summary}</p>
                <b>Khám phá →</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionTint} aria-labelledby="project-title">
        <div className={`shell ${styles.projectSpotlight}`}>
          <div className={styles.projectCopy}>
            <p className={styles.label}>IAICT Project Lab · Case study</p>
            <h2 id="project-title">Trâm Rừng · Từ cảm biến ngoài trời đến dữ liệu có giá trị.</h2>
            <p>Mô hình trình bày hành trình dữ liệu từ hiện trường về hệ thống số. Nội dung kỹ thuật trên bản demo được mô tả ở mức kiến trúc, không thay thế hồ sơ triển khai chính thức.</p>
            <ul>
              <li>Thiết bị và cảm biến vận hành ngoài trời.</li>
              <li>Kết nối 4G linh hoạt theo điều kiện hiện trường.</li>
              <li>UPS/nguồn dự phòng để tăng tính liên tục.</li>
              <li>Server và cơ sở dữ liệu là trung tâm lưu trữ, khai thác.</li>
            </ul>
            <Link className={styles.primaryAction} href="/du-an/tram-rung">Mở case study Trâm Rừng</Link>
          </div>
          <div className={styles.architecture} aria-label="Luồng dữ liệu Trâm Rừng">
            <div className={styles.architectureTop}><span>DATA FLOW</span><small>Kiến trúc minh họa</small></div>
            <div className={styles.flow}>
              <div>Sensor<small>Thu thập</small></div>
              <div>Edge<small>Kiểm tra</small></div>
              <div>4G<small>Truyền dẫn</small></div>
              <div>Server<small>Lưu trữ</small></div>
              <div>Apps<small>Khai thác</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="journey-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>IAICT Value Journey</p><h2 id="journey-title">Từ nhu cầu đến khả năng nhân rộng.</h2></div>
            <p>Thay vì dùng một timeline lịch sử chưa được xác minh, bản demo mô tả hành trình tạo giá trị có thể áp dụng cho từng dự án.</p>
          </div>
          <div className={styles.journeyGrid}>
            {journey.map(([no, key, title, body]) => (
              <article className={styles.journeyCard} key={key}>
                <span>{no} · {key}</span><h3>{title}</h3><p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionTint} aria-labelledby="people-title">
        <div className={`shell ${styles.twoCol}`}>
          <div className={styles.expertPanel}>
            <p className={styles.label}>People & Expertise</p>
            <h3 id="people-title">Hiển thị năng lực trước, hồ sơ cá nhân sau khi xác minh.</h3>
            <p>Ở giai đoạn demo, hệ thống mô tả nhóm chuyên môn. Tên, chức danh, ảnh và đối tác chỉ xuất hiện khi có dữ liệu được duyệt.</p>
            <div className={styles.expertList}>
              <div><strong>AI & Dữ liệu</strong><span>Phân tích · GenAI · workflow</span></div>
              <div><strong>IoT & Hệ thống</strong><span>Sensor · edge · integration</span></div>
              <div><strong>Chuyển đổi số</strong><span>Quy trình · dữ liệu · vận hành</span></div>
            </div>
          </div>
          <div className={styles.mapPanel}>
            <p className={styles.label}>Deployment Canvas</p>
            <h3>Thiết kế để có thể triển khai theo cụm và mở rộng.</h3>
            <p>Bản đồ bên dưới là minh họa trải nghiệm, không phải bản đồ các điểm IAICT đã triển khai thực tế.</p>
            <div className={styles.map} aria-label="Bản đồ minh họa khả năng nhân rộng">
              <i className={`${styles.mapNode} ${styles.mapNorth}`} />
              <i className={`${styles.mapNode} ${styles.mapCentral}`} />
              <i className={`${styles.mapNode} ${styles.mapSouth}`} />
              <span className={styles.mapCaption}>DEMO CANVAS · Thử nghiệm → Chuẩn hóa → Nhân rộng → Quản trị tập trung</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionDark} aria-labelledby="gallery-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>Project Gallery</p><h2 id="gallery-title">Không gian trực quan cho dự án và năng lực.</h2></div>
            <p>Các khối hình hiện là visual demo. Khi có ảnh thật, media library sẽ thay trực tiếp mà không cần đổi bố cục.</p>
          </div>
          <div className={styles.gallery}>
            <div className={styles.galleryCard}><span>Project Lab</span><strong>Trâm Rừng · IoT hiện trường</strong></div>
            <div className={styles.galleryCard}><span>Technology</span><strong>IoT & Quan trắc</strong></div>
            <div className={styles.galleryCard}><span>Data</span><strong>Truy xuất & vòng đời</strong></div>
            <div className={styles.galleryCard}><span>Academy</span><strong>AI, dữ liệu và năng lực số cho khu vực công</strong></div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="knowledge-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>Knowledge Stream</p><h2 id="knowledge-title">Nội dung chuyên môn có cấu trúc.</h2></div>
            <p>Giai đoạn sau, khu vực này sẽ lấy bài viết thật từ CMS. Hiện các tiêu đề là mẫu nội dung minh họa cho trải nghiệm.</p>
          </div>
          <div className={styles.stream}>
            {knowledge.map(([tag, title, body]) => <article className={styles.streamCard} key={title}><span>{tag}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section section-compact">
        <div className="shell final-cta final-cta-strong">
          <div><p className="kicker">Full Demo / Provider-neutral</p><h2>Trải nghiệm trước. Chốt hạ tầng sau.</h2><p>Bản Vercel này là môi trường để khách hàng duyệt đầy đủ UX, nội dung và nghiệp vụ trước khi quyết định phương án production.</p></div>
          <Link className="button button-primary" href="/lien-he">Liên hệ & Hợp tác</Link>
        </div>
      </section>
    </main>
  );
}
