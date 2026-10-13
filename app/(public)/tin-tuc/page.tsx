import type { Metadata } from "next";
import { newsCategories } from "@/lib/public-content";
import styles from "@/components/institutional-v8.module.css";

export const metadata: Metadata = {
  title: "Tin tức & Tri thức",
  description: "Tin tức, sự kiện và góc nhìn chuyên môn từ IAICT về công nghệ, dữ liệu, AI, IoT và chuyển đổi số.",
};

const editorialTopics = [
  ["AI & Công vụ", "AI có kiểm soát trong môi trường công vụ", "Quy trình, dữ liệu, quyền truy cập và cơ chế rà soát là nền tảng để AI đi vào công việc thực tế."],
  ["Chuyển đổi số", "Tái thiết kế quy trình trước khi số hóa", "Số hóa hiệu quả bắt đầu từ việc hiểu hiện trạng, chuẩn hóa dữ liệu và làm rõ trách nhiệm trong quy trình."],
  ["IoT & Dữ liệu", "Từ sensor đến dữ liệu có giá trị", "Giá trị không nằm ở thiết bị riêng lẻ mà ở chuỗi thu thập, kiểm tra, truyền dẫn, lưu trữ và khai thác nhất quán."],
] as const;

export default function NewsPage() {
  return (
    <main id="main-content">
      <section className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <div>
            <p className={styles.eyebrow}>IAICT News & Knowledge</p>
            <h1>Tin tức, hoạt động và góc nhìn chuyên môn.</h1>
            <p className={styles.heroLead}>Không chỉ là một dòng tin. Khu vực này được tổ chức để kết nối hoạt động của Viện với các chủ đề công nghệ, dữ liệu, chuyển đổi số, đào tạo và kinh nghiệm triển khai thực tế.</p>
          </div>
          <aside className={styles.heroPanel} aria-label="Các dòng nội dung của IAICT">
            <span className={styles.heroPanelLabel}>Editorial Structure</span>
            <div className={styles.signalList}>
              <div className={styles.signalRow}><span>01</span><div><strong>News</strong><small>Hoạt động và thông tin chính thức.</small></div></div>
              <div className={styles.signalRow}><span>02</span><div><strong>Knowledge</strong><small>Góc nhìn chuyên môn và kinh nghiệm triển khai.</small></div></div>
              <div className={styles.signalRow}><span>03</span><div><strong>Events</strong><small>Hội thảo, tập huấn và hoạt động chuyên đề.</small></div></div>
              <div className={styles.signalRow}><span>04</span><div><strong>Policy</strong><small>Chính sách, văn bản và bối cảnh liên quan.</small></div></div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Editorial Topics</p><h2>Những chủ đề IAICT theo đuổi.</h2></div>
            <p>Các thẻ dưới đây là cấu trúc biên tập và chủ đề chuyên môn, không được trình bày như bài báo đã xuất bản. Khi CMS được kết nối, danh sách nội dung sẽ kế thừa hệ phân loại này.</p>
          </div>
          <div className={styles.chips} aria-label="Chuyên mục tin tức">
            {newsCategories.map((item) => <span className={styles.chip} key={item}>{item}</span>)}
          </div>
          <div className={styles.editorialGrid}>
            <article className={styles.feature}>
              <span>IAICT Knowledge / Applied AI</span>
              <h2>AI có kiểm soát trong môi trường công vụ.</h2>
              <p>Một chủ đề trọng tâm cho thấy cách IAICT nhìn AI như một phần của quy trình, dữ liệu, quyền truy cập và cơ chế kiểm tra — thay vì một công cụ tách rời.</p>
              <small>Chủ đề biên tập · chưa phải bài viết xuất bản</small>
            </article>
            <div className={styles.editorialSide}>
              <article className={styles.story}><span>Process / Digital</span><h3>Tái thiết kế quy trình trước khi số hóa</h3><p>Chuẩn hóa quy trình và dữ liệu trước khi đưa lên nền tảng số.</p></article>
              <article className={styles.story}><span>Field Data / IoT</span><h3>Từ sensor đến dữ liệu có giá trị</h3><p>Thiết kế một chuỗi dữ liệu hiện trường có thể kiểm soát và khai thác lâu dài.</p></article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Knowledge Stream</p><h2>Ba hướng nội dung chuyên môn.</h2></div>
            <p>Khi dữ liệu bài viết được kết nối, các hướng này có thể mở rộng thành series, case study, hướng dẫn kỹ thuật hoặc tài liệu phục vụ đào tạo.</p>
          </div>
          <div className={styles.newsStrip}>
            {editorialTopics.map(([tag, title, body]) => (
              <article className={styles.newsCard} key={title}>
                <span>{tag}</span>
                <h3>{title}</h3>
                <p>{body}</p>
                <small>IAICT / Chủ đề biên tập</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.eventPanel}>
            <div className={styles.eventIntro}>
              <p className={styles.label}>Events & Activities</p>
              <h3>Sự kiện – Hội thảo – Tập huấn</h3>
              <p>Khu vực dành cho các hoạt động có thời gian, địa điểm, đơn vị phối hợp và trạng thái xuất bản rõ ràng.</p>
            </div>
            <div className={styles.eventState}>
              <span>CMS / Structured Content</span>
              <strong>Dữ liệu sự kiện sẽ được hiển thị khi nguồn nội dung chính thức được kết nối.</strong>
              <p>Giao diện đã sẵn sàng cho các trạng thái có dữ liệu, chưa có dữ liệu và nội dung sắp diễn ra mà không cần dùng bài viết giả để lấp chỗ trống.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
