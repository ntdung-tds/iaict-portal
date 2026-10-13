import Link from "next/link";
import type { Metadata } from "next";
import { newsCategories } from "@/lib/public-content";

export const metadata: Metadata = { title: "Tin tức" };

const editorialStreams = [
  { code: "NEWS", title: "Tin hoạt động Viện", text: "Các hoạt động, chương trình và thông tin do IAICT công bố." },
  { code: "EVENT", title: "Sự kiện & Hội thảo", text: "Lịch, nội dung và thông tin liên quan đến các sự kiện chuyên môn." },
  { code: "INSIGHT", title: "Khoa học, công nghệ & chuyển đổi số", text: "Nội dung chuyên môn theo các lĩnh vực IAICT quan tâm và triển khai." },
];

const officialSources = [
  { title: "Bộ Khoa học và Công nghệ", text: "Nguồn tham khảo chính thống về khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số." },
  { title: "Cổng Thông tin điện tử Chính phủ", text: "Nguồn tham khảo chính thống cho thông tin điều hành, chính sách và hoạt động Chính phủ." },
];

export default function NewsPage() {
  return (
    <main id="main-content" className="news-page">
      <section className="news-hero">
        <div className="news-hero-grid" aria-hidden="true" />
        <div className="shell news-hero-inner">
          <div>
            <div className="news-breadcrumb"><Link href="/">IAICT</Link><span>/</span><b>Tin tức</b></div>
            <p className="kicker">Tin tức & Sự kiện</p>
            <h1>Kênh thông tin chính thức của IAICT</h1>
            <p className="page-lead">Theo dõi hoạt động của Viện, các chương trình chuyên môn, sự kiện, hội thảo và nội dung tham khảo từ những nguồn chính thống.</p>
          </div>
          <aside className="news-hero-panel">
            <span>Editorial principles</span>
            <strong>Rõ nguồn. Đúng ngữ cảnh. Có kiểm chứng.</strong>
            <p>Nội dung xuất bản được tổ chức theo chuyên mục và nguồn, giúp người đọc phân biệt thông tin của IAICT với nội dung tham khảo bên ngoài.</p>
          </aside>
        </div>
      </section>

      <section className="section news-stream-section">
        <div className="shell">
          <div className="news-section-heading">
            <div><p className="kicker">Luồng nội dung</p><h2>Ba dòng thông tin chính</h2></div>
            <p>Thiết kế để tin tức hỗ trợ việc hiểu năng lực và hoạt động của Viện, nhưng không lấn át sản phẩm, giải pháp và đào tạo.</p>
          </div>
          <div className="news-stream-grid">
            {editorialStreams.map((stream, index) => (
              <article key={stream.code}>
                <div className="news-stream-top"><span>{stream.code}</span><i>{String(index + 1).padStart(2, "0")}</i></div>
                <h3>{stream.title}</h3>
                <p>{stream.text}</p>
                <b>Nội dung đang được cập nhật</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint news-categories-section">
        <div className="shell">
          <div className="news-section-heading compact">
            <div><p className="kicker">Chuyên mục</p><h2>Đi theo chủ đề bạn quan tâm</h2></div>
          </div>
          <div className="chip-cloud premium-chip-cloud" aria-label="Chuyên mục tin tức">
            {newsCategories.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </section>

      <section className="section official-source-section">
        <div className="shell official-source-grid">
          <div className="official-source-copy">
            <p className="kicker">Nguồn tham khảo chính thống</p>
            <h2>Mở rộng góc nhìn nhưng vẫn giữ rõ nguồn thông tin</h2>
            <p>Khu vực này được chuẩn bị để kết nối các luồng thông tin từ nguồn chính thống. Nội dung bên ngoài sẽ luôn được nhận diện rõ, không trình bày như nội dung do IAICT tự công bố.</p>
            <Link className="text-link" href="/tim-kiem">Tìm kiếm nội dung →</Link>
          </div>
          <div className="official-source-cards">
            {officialSources.map((source, index) => (
              <article key={source.title}>
                <span>Source {String(index + 1).padStart(2, "0")}</span>
                <h3>{source.title}</h3>
                <p>{source.text}</p>
                <b>Khu vực kết nối nguồn</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-compact news-final-section">
        <div className="shell news-final-card">
          <div><p className="kicker kicker-light">Thông tin & Hợp tác</p><h2>Có thông tin cần trao đổi với IAICT?</h2><p>Liên hệ Viện để trao đổi về hoạt động, sự kiện, chương trình chuyên môn hoặc cơ hội hợp tác.</p></div>
          <Link className="button button-light" href="/lien-he">Liên hệ IAICT</Link>
        </div>
      </section>
    </main>
  );
}
