import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { newsCategories } from "@/lib/public-content";
import styles from "@/components/public.module.css";

export const metadata: Metadata = {
  title: "Tin tức & Tri thức",
  description: "Tin tức, sự kiện và góc nhìn chuyên môn từ IAICT về công nghệ, dữ liệu, AI, IoT và chuyển đổi số.",
};

const editorialTopics = [
  ["AI & Công vụ", "AI có kiểm soát trong môi trường công vụ", "Quy trình, dữ liệu, quyền truy cập và cơ chế rà soát là nền tảng để AI đi vào công việc thực tế."],
  ["Chuyển đổi số", "Tái thiết kế quy trình trước khi số hóa", "Số hóa hiệu quả bắt đầu từ việc hiểu hiện trạng, chuẩn hóa dữ liệu và làm rõ trách nhiệm trong quy trình."],
  ["IoT & Dữ liệu", "Từ sensor đến dữ liệu có giá trị", "Giá trị không nằm ở thiết bị riêng lẻ mà ở chuỗi thu thập, kiểm tra, truyền dẫn, lưu trữ và khai thác nhất quán."],
] as const;

const editorialStyle = {
  "--editorial-image": "url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&fm=jpg&q=84&w=1800')",
} as CSSProperties;

export default function NewsPage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.editorialHero}>
        <div className={`shell ${styles.editorialHeroGrid}`}>
          <div>
            <p className={styles.kicker}>IAICT News & Knowledge</p>
            <h1>Tin tức, hoạt động và góc nhìn chuyên môn.</h1>
            <p className={styles.lead}>Khu vực nội dung được tổ chức theo tinh thần một newsroom của Viện: thông tin chính thức, tri thức ứng dụng, sự kiện – tập huấn và các chủ đề chính sách có liên quan tới công nghệ.</p>
          </div>
          <div className={styles.editorialMedia} style={editorialStyle} aria-hidden="true">
            <div><span>IAICT / Editorial Desk</span><strong>Thông tin rõ nguồn. Chủ đề có chiều sâu. Nội dung có ngữ cảnh.</strong></div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Editorial Topics</p><h2>Những chủ đề IAICT theo đuổi.</h2></div>
            <p>Các khối dưới đây là cấu trúc biên tập và chủ đề chuyên môn, không được trình bày như bài báo đã xuất bản. Khi CMS được kết nối, danh sách nội dung sẽ kế thừa hệ phân loại này.</p>
          </div>
          <div className={styles.topicChips} aria-label="Chuyên mục tin tức">
            {newsCategories.map((item) => <span className={styles.chip} key={item}>{item}</span>)}
          </div>
          <div className={styles.editorialGrid}>
            <article className={styles.editorialFeature}>
              <span>IAICT Knowledge / Applied AI</span>
              <h2>AI có kiểm soát trong môi trường công vụ.</h2>
              <p>Một chủ đề trọng tâm cho thấy cách IAICT nhìn AI như một phần của quy trình, dữ liệu, quyền truy cập và cơ chế kiểm tra — thay vì một công cụ tách rời.</p>
              <small>Chủ đề biên tập · chưa phải bài viết xuất bản</small>
            </article>
            <div className={styles.storyStack}>
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
          <div className={styles.newsGrid}>
            {editorialTopics.map(([tag, title, body]) => (
              <article className={styles.newsCard} key={title}>
                <span>{tag}</span><h3>{title}</h3><p>{body}</p><small>IAICT / Chủ đề biên tập</small>
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
              <strong>Chỉ hiển thị sự kiện khi nguồn nội dung chính thức đã được kết nối và xác minh.</strong>
              <p>Giao diện sẵn sàng cho trạng thái có dữ liệu, chưa có dữ liệu và nội dung sắp diễn ra mà không cần tạo bài viết giả để lấp chỗ trống.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
